import { activeIndex, wheelToHorizontal } from '../lib/gallery';

const pad2 = (n: number) => String(n).padStart(2, '0');
let cleanup: (() => void) | null = null;

function initGallery() {
  cleanup?.();
  cleanup = null;
  const track = document.querySelector<HTMLElement>('[data-track]');
  if (!track) return;
  const figures = [...track.querySelectorAll<HTMLElement>('figure')];
  const progress = document.querySelector<HTMLElement>('[data-progress]');
  const hint = document.querySelector<HTMLElement>('[data-hint]');
  const total = pad2(figures.length);
  let frame = 0;

  const update = () => {
    frame = 0;
    const i = activeIndex(figures.map((f) => f.offsetLeft), track.scrollLeft, track.clientWidth);
    if (progress) progress.textContent = `${pad2(i + 1)} / ${total}`;
    if (track.scrollLeft > 4) hint?.classList.add('is-gone');
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const onWheel = (e: WheelEvent) => {
    const delta = wheelToHorizontal(e.deltaX, e.deltaY);
    if (delta === null) return;
    const max = track.scrollWidth - track.clientWidth;
    const canMove = delta > 0 ? track.scrollLeft < max - 1 : track.scrollLeft > 0;
    if (!canMove) return;
    e.preventDefault();
    track.scrollLeft += delta;
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    if (document.documentElement.classList.contains('contact-open')) return;
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * track.clientWidth * 0.6, behavior: smooth ? 'smooth' : 'auto' });
  };

  track.addEventListener('scroll', onScroll, { passive: true });
  track.addEventListener('wheel', onWheel, { passive: false });
  document.addEventListener('keydown', onKey);
  update();

  cleanup = () => {
    cancelAnimationFrame(frame);
    document.removeEventListener('keydown', onKey);
  };
}

document.addEventListener('astro:page-load', initGallery);
document.addEventListener('astro:before-swap', () => {
  cleanup?.();
  cleanup = null;
});
