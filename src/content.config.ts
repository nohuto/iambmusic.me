import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const profileStories = defineCollection({
  loader: glob({ pattern: 'artist.{de,en}.md', base: './src/content/profiles' }),
  schema: z.object({
    language: z.enum(['de', 'en']),
    heading: z.string(),
    summary: z.string(),
    status: z.enum(['confirmed', 'provisional']),
    ownerRequirement: z.string().optional(),
  }),
});

export const collections = { profileStories };
