import { describe, expect, test } from 'vitest';
import { z } from 'astro/zod';
import { maybe, orDefault } from '../../src/lib/schema';

// Pages CMS may write a cleared field as '' or null instead of leaving the key out
const entry = z.object({
  linkedin: maybe(z.string().url()),
  team: maybe(z.string()),
  whatIDid: orDefault(z.array(z.string()), []),
  position: orDefault(z.string(), '50% 50%'),
});

describe('optional fields from the CMS', () => {
  test('a missing key is not filled in', () => {
    expect(entry.parse({})).toEqual({ linkedin: undefined, team: undefined, whatIDid: [], position: '50% 50%' });
  });

  test("'' and null count as not filled in", () => {
    expect(entry.parse({ linkedin: '', team: null, whatIDid: null, position: '' })).toEqual({
      linkedin: undefined,
      team: undefined,
      whatIDid: [],
      position: '50% 50%',
    });
  });

  test('filled values are kept and still validated', () => {
    expect(
      entry.parse({ linkedin: 'https://linkedin.com/in/x', team: '3 people', whatIDid: ['Plan'], position: '50% 20%' }),
    ).toEqual({
      linkedin: 'https://linkedin.com/in/x',
      team: '3 people',
      whatIDid: ['Plan'],
      position: '50% 20%',
    });
    expect(() => entry.parse({ linkedin: 'not a url' })).toThrow();
  });
});
