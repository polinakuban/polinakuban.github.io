import { getEntry } from 'astro:content';

export async function getSettings() {
  const entry = await getEntry('settings', 'settings');
  if (!entry) throw new Error('src/content/site/settings.yaml is missing');
  return entry.data;
}
