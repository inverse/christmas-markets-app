/**
 * Drawer swipe/snap/close state machine tests (MarketList.svelte).
 *
 * MOUNTING NOTE: Mounting MarketList.svelte in this suite is genuinely
 * impossible today. The repo has NO DOM environment wired into vitest
 * (no happy-dom or jsdom in devDependencies, no test.environment in
 * vite.config.ts) and no @testing-library/svelte; vitest's default
 * "node" environment cannot run Svelte 5 client-side mounts.
 * Installing happy-dom (plus @testing-library/svelte or a bare `mount`)
 * would churn package.json/package-lock while sibling slices edit
 * concurrently, so per the task contract this file tests a SMALL LOCAL
 * REIMPLEMENTATION of the component's touch/snap/close logic instead:
 * the harness below mirrors the component's handlers line for line
 * (MarketList.svelte lines 74-152) with an injectable clock so
 * velocity/timing is deterministic. If the handlers are ever extracted
 * into src/lib/utils (e.g. createDrawerGesture({ onClose, panelWidth })),
 * delete the harness and import the real functions; the test bodies
 * stay identical.
 *
 * STATE MACHINE (documented for the report, mirrored by the harness):
 * - idle: isDragging=false, offsetPct=0, axis=null
 *   - close() (backdrop click, Escape, fling/threshold) -> closing
 *   - touchstart (1 touch, not .drag-guard, not closing) -> touch-down
 * - touch-down: isDragging=true, axis=null, velocity=0
 *   - move <8px both axes -> stay (deadzone, no preventDefault)
 *   - move |dy|>=|dx| -> axis='y', isDragging=false (native scroll takes over)
 *   - move |dx|>|dy| -> axis='x', dragging (offsetPct clamped [-100,0])
 *   - touchcancel -> idle (snapBack)
 *   - touchend: axis==='x' -> offsetPct<-25 OR (offsetPct<-8 AND
 *     velocity<-0.35 px/ms) -> closing; else -> idle (snapBack)
 * - dragging (axis='x'): same end/cancel transitions as above
 * - closing: isClosing=true, offsetPct=-100; further close() calls are
 *   no-ops (chokepoint); after 280ms runs after?.() then onClose()
 * - backdropOpacity = 1 + offsetPct/100 (dims to 0 as the panel slides out)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const SNAP_THRESHOLD_PCT = 25;
const FLING_VELOCITY = 0.35; // px per ms

interface DrawerHarness {
  onClose: ReturnType<typeof vi.fn>;
  readonly isDragging: boolean;
  readonly offsetPct: number;
  readonly isClosing: boolean;
  readonly backdropOpacity: number;
  readonly axis: "x" | "y" | null;
  readonly velocity: number;
  close(after?: () => void): void;
  touchStart(
    clientX: number,
    clientY: number,
    opts?: { touches?: number; dragGuard?: boolean },
  ): void;
  touchMove(clientX: number, clientY: number): { preventDefault: boolean };
  touchEnd(): void;
  touchCancel(): void;
  keydown(key: string): void;
  setPanelWidth(w: number): void;
  advanceMs(ms: number): void;
}

/**
 * Verbatim reimplementation of MarketList.svelte's gesture handlers
 * (lines 74-152) as a controllable model. Only deltas from the source:
 * clock injected as `now`, panelWidth fixed by the test, onClose spy.
 */
