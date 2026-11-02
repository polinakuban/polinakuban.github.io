import type { Mode } from './types';

export type CursorZone = 'contact' | 'lens' | 'native';

type Target = { closest(selector: string): unknown } | null;

const CASE = 'a[data-case]';
// [data-contact-close] covers the dimmed backdrop: it closes the panel before the cursor sees the click
const INTERACTIVE = 'a, button, input, textarea, select, [role=button], [data-project-row], [data-contact-close]';

export function zoneFor(target: Target, mode: Mode, panelOpen: boolean): CursorZone {
  if (panelOpen || !target) return 'native';
  if (target.closest(CASE)) return mode === 'design' ? 'lens' : 'native';
  if (target.closest(INTERACTIVE)) return 'native';
  return 'contact';
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}
