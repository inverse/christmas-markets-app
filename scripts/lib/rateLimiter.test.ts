import { describe, it, expect, vi, afterEach } from "vitest";
import { RateLimiter } from "./rateLimiter";

const URL_A = "https://a.example/page";
const URL_B = "https://b.example/page";

// Lets a promise that internally awaits setTimeout resolve under fake timers.
async function settle<T>(promise: Promise<T>): Promise<T> {
  let result: { ok: true; value: T } | { ok: false; error: unknown } | null =
    null;
  promise.then(
    (value) => {
      result = { ok: true, value };
    },
    (error) => {
      result = { ok: false, error };
    },
  );
  for (let i = 0; i < 40_000 && result === null; i++) {
    await vi.advanceTimersByTimeAsync(100);
    await Promise.resolve();
  }
  if (result === null) throw new Error("promise did not settle");
  if (!result.ok) throw result.error;
  return result.value;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("RateLimiter", () => {
  it("spaces requests per origin by the base interval", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    const limiter = new RateLimiter();

    const start = Date.now();
    await settle(limiter.acquire(URL_A));
    await settle(limiter.acquire(URL_A));
    const elapsed = Date.now() - start;

    // First acquire is immediate; second waits BASE_MS*jitter(0)=2187.5.
    expect(elapsed).toBeGreaterThanOrEqual(2_000);
    expect(elapsed).toBeLessThan(4_000);
  });

  it("does not share pacing state across origins", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    const limiter = new RateLimiter();

    const start = Date.now();
    await settle(limiter.acquire(URL_A));
    await settle(limiter.acquire(URL_B));
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(1_000);
  });

  it("penalize pushes the next allowed time out and grows the interval", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    const limiter = new RateLimiter();

    await settle(limiter.acquire(URL_A));
    limiter.penalize(URL_A, 10_000);

    const start = Date.now();
    await settle(limiter.acquire(URL_A));
    const elapsed = Date.now() - start;

    // nextAllowed = now + 10s*0.875 = 8.75s; doubled interval adds ~4.4s.
    expect(elapsed).toBeGreaterThanOrEqual(8_000);
    expect(elapsed).toBeLessThan(16_000);
  });

  it("reward halves the interval back toward the base", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    const limiter = new RateLimiter();

    limiter.penalize(URL_A, 0);
    limiter.reward(URL_A);
    limiter.reward(URL_A);

    const start = Date.now();
    await settle(limiter.acquire(URL_A));
    await settle(limiter.acquire(URL_A));
    const elapsed = Date.now() - start;

    // Two rewards bring the doubled interval back to BASE_MS; jitter(0)=0.875.
    expect(elapsed).toBeGreaterThanOrEqual(2_000);
    expect(elapsed).toBeLessThan(4_000);
  });

  it("recordFailure trips the circuit breaker after the threshold", () => {
    const limiter = new RateLimiter();

    for (let i = 0; i < 11; i++) {
      expect(limiter.recordFailure(URL_A)).toBe(false);
      expect(limiter.has(URL_A)).toBe(false);
    }
    expect(limiter.recordFailure(URL_A)).toBe(true);
    expect(limiter.has(URL_A)).toBe(true);
    // Other origins are unaffected.
    expect(limiter.has(URL_B)).toBe(false);
  });

  it("a success clears the failure streak and cooldown", () => {
    const limiter = new RateLimiter();

    for (let i = 0; i < 12; i++) limiter.recordFailure(URL_A);
    expect(limiter.has(URL_A)).toBe(true);

    limiter.reward(URL_A);
    expect(limiter.has(URL_A)).toBe(false);
  });
});
