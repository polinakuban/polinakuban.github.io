const FOCUSABLE = 'a[href], button:not([disabled]):not([hidden]), [tabindex]:not([tabindex="-1"])';

// Focus is moved manually: Safari skips links on Tab by default, which would let focus escape a dialog.
export function trapTab(container: HTMLElement | null, e: KeyboardEvent) {
  const items = [...(container?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter((el) => el.offsetParent !== null);
  if (!items.length) return;
  e.preventDefault();
  const current = items.indexOf(document.activeElement as HTMLElement);
  const step = e.shiftKey ? -1 : 1;
  const next = current === -1 ? 0 : (current + step + items.length) % items.length;
  items[next].focus();
}
