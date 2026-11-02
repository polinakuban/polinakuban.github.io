import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { parse } from 'yaml';

// .pages.yml must describe every key the content files use: Pages CMS builds its forms from it,
// and a media path it can't map back to the repo would show as a broken image in the admin.

type Field = { name: string; type: string; fields?: Field[]; options?: { media?: string } };
type Media = { name: string; input: string; output: string };
type Entry = { name: string; type: 'collection' | 'file'; path: string; format: string; fields: Field[] };

const config = parse(readFileSync('.pages.yml', 'utf8')) as { media: Media[]; content: Entry[] };

const frontmatter = (file: string) => parse(readFileSync(file, 'utf8').split(/^---$/m)[1]);

const entries = config.content.map((entry) => {
  const files =
    entry.type === 'collection'
      ? readdirSync(entry.path).filter((f) => f.endsWith('.md')).map((f) => join(entry.path, f))
      : [entry.path];
  return { entry, files: files.map((file) => ({ file, data: entry.type === 'collection' ? frontmatter(file) : parse(readFileSync(file, 'utf8')) })) };
});

// Same mapping Pages CMS uses: stored value = output + path below input
const repoPath = (value: string, media: Media) => {
  expect(value.startsWith(`${media.output}/`), `${value} should start with ${media.output}/`).toBe(true);
  return media.input + value.slice(media.output.length);
};

const checkMedia = (fields: Field[], data: Record<string, unknown>, where: string) => {
  for (const field of fields) {
    const value = data[field.name];
    if (value == null || value === '') continue;
    if (field.type === 'object' && field.fields) {
      for (const item of [value].flat() as Record<string, unknown>[]) checkMedia(field.fields, item, where);
    } else if (field.type === 'image' || field.type === 'file') {
      const media = config.media.find((m) => m.name === field.options?.media);
      expect(media, `${where}: ${field.name} needs a named media source`).toBeDefined();
      for (const v of [value].flat() as string[]) expect(existsSync(repoPath(v, media!)), `${where}: ${v}`).toBe(true);
    }
  }
};

describe('.pages.yml', () => {
  test('every collection and file exists', () => {
    for (const { entry, files } of entries) {
      expect(existsSync(entry.path), entry.path).toBe(true);
      expect(files.length, entry.name).toBeGreaterThan(0);
    }
  });

  test('every key in the content has a field in the admin', () => {
    for (const { entry, files } of entries) {
      const names = entry.fields.map((f) => f.name);
      for (const { file, data } of files) {
        for (const key of Object.keys(data)) expect(names, `${file}: ${key}`).toContain(key);
      }
    }
  });

  test('image and file paths round-trip through the media sources', () => {
    for (const { entry, files } of entries) {
      for (const { file, data } of files) checkMedia(entry.fields, data, file);
    }
  });
});
