import { expect, test } from 'vitest';
import { activeIndex, wheelToHorizontal } from '../../src/lib/gallery';

test('vertical wheel becomes horizontal scroll', () => {
  expect(wheelToHorizontal(0, 40)).toBe(40);
  expect(wheelToHorizontal(3, -25)).toBe(-25);
});

test('mostly horizontal wheel is left to the browser', () => {
  expect(wheelToHorizontal(30, 5)).toBeNull();
  expect(wheelToHorizontal(0, 0)).toBeNull();
});

test('activeIndex follows the item under the 30% line', () => {
  expect(activeIndex([0, 800, 1600], 0, 1000)).toBe(0);
  expect(activeIndex([0, 800, 1600], 600, 1000)).toBe(1);
  expect(activeIndex([0, 800, 1600], 1400, 1000)).toBe(2);
});

test('activeIndex with a single image is always 0', () => {
  expect(activeIndex([0], 5000, 1000)).toBe(0);
  expect(activeIndex([], 0, 1000)).toBe(0);
});
