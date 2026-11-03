import { describe, expect, test } from 'vitest';
import { homeStrip, nextProject, nextWork, sortByOrder } from '../../src/lib/collections';

const work = [
  { id: 'turning-visions', data: { order: 4, title: 'Turning Visions', featured: true } },
  { id: 'zelenka', data: { order: 1, title: 'Zelёnka', featured: true } },
  { id: 'hidden', data: { order: 3, title: 'Hidden', featured: false } },
  { id: 'roseco-eco-boxes', data: { order: 2, title: 'ROSECO', featured: true } },
];

describe('collections', () => {
  test('sortByOrder sorts ascending by order', () => {
    expect(sortByOrder(work).map((w) => w.id)).toEqual(['zelenka', 'roseco-eco-boxes', 'hidden', 'turning-visions']);
  });

  test('sortByOrder does not mutate its input', () => {
    const before = work.map((w) => w.id);
    sortByOrder(work);
    expect(work.map((w) => w.id)).toEqual(before);
  });

  test('homeStrip drops non-featured and caps at 7', () => {
    expect(homeStrip(work).map((w) => w.id)).toEqual(['zelenka', 'roseco-eco-boxes', 'turning-visions']);
    const nine = Array.from({ length: 9 }, (_, i) => ({ id: `c${i}`, data: { order: i, title: `C${i}`, featured: true } }));
    expect(homeStrip(nine)).toHaveLength(7);
  });

  test('nextWork goes to the next case and from the last to Archive', () => {
    expect(nextWork(work, 'zelenka')).toEqual({ href: '/work/roseco-eco-boxes', title: 'ROSECO' });
    expect(nextWork(work, 'turning-visions')).toEqual({ href: '/archive', title: 'Archive' });
  });

  test('nextProject loops from last to first', () => {
    const projects = [
      { id: 'b', data: { order: 2, title: 'B' } },
      { id: 'a', data: { order: 1, title: 'A' } },
    ];
    expect(nextProject(projects, 'a')).toEqual({ href: '/coordination/b', title: 'B' });
    expect(nextProject(projects, 'b')).toEqual({ href: '/coordination/a', title: 'A' });
  });
});
