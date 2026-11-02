import { expect, test } from 'vitest';
import { lerp, zoneFor } from '../../src/lib/cursor';

// A fake element whose closest() matches only the selectors it "is"
const el = (...is: string[]) => ({
  closest: (selector: string) => (selector.split(',').some((s) => is.includes(s.trim())) ? {} : null),
});

test('case in design is lens', () => {
  expect(zoneFor(el('a[data-case]', 'a'), 'design', false)).toBe('lens');
});

test('case in coordination is native', () => {
  expect(zoneFor(el('a[data-case]', 'a'), 'coordination', false)).toBe('native');
});

test('project row is native', () => {
  expect(zoneFor(el('[data-project-row]', 'a'), 'coordination', false)).toBe('native');
});

test('header pill is native', () => {
  expect(zoneFor(el('button'), 'design', false)).toBe('native');
});

test('empty area is contact', () => {
  expect(zoneFor(el(), 'design', false)).toBe('contact');
  expect(zoneFor(el(), 'coordination', false)).toBe('contact');
});

test('panel open forces native', () => {
  expect(zoneFor(el(), 'design', true)).toBe('native');
  expect(zoneFor(el('a[data-case]'), 'design', true)).toBe('native');
});

test('closing the panel by clicking the dimmed page never counts as an empty-area click', () => {
  // the panel is already closed by the time the cursor sees the click
  expect(zoneFor(el('[data-contact-close]'), 'design', false)).toBe('native');
});

test('no target is native', () => {
  expect(zoneFor(null, 'design', false)).toBe('native');
});

test('lerp moves a fraction of the way', () => {
  expect(lerp(0, 100, 0.22)).toBeCloseTo(22);
  expect(lerp(50, 50, 0.22)).toBe(50);
});
