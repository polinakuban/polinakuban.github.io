export function nearestIndex(centers: number[], mid: number): number {
  let best = -1;
  let bestDistance = Infinity;
  centers.forEach((c, i) => {
    const d = Math.abs(c - mid);
    if (d < bestDistance) {
      bestDistance = d;
      best = i;
    }
  });
  return best;
}
