import { copyText } from '../lib/clipboard';
import { trapTab } from './focus-trap';

const OPEN_CLASS = 'contact-open';
const COPIED_MS = 1600;
const FALLBACK_MS = 4000;

let bound = false;
let lastFocus: HTMLElement | null = null;
let statusTimer: number | undefined;

const panel = () => document.getElementById('contact-panel');

export const isContactOpen = () => document.documentElement.classList.contains(OPEN_CLASS);

export function openContact() {
  const p = panel();
  if (!p) return;
  lastFocus = document.activeElement as HTMLElement | null;
  document.documentElement.classList.add(OPEN_CLASS);
  p.removeAttribute('inert');
  p.querySelector<HTMLElement>('button[data-contact-close]')?.focus({ preventScroll: true });
}

function closeContact() {
  const p = panel();
  document.documentElement.classList.remove(OPEN_CLASS);
  p?.setAttribute('inert', '');
  lastFocus?.focus({ preventScroll: true });
}

function showStatus(text: string, ms: number) {
  const status = panel()?.querySelector<HTMLElement>('[data-copy-status]');
  if (!status) return;
  status.textContent = text;
  status.hidden = false;
  window.clearTimeout(statusTimer);
  statusTimer = window.setTimeout(() => (status.hidden = true), ms);
}

async function handleCopy(button: HTMLElement) {
  const value = button.dataset.copy ?? '';
  if (await copyText(value, navigator.clipboard)) return showStatus('Copied ✓', COPIED_MS);
  const text = button.querySelector('[data-copy-text]');
  if (text) {
    const range = document.createRange();
    range.selectNodeContents(text);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
  }
  showStatus('Press ⌘C / Ctrl+C', FALLBACK_MS);
}

function onClick(e: MouseEvent) {
  const target = e.target as Element | null;
  if (!target) return;
  if (target.closest('[data-contact-open]')) {
    e.preventDefault();
    openContact();
    return;
  }
  if (target.closest('[data-contact-close]')) return closeContact();
  const copy = target.closest<HTMLElement>('[data-copy]');
  if (copy) void handleCopy(copy);
}

function onKey(e: KeyboardEvent) {
  if (!isContactOpen()) return;
  if (e.key === 'Escape') closeContact();
  else if (e.key === 'Tab') trapTab(panel(), e);
}

// The document survives client-side navigation, so delegated listeners are bound exactly once.
export function initContact() {
  if (bound) return;
  bound = true;
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
  document.addEventListener('astro:after-swap', () => document.documentElement.classList.remove(OPEN_CLASS));
}

initContact();
