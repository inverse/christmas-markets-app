import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { isMarketOpen } from './marketStatus';

describe('isMarketOpen', () => {
    // Mock the current date to August 28th, 2026 for consistent testing
    beforeAll(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 7, 28)); // 7 is August (0-indexed)
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    it('should return closed for a future date (November)', () => {
        const result = isMarketOpen('November 18, 2026 until January 03, 2027');
        expect(result.status).toBe('closed');
    });

    it('should return open for a current date (August)', () => {
        const result = isMarketOpen('August 01, 2026 until August 30, 2026');
        expect(result.status).toBe('open');
    });

    it('should handle year wrap-around correctly', () => {
        // Mock date to December (11)
        vi.setSystemTime(new Date(2026, 11, 15));
        const result = isMarketOpen('November 18, 2026 until January 03, 2027');
        expect(result.status).toBe('open');
    });

    it('should return unknown for dates without month names', () => {
        const result = isMarketOpen('Not found');
        expect(result.status).toBe('unknown');
    });
});