function createDrawerHarness(): DrawerHarness {
  let now = 1000;
  let isDragging = false;
  let offsetPct = 0;
  let isClosing = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastT = 0;
  let axis: "x" | "y" | null = null;
  let velocity = 0;
  let panelWidth = 320;

  const onClose = vi.fn();

  function close(after?: () => void) {
    if (isClosing) return;
    isClosing = true;
    isDragging = false;
    offsetPct = -100;
    setTimeout(() => {
      after?.();
      onClose();
    }, 280);
  }

  function snapBack() {
    isDragging = false;
    offsetPct = 0;
  }

  function touchStart(
    clientX: number,
    clientY: number,
    opts: { touches?: number; dragGuard?: boolean } = {},
  ) {
    if (isClosing) return;
    const touches = opts.touches ?? 1;
    if (touches !== 1) return;
    if (opts.dragGuard) return;
    startX = lastX = clientX;
    startY = clientY;
    axis = null;
    velocity = 0;
    lastT = now;
    isDragging = true;
  }

  function touchMove(clientX: number, clientY: number) {
    if (!isDragging || axis === "y") return { preventDefault: false };
    const dx = clientX - startX;
    const dy = clientY - startY;
    if (axis === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8)
        return { preventDefault: false };
      axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (axis === "y") {
        isDragging = false; // let the panel scroll natively
        return { preventDefault: false };
      }
    }
    velocity = (clientX - lastX) / Math.max(1, now - lastT);
    lastX = clientX;
    lastT = now;
    offsetPct = Math.max(-100, Math.min(0, (dx / panelWidth) * 100));
    return { preventDefault: true };
  }

  function touchEnd() {
    if (!isDragging || axis !== "x") return;
    isDragging = false;
    const flung = offsetPct < -8 && velocity < -FLING_VELOCITY;
    if (offsetPct < -SNAP_THRESHOLD_PCT || flung) close();
    else snapBack();
  }

  function touchCancel() {
    isDragging = false;
    snapBack();
  }

  function keydown(key: string) {
    if (key === "Escape") close();
  }

  return {
    onClose,
    get isDragging() {
      return isDragging;
    },
    get offsetPct() {
      return offsetPct;
    },
    get isClosing() {
      return isClosing;
    },
    get backdropOpacity() {
      return 1 + offsetPct / 100;
    },
    get axis() {
      return axis;
    },
    get velocity() {
      return velocity;
    },
    close,
    touchStart,
    touchMove,
    touchEnd,
    touchCancel,
    keydown,
    setPanelWidth(w: number) {
      panelWidth = w;
    },
    advanceMs(ms: number) {
      now += ms;
    },
  };
}

