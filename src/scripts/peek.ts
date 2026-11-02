const DESKTOP = '(hover: hover) and (pointer: fine) and (min-width: 768px)';
const OFFSET_VW = 0.09;

// A project image follows the cursor over the coordination list (desktop only).
function initPeek() {
  const list = document.querySelector<HTMLElement>('[data-project-list]');
  const peek = document.querySelector<HTMLElement>('.peek');
  if (!list || !peek || !window.matchMedia(DESKTOP).matches) return;
  const img = peek.querySelector('img');
  let current: HTMLElement | null = null;

  const hide = () => {
    peek.classList.remove('show');
    current = null;
  };

  list.addEventListener('mousemove', (e) => {
    const row = (e.target as Element).closest<HTMLElement>('a[data-project-row]');
    if (!row) return hide();
    const half = peek.offsetWidth / 2;
    const x = Math.min(e.clientX + window.innerWidth * OFFSET_VW, window.innerWidth - half - 8);
    peek.style.left = `${x}px`;
    peek.style.top = `${e.clientY}px`;
    if (row !== current) {
      current = row;
      peek.style.backgroundColor = row.dataset.peekColor ?? '';
      if (img) {
        img.hidden = !row.dataset.peekSrc;
        if (row.dataset.peekSrc) img.src = row.dataset.peekSrc;
      }
    }
    peek.classList.add('show');
  });
  list.addEventListener('mouseleave', hide);
}

document.addEventListener('astro:page-load', initPeek);
