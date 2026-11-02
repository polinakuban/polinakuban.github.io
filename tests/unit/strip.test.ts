import { expect, test } from 'vitest';
import { nearestIndex } from '../../src/lib/strip';

test('picks the centre closest to mid', () => {
  expect(nearestIndex([100, 300, 500], 290)).toBe(1);
});

test('ties go to the lower index', () => {
  expect(nearestIndex([100, 300], 200)).toBe(0);
});

test('a single item is always nearest', () => {
  expect(nearestIndex([50], 999)).toBe(0);
});

test('empty list returns -1', () => {
  expect(nearestIndex([], 10)).toBe(-1);
});
