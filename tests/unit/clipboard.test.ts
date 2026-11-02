import { expect, test } from 'vitest';
import { copyText } from '../../src/lib/clipboard';

test('copyText resolves true when writeText resolves', async () => {
  let written = '';
  const ok = await copyText('a@b.c', { writeText: async (t: string) => void (written = t) });
  expect(ok).toBe(true);
  expect(written).toBe('a@b.c');
});

test('copyText resolves false when writeText rejects', async () => {
  const ok = await copyText('a@b.c', { writeText: () => Promise.reject(new Error('denied')) });
  expect(ok).toBe(false);
});

test('copyText resolves false when clipboard is undefined', async () => {
  expect(await copyText('a@b.c', undefined)).toBe(false);
});

test('copyText resolves false when writeText throws synchronously', async () => {
  const ok = await copyText('a@b.c', {
    writeText: () => {
      throw new Error('boom');
    },
  });
  expect(ok).toBe(false);
});
