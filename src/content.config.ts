import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { maybe, orDefault } from './lib/schema';

// Content is edited by Polina in Pages CMS (.pages.yml): optional fields go through
// maybe()/orDefault(), so a field she clears never breaks the build.

const work = defineCollection({
  loader: glob({ base: './src/content/work', pattern: '*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      order: z.number(),
      featured: orDefault(z.boolean(), true),
      category: z.string(),
      years: z.string(),
      role: z.string(),
      client: maybe(z.string()),
      scope: maybe(z.string()),
      description: z.string().max(600),
      cover: image(),
      coverPosition: orDefault(z.string(), '50% 50%'),
      gallery: z.array(z.object({ src: image(), alt: z.string() })).min(1),
      todo: maybe(z.string()),
    }),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      order: z.number(),
      type: z.string(),
      scopeShort: z.string(),
      role: z.string(),
      // Everything below `focus` is optional: the project page leaves out what isn't filled in
      client: maybe(z.string()),
      team: maybe(z.string()),
      timeline: maybe(z.string()),
      focus: z.string(),
      whatIDid: orDefault(z.array(z.string()), []),
      results: orDefault(z.array(z.object({ value: z.string(), label: z.string() })).max(3), []),
      keyLearning: maybe(z.string()),
      cover: maybe(image()),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      photos: orDefault(
        z.array(z.object({ src: image(), alt: z.string(), position: orDefault(z.string(), '50% 50%') })).max(3),
        [],
      ),
      todo: maybe(z.string()),
    }),
});

const archive = defineCollection({
  loader: glob({ base: './src/content/archive', pattern: '*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      year: z.string(),
      order: z.number(),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      cover: maybe(image()),
      images: orDefault(z.array(z.object({ src: image(), alt: z.string() })), []),
    }),
});

const settings = defineCollection({
  loader: glob({ base: './src/content/site', pattern: 'settings.yaml' }),
  schema: ({ image }) =>
    z.object({
      email: z.string().email(),
      phone: maybe(z.string()),
      behance: z.string().url(),
      linkedin: maybe(z.string().url()),
      city: z.string(),
      clockLabel: z.string(),
      designStatement: z.string(),
      designStatementItalic: z.string(),
      coordinationStatement: z.string(),
      coordinationStatementItalic: z.string(),
      designRole: z.string(),
      coordinationRole: z.string(),
      aboutRole: z.string(),
      archiveCover: image(),
      // false adds a noindex tag to every page: search engines skip the site
      indexable: orDefault(z.boolean(), true),
    }),
});

const about = defineCollection({
  loader: glob({ base: './src/content/site', pattern: 'about.yaml' }),
  schema: ({ image }) =>
    z.object({
      portrait: image(),
      portraitAlt: z.string(),
      statement: z.string(),
      statementItalic: z.string(),
      bio: z.string(),
      designer: z.array(z.string()),
      coordinator: z.array(z.string()),
      tools: z.array(z.string()),
      languages: z.array(z.string()),
      experience: z.array(z.object({ years: z.string(), org: z.string(), role: z.string() })),
      // no CV yet means no download button
      cv: maybe(z.string()),
      todo: maybe(z.string()),
    }),
});

export const collections = { work, projects, archive, settings, about };
