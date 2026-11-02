import { trapTab } from './focus-trap';

let bound = false;
let trigger: HTMLElement | null = null;

const box = () => document.getElementById('lightbox');
const isOpen = () => document.documentElement.classList.contains('lightbox-open');

function part<T extends HTMLElement>(name: string) {
  return box()?.querySelector<T>(`[data-lightbox-${name}]`) ?? null;
}

function updateCount() {
  const track = part('track');
  const count = part('count');
  if (!track || !count) return;
  const total = track.children.length;
  const index = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)) + 1;
  count.textContent = `${Math.min(index, total)} / ${total}`;
}

function open(slug: string, from: HTMLElement) {
  const template = document.querySelector<HTMLTemplateElement>(`template[data-set="${slug}"]`);
  const track = part('track');
  if (!template || !track) return;
  trigger = from;
  track.replaceChildren(template.content.cloneNode(true));
  track.scrollLeft = 0;
  const single = track.children.length < 2;
  part('prev')!.hidden = single;
  part('next')!.hidden = single;
  part('title')!.textContent = template.dataset.title ?? '';
  updateCount();
  document.documentElement.classList.add('lightbox-open');
  box()!.removeAttribute('inert');
  part('close')?.focus({ preventScroll: true });
}

function close() {
  document.documentElement.classList.remove('lightbox-open');
  box()?.setAttribute('inert', '');
  trigger?.focus({ preventScroll: true });
}

function step(direction: 1 | -1) {
  const track = part('track');
  track?.scrollBy({ left: direction * track.clientWidth, behavior: 'smooth' });
}

function onClick(e: MouseEvent) {
  const target = e.target as Element | null;
  const tile = target?.closest<HTMLElement>('[data-lightbox]');
  if (tile) return open(tile.dataset.lightbox!, tile);
  if (target?.closest('[data-lightbox-close]')) return close();
  if (target?.closest('[data-lightbox-next]')) return step(1);
  if (target?.closest('[data-lightbox-prev]')) return step(-1);
}

function onKey(e: KeyboardEvent) {
  if (!isOpen()) return;
  if (e.key === 'Escape') close();
  else if (e.key === 'Tab') trapTab(box(), e);
  else if (e.key === 'ArrowRight') step(1);
  else if (e.key === 'ArrowLeft') step(-1);
}

// Delegated once: the document survives client-side navigation.
if (!bound) {
  bound = true;
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
  document.addEventListener('scroll', (e) => {
    if ((e.target as Element | null)?.matches?.('[data-lightbox-track]')) updateCount();
  }, { capture: true, passive: true });
  document.addEventListener('astro:after-swap', () => document.documentElement.classList.remove('lightbox-open'));
}