describe("MarketList drawer gesture state machine", () => {
  let drawer: DrawerHarness;

  beforeEach(() => {
    vi.useFakeTimers();
    drawer = createDrawerHarness();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("touchstart drag-guard", () => {
    it("begins a drag on a single touch", () => {
      drawer.touchStart(100, 200);
      expect(drawer.isDragging).toBe(true);
      expect(drawer.axis).toBeNull();
    });

    it("ignores multi-touch", () => {
      drawer.touchStart(100, 200, { touches: 2 });
      expect(drawer.isDragging).toBe(false);
    });

    it("ignores touches inside .drag-guard (the horizontal filter row)", () => {
      drawer.touchStart(100, 200, { dragGuard: true });
      expect(drawer.isDragging).toBe(false);
    });

    it("ignores new drags while closing", () => {
      drawer.close();
      expect(drawer.isClosing).toBe(true);
      drawer.touchStart(100, 200);
      expect(drawer.isDragging).toBe(false);
    });
  });

  describe("axis lock", () => {
    it("stays unlocked while the gesture is under the 8px deadzone", () => {
      drawer.touchStart(100, 200);
      drawer.touchMove(103, 202); // dx=3, dy=2
      expect(drawer.axis).toBeNull();
      expect(drawer.isDragging).toBe(true);
      expect(drawer.offsetPct).toBe(0);
    });

    it("locks to x when |dx| dominates and tracks offset", () => {
      drawer.touchStart(100, 200);
      drawer.advanceMs(10);
      const move = drawer.touchMove(40, 205); // dx=-60, dy=5
      expect(drawer.axis).toBe("x");
      expect(drawer.offsetPct).toBe(-18.75); // -60/320 * 100
      expect(move.preventDefault).toBe(true);
    });

    it("locks to y when |dy| dominates and hands over to native scroll", () => {
      drawer.touchStart(100, 200);
      const move = drawer.touchMove(105, 100); // dx=5, dy=-100
      expect(drawer.axis).toBe("y");
      expect(drawer.isDragging).toBe(false);
      expect(move.preventDefault).toBe(false);
      expect(drawer.offsetPct).toBe(0);
    });

    it("y-locked gesture ignores further moves and never closes", () => {
      drawer.touchStart(100, 200);
      drawer.touchMove(105, 100); // lock to y
      drawer.touchMove(0, 100); // big dx ignored
      drawer.touchEnd();
      expect(drawer.offsetPct).toBe(0);
      expect(drawer.isClosing).toBe(false);
    });

    it("clamps offsetPct to [-100, 0]", () => {
      drawer.touchStart(400, 200);
      drawer.touchMove(500, 200); // rightward drag clamped to 0
      expect(drawer.offsetPct).toBe(0);
      drawer.touchStart(400, 200);
      drawer.touchMove(-200, 200); // far leftward clamped to -100
      expect(drawer.offsetPct).toBe(-100);
    });
  });

  describe("touchend: fling closes vs snapback", () => {
    it("closes when dragged past SNAP_THRESHOLD_PCT", () => {
      drawer.touchStart(320, 200);
      drawer.touchMove(200, 200); // -120/320 = -37.5%
      drawer.touchEnd();
      expect(drawer.isClosing).toBe(true);
      expect(drawer.offsetPct).toBe(-100);
    });

    it("closes on a fast leftward fling even under the threshold", () => {
      drawer.touchStart(100, 200);
      drawer.advanceMs(10);
      drawer.touchMove(92, 200); // small drag, -2.5%
      drawer.advanceMs(5);
      drawer.touchMove(60, 200); // velocity = (60-92)/5 = -6.4 px/ms
      drawer.touchEnd(); // offset -12.5% < -8 and velocity < -0.35
      expect(drawer.isClosing).toBe(true);
      expect(drawer.offsetPct).toBe(-100);
    });

    it("snapback when between -8 and -25 with slow velocity", () => {
      drawer.touchStart(100, 200);
      drawer.advanceMs(100);
      drawer.touchMove(40, 200); // -18.75%
      drawer.advanceMs(200);
      drawer.touchMove(30, 200); // velocity = (30-40)/200 = -0.05 px/ms
      drawer.touchEnd();
      expect(drawer.isClosing).toBe(false);
      expect(drawer.offsetPct).toBe(0); // snapped back
      expect(drawer.isDragging).toBe(false);
    });

    it("snapback at exactly -SNAP_THRESHOLD_PCT (strict less-than)", () => {
      drawer.setPanelWidth(100);
      drawer.touchStart(100, 200);
      drawer.advanceMs(100);
      drawer.touchMove(75, 200); // dx=-25 on 100px = exactly -25%
      drawer.touchEnd();
      expect(drawer.isClosing).toBe(false);
      expect(drawer.offsetPct).toBe(0);
    });

    it("fling needs BOTH offset < -8% and velocity < -0.35 px/ms", () => {
      // Small offset (-5%), fast velocity (-0.5 px/ms): no close.
      drawer.setPanelWidth(100);
      drawer.touchStart(100, 200);
      drawer.advanceMs(10);
      drawer.touchMove(95, 200);
      drawer.touchEnd();
      expect(drawer.isClosing).toBe(false);
      expect(drawer.offsetPct).toBe(0);
    });
  });

  describe("touchcancel resets", () => {
    it("cancels mid-drag and snaps back without closing", () => {
      drawer.touchStart(320, 200);
      drawer.touchMove(100, 200); // -68.75% past threshold
      drawer.touchCancel();
      expect(drawer.isDragging).toBe(false);
      expect(drawer.offsetPct).toBe(0);
      expect(drawer.isClosing).toBe(false);
    });

    it("a cancelled gesture's touchend is a no-op", () => {
      drawer.touchStart(320, 200);
      drawer.touchMove(100, 200);
      drawer.touchCancel();
      drawer.touchEnd(); // must not re-trigger close logic
      expect(drawer.isClosing).toBe(false);
      expect(drawer.offsetPct).toBe(0);
    });
  });

  describe("close() chokepoint and keydown-close", () => {
    it("Escape closes, dims backdrop, fires onClose at 280ms", () => {
      drawer.keydown("Escape");
      expect(drawer.isClosing).toBe(true);
      expect(drawer.offsetPct).toBe(-100);
      expect(drawer.backdropOpacity).toBe(0); // backdrop fully dimmed
      vi.advanceTimersByTime(279);
      expect(drawer.onClose).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(drawer.onClose).toHaveBeenCalledTimes(1);
    });

    it("close(after) runs after before onClose at 280ms", () => {
      const after = vi.fn();
      drawer.close(after);
      vi.advanceTimersByTime(280);
      expect(after).toHaveBeenCalledTimes(1);
      expect(drawer.onClose).toHaveBeenCalledTimes(1);
      expect(after.mock.invocationCallOrder[0]).toBeLessThan(
        drawer.onClose.mock.invocationCallOrder[0],
      );
    });

    it("repeat close calls are no-ops while closing (single timer)", () => {
      drawer.touchStart(320, 200);
      drawer.touchMove(100, 200);
      drawer.touchEnd(); // -> close via threshold
      drawer.keydown("Escape"); // ignored: already closing
      drawer.touchStart(100, 200); // ignored during close
      vi.advanceTimersByTime(280);
      expect(drawer.onClose).toHaveBeenCalledTimes(1);
    });

    it("non-Escape keys do not close", () => {
      drawer.keydown("Enter");
      drawer.keydown("Tab");
      expect(drawer.isClosing).toBe(false);
      expect(drawer.onClose).not.toHaveBeenCalled();
    });
  });
});
