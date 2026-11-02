import { lerp, zoneFor, type CursorZone } from '../lib/cursor';
import type { Mode } from '../lib/types';
import { isContactOpen, openContact } from './contact';

const ENABLED = '(hover: hover) and (pointer: fine)';
const REDUCED = '(prefers-reduced-motion: reduce)';
const FOLLOW = 0.22;

let cleanup: (() => void) | null = null;

function setZone(zone: CursorZone) {
  const root = document.documentElement;
  root.classList.toggle('cursor-contact', zone === 'contact');
  root.classList.toggle('cursor-lens', zone === 'lens');
}

function initCursor() {
  cleanup?.();
  cleanup = null;
  const el = document.querySelector<HTMLElement>('.contact-cursor');
  if (!el || !matchMedia(ENABLED).matches || matchMedia(REDUCED).matches) return;

  const root = document.documentElement;
  const mode = root.dataset.mode as Mode;
  let x = 0, y = 0, cx = 0, cy = 0, seen = false, frame = 0;

  const onMove = (e: MouseEvent) => {
    x = e.clientX;
    y = e.clientY;
    if (!seen) [cx, cy, seen] = [x, y, true];
    setZone(zoneFor(e.target as Element, mode, isContactOpen()));
  };
  const onLeave = () => setZone('native');
  const onDown = () => root.classList.add('cursor-press');
  const onUp = () => root.classList.remove('cursor-press');
  const onClick = (e: MouseEvent) => {
    // detail is 0 for keyboard-triggered clicks (Enter on a link): only a real pointer click counts
    if (e.detail === 0 || zoneFor(e.target as Element, mode, isContactOpen()) !== 'contact') return;
    setZone('native');
    openContact();
  };
  const loop = () => {
    cx = lerp(cx, x, FOLLOW);
    cy = lerp(cy, y, FOLLOW);
    el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    frame = requestAnimationFrame(loop);
  };

  document.addEventListener('mousemove', onMove);
  document.documentElement.addEventListener('mouseleave', onLeave);
  document.addEventListener('mousedown', onDown);
  document.addEventListener('mouseup', onUp);
  document.addEventListener('click', onClick);
  frame = requestAnimationFrame(loop);

  cleanup = () => {
    cancelAnimationFrame(frame);
    document.removeEventListener('mousemove', onMove);
    document.documentElement.removeEventListener('mouseleave', onLeave);
    document.removeEventListener('mousedown', onDown);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('click', onClick);
    setZone('native');
    root.classList.remove('cursor-press');
  };
}

document.addEventListener('astro:page-load', initCursor);
document.addEventListener('astro:before-swap', () => {
  cleanup?.();
  cleanup = null;
});
