import { nearestIndex } from '../lib/strip';

const MOBILE = '(max-width: 767px)';

// On phones the strip scrolls sideways; the card nearest the centre gets .is-active and grows.
function initStrip() {
  const strip = document.querySelector<HTMLElement>('[data-strip]');
  if (!strip) return;
  const items = [...strip.querySelectorAll<HTMLElement>('a[data-case]')];
  let frame = 0;
  const update = () => {
    frame = 0;
    if (!window.matchMedia(MOBILE).matches) return;
    const mid = strip.scrollLeft + strip.clientWidth / 2;
    const active = nearestIndex(items.map((it) => it.offsetLeft + it.offsetWidth / 2), mid);
    items.forEach((it, i) => it.classList.toggle('is-active', i === active));
  };
  strip.addEventListener('scroll', () => {
    if (!frame) frame = requestAnimationFrame(update);
  }, { passive: true });
  update();
}

document.addEventListener('astro:page-load', initStrip);
