import { z } from 'astro/zod';

// Pages CMS may save a cleared field as '' or null rather than dropping the key
const blank = (v: unknown) => (v === '' || v === null ? undefined : v);

/** An optional field: missing, '' and null all mean "not filled in". */
export const maybe = <T extends z.ZodType>(schema: T) => z.preprocess(blank, schema.optional());

/** A field that falls back to `value` when missing, '' or null. */
export const orDefault = <T extends z.ZodType>(schema: T, value: z.input<T>) =>
  z.preprocess((v) => blank(v) ?? value, schema);
