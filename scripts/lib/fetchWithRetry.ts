import { RateLimiter, delay } from "./rateLimiter";

const RETRY_ATTEMPTS = 8;
const RETRY_BASE_MS = 5_000;
const RETRY_MAX_DELAY_MS = 120_000;
const RETRY_MAX_RETRY_AFTER_MS = 300_000;
// berlin.de's Varnish layer answers sustained scraping with a 403 "Forbidden
// access" page (bo_delay_token cookie) before hard-blocking the IP. Treat it
// as a long cooldown, not a permanent failure.
const BOT_BLOCK_PENALTY_MS = 60_000;
const BOT_BLOCK_MARKER = "Unerwünschter Zugriff";
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

const FETCH_TIMEOUT_MS = 30_000;
const RETRY_AFTER_JITTER = 0.25;
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const limiter = new RateLimiter();

function parseRetryAfter(response: Response): number | null {
  const header = response.headers.get("retry-after");
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) {
    return Math.min(Math.max(seconds, 0) * 1000, RETRY_MAX_RETRY_AFTER_MS);
  }
  const date = Date.parse(header);
  if (Number.isNaN(date)) return null;
  return Math.min(Math.max(date - Date.now(), 0), RETRY_MAX_RETRY_AFTER_MS);
}

// Rebuilds a Response whose body was already consumed for inspection, so
// callers can still read it.
function bufferedResponse(response: Response, body: string): Response {
  const copy = new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
  Object.defineProperty(copy, "url", { value: response.url });
  Object.defineProperty(copy, "redirected", { value: response.redirected });
  return copy;
}

export async function fetchWithRetry(
  url: string,
  userAgent: string = BROWSER_UA,
): Promise<Response> {
  const label = url.split("/").pop() || url;
  let lastError = "unknown error";

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    if (limiter.has(url)) {
      throw new Error(`origin cooling down after repeated failures for ${url}`);
    }
    await limiter.acquire(url);
    let response: Response | null = null;
    try {
      response = await fetch(url, {
        headers: { "User-Agent": userAgent },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }

    const backoffMs = Math.min(
      RETRY_BASE_MS * 2 ** (attempt - 1),
      RETRY_MAX_DELAY_MS,
    );
    const retryAfterMs = response ? parseRetryAfter(response) : null;
    let isBotBlock = false;

    if (response) {
      if (response.ok) {
        const body = await response.text();
        limiter.reward(url);
        return bufferedResponse(response, body);
      }
      lastError = `HTTP ${response.status} ${response.statusText}`.trim();

      if (response.status === 403) {
        const body = await response.text();
        isBotBlock = body.includes(BOT_BLOCK_MARKER);
        if (!isBotBlock) {
          // Genuine 403 (not the anti-bot page): do not retry.
          throw new Error(`${lastError} for ${url}`);
        }
        lastError += " (anti-bot block page)";
      } else {
        await response.body?.cancel().catch(() => {});
        if (!RETRYABLE_STATUS.has(response.status)) {
          limiter.recordFailure(url);
          throw new Error(`${lastError} for ${url}`);
        }
      }

      if (response.status === 429 || retryAfterMs != null || isBotBlock) {
        limiter.penalize(
          url,
          isBotBlock ? BOT_BLOCK_PENALTY_MS : (retryAfterMs ?? backoffMs),
        );
      }
      limiter.recordFailure(url);
    } else {
      limiter.recordFailure(url);
    }

    if (attempt === RETRY_ATTEMPTS) break;

    const waitMs =
      retryAfterMs != null
        ? Math.min(
            retryAfterMs * (1 + Math.random() * RETRY_AFTER_JITTER),
            RETRY_MAX_RETRY_AFTER_MS,
          )
        : backoffMs + Math.random() * RETRY_BASE_MS;

    console.warn(
      `[Attempt ${attempt}/${RETRY_ATTEMPTS}] ${label}: ${lastError} - retrying in ${(waitMs / 1000).toFixed(1)}s`,
    );
    await delay(waitMs);
  }

  throw new Error(`${lastError} (gave up after ${RETRY_ATTEMPTS} attempts)`);
}
