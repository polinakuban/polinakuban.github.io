export type Ordered = { id: string; data: { order: number; title: string } };
export type Link = { href: string; title: string };

const HOME_STRIP_MAX = 7;

export function sortByOrder<T extends Ordered>(items: T[]): T[] {
  return [...items].sort((a, b) => a.data.order - b.data.order);
}

export function homeStrip<T extends Ordered & { data: { featured: boolean } }>(work: T[]): T[] {
  return sortByOrder(work.filter((w) => w.data.featured)).slice(0, HOME_STRIP_MAX);
}

const pad2 = (n: number) => String(n).padStart(2, '0');

export function position<T extends Ordered>(items: T[], id: string) {
  const sorted = sortByOrder(items);
  const index = sorted.findIndex((i) => i.id === id);
  return { index, total: sorted.length, label: `${pad2(index + 1)} / ${pad2(sorted.length)}` };
}

export function nextWork<T extends Ordered>(work: T[], id: string): Link {
  const sorted = sortByOrder(work);
  const next = sorted[sorted.findIndex((w) => w.id === id) + 1];
  return next ? { href: `/work/${next.id}`, title: next.data.title } : { href: '/archive', title: 'Archive' };
}

export function nextProject<T extends Ordered>(projects: T[], id: string): Link {
  const sorted = sortByOrder(projects);
  const next = sorted[(sorted.findIndex((p) => p.id === id) + 1) % sorted.length];
  return { href: `/coordination/${next.id}`, title: next.data.title };
}
