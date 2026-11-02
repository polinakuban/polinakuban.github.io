import { formatBudapestTime } from '../lib/time';

let timer: number | undefined;

function tick() {
  const now = formatBudapestTime(new Date());
  document.querySelectorAll<HTMLElement>('[data-clock]').forEach((el) => (el.textContent = now));
}

document.addEventListener('astro:page-load', () => {
  window.clearInterval(timer);
  tick();
  timer = window.setInterval(tick, 60_000);
});
