// Per-origin request pacing plus a failure circuit breaker.
//
// Pacing: request starts are spaced by a base interval with jitter, and a
// 429/Retry-After or anti-bot block response pushes the origin's next allowed
// time out while doubling its interval (halved again on each success), so a
// rate-limited host slows the whole run.
//
// Circuit breaker: consecutive retryable failures (network errors, 5xx, 429,
// bot-block 403s) pause all requests to that origin for a cooldown, so a run
// does not keep hammering a host that has stopped answering.

interface OriginState {
  interval: number;
  nextAllowed: number;
  failures: number;
  blockCooldownUntil: number;
}

const BASE_MS = 2_500;
const MAX_INTERVAL_MS = 60_000;
const JITTER_RATIO = 0.25;
const FAILURE_THRESHOLD = 12;
const BLOCK_COOLDOWN_MS = 120_000;
const MAX_BLOCK_COOLDOWN_MS = 600_000;

function jitter(ms: number): number {
  return ms * (1 - JITTER_RATIO / 2 + Math.random() * JITTER_RATIO);
}

export class RateLimiter {
  private readonly origins = new Map<string, OriginState>();

  private state(url: string): OriginState {
    const origin = new URL(url).origin;
    let state = this.origins.get(origin);
    if (!state) {
      state = {
        interval: BASE_MS,
        nextAllowed: 0,
        failures: 0,
        blockCooldownUntil: 0,
      };
      this.origins.set(origin, state);
    }
    return state;
  }

  // True while the origin is in a failure cooldown; callers should skip the
  // request entirely rather than burning a retry attempt.
  has(url: string): boolean {
    return this.state(url).blockCooldownUntil > Date.now();
  }

  async acquire(url: string): Promise<void> {
    const state = this.state(url);
    const wait = Math.max(0, state.nextAllowed - Date.now());
    if (wait > 0) await delay(wait);
    state.nextAllowed = Date.now() + jitter(state.interval);
  }

  // A 429/Retry-After-style response: push the next allowed time out and grow
  // the pacing interval. `ms` is the server-suggested delay when known.
  penalize(url: string, ms: number): void {
    const state = this.state(url);
    state.interval = Math.min(state.interval * 2, MAX_INTERVAL_MS);
    state.nextAllowed = Date.now() + jitter(ms);
  }

  reward(url: string): void {
    const state = this.state(url);
    state.interval = Math.max(BASE_MS, Math.floor(state.interval / 2));
    state.failures = 0;
    state.blockCooldownUntil = 0;
  }

  // Count a retryable failure; returns true when the threshold tripped and the
  // origin entered cooldown.
  recordFailure(url: string): boolean {
    const state = this.state(url);
    state.failures += 1;
    if (state.failures < FAILURE_THRESHOLD) return false;
    const cooldown = Math.min(
      BLOCK_COOLDOWN_MS * 2 ** (state.failures - FAILURE_THRESHOLD),
      MAX_BLOCK_COOLDOWN_MS,
    );
    state.blockCooldownUntil = Date.now() + cooldown;
    state.failures = 0;
    return true;
  }
}

export function delay(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
}
