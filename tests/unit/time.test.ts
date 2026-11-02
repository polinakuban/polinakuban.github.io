import { expect, test } from 'vitest';
import { formatBudapestTime } from '../../src/lib/time';

test('formats summer time (CEST, UTC+2)', () => {
  expect(formatBudapestTime(new Date('2026-07-01T10:05:00Z'))).toBe('12:05');
});

test('formats winter time (CET, UTC+1)', () => {
  expect(formatBudapestTime(new Date('2026-12-01T10:05:00Z'))).toBe('11:05');
});

test('pads midnight as 00', () => {
  expect(formatBudapestTime(new Date('2026-12-01T23:00:00Z'))).toBe('00:00');
});
