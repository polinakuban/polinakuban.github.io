// Mostly vertical wheel gestures scroll the gallery sideways; horizontal ones are left to the browser.
export function wheelToHorizontal(dx: number, dy: number): number | null {
  return Math.abs(dy) > Math.abs(dx) ? dy : null;
}

// The active image is the last one whose left edge has passed 30% of the visible track.
export function activeIndex(lefts: number[], scrollLeft: number, viewport: number): number {
  const line = scrollLeft + viewport * 0.3;
  let index = 0;
  lefts.forEach((left, i) => {
    if (left <= line) index = i;
  });
  return index;
}
