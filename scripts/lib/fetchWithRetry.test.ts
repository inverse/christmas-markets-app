import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

// fetchWithRetry keeps a module-level RateLimiter whose state persists across
// tests, so each test re-imports the module for a fresh limiter.
const URL = "https://www.berlin.de/en/christmas-markets/test.en.html";
const BOT_BLOCK_HTML =
  "<html><body><h1>Unerwünschter Zugriff / Forbidden access</h1></body></html>";

function htmlResponse(status: number, body = "<html>ok</html>"): Response {
  return new Response(body, {
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: { "content-type": "text/html" },
  });
}

// Lets a promise that internally awaits setTimeout resolve under fake timers.
async function run<T>(promise: Promise<T>): Promise<T> {
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

describe("fetchWithRetry", () => {
  beforeEach(() => {
    // fetchWithRetry holds a module-level RateLimiter; reset the module
    // registry so each test gets a fresh instance.
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns the body on a 200 response", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    const fetchMock = vi.fn().mockResolvedValue(htmlResponse(200));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchWithRetry } = await import("./fetchWithRetry");

    const res = await run(fetchWithRetry(URL));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("<html>ok</html>");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries a 500 then succeeds", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(htmlResponse(500))
      .mockResolvedValueOnce(htmlResponse(200));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchWithRetry } = await import("./fetchWithRetry");

    const res = await run(fetchWithRetry(URL));
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up after RETRY_ATTEMPTS on persistent 500s", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    const fetchMock = vi.fn().mockResolvedValue(htmlResponse(500));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchWithRetry } = await import("./fetchWithRetry");

    await expect(run(fetchWithRetry(URL))).rejects.toThrow(
      /gave up after 8 attempts/,
    );
    expect(fetchMock).toHaveBeenCalledTimes(8);
  });

  it("honours Retry-After on 429", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    const fetchMock = vi.fn().mockImplementation(async () => {
      const res = htmlResponse(429);
      res.headers.set("retry-after", "2");
      return res;
    });
    vi.stubGlobal("fetch", fetchMock);
    const { fetchWithRetry } = await import("./fetchWithRetry");

    const start = Date.now();
    await expect(run(fetchWithRetry(URL))).rejects.toThrow(/gave up/);
    const elapsed = Date.now() - start;

    expect(fetchMock).toHaveBeenCalledTimes(8);
    // 7 retries × ~2s Retry-After + pacing; clearly more than base spacing.
    expect(elapsed).toBeGreaterThan(10_000);
  });

  it("does not retry a genuine 403", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    const fetchMock = vi
      .fn()
      .mockResolvedValue(htmlResponse(403, "<html>Forbidden</html>"));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchWithRetry } = await import("./fetchWithRetry");

    await expect(run(fetchWithRetry(URL))).rejects.toThrow(/HTTP 403/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries the anti-bot 403 block page", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(htmlResponse(403, BOT_BLOCK_HTML))
      .mockResolvedValueOnce(htmlResponse(200));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchWithRetry } = await import("./fetchWithRetry");

    const res = await run(fetchWithRetry(URL));
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a 404", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    const fetchMock = vi.fn().mockResolvedValue(htmlResponse(404));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchWithRetry } = await import("./fetchWithRetry");

    await expect(run(fetchWithRetry(URL))).rejects.toThrow(/HTTP 404/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
