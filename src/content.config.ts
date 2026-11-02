import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const work = defineCollection({
  loader: glob({ base: './src/content/work', pattern: '*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      order: z.number(),
      featured: z.boolean().default(true),
      category: z.string(),
      years: z.string(),
      role: z.string(),
      client: z.string().optional(),
      scope: z.string().optional(),
      description: z.string().max(600),
      cover: image(),
      coverPosition: z.string().default('50% 50%'),
      gallery: z.array(z.object({ src: image(), alt: z.string() })).min(1),
      todo: z.string().optional(),
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
      client: z.string(),
      team: z.string(),
      timeline: z.string(),
      challenge: z.string(),
      whatIDid: z.array(z.string()),
      results: z.array(z.object({ value: z.string(), label: z.string() })).max(3),
      cover: image().optional(),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      photos: z.array(z.object({ src: image(), alt: z.string() })).max(3).default([]),
      todo: z.string().optional(),
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
      cover: image().optional(),
      images: z.array(z.object({ src: image(), alt: z.string() })).default([]),
    }),
});

const settings = defineCollection({
  loader: glob({ base: './src/content/site', pattern: 'settings.yaml' }),
  schema: ({ image }) =>
    z.object({
      email: z.string().email(),
      phone: z.string().optional(),
      behance: z.string().url(),
      linkedin: z.string().url().optional(),
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
      cv: z.string(),
      todo: z.string().optional(),
    }),
});

export const collections = { work, projects, archive, settings, about };
