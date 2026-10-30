// Opens, closes and runs the campfire's overlays (src/components/campfire/Sheets.astro): the calling card, the printed
// quote and the testimonial notebook. Each grows out of the spot on screen its thing on the desk was clicked at, and
// shrinks back into it on close (the scrim, Close, or Esc).
import { quotes } from './quotes';

export type Sheet = 'card' | 'quote' | 'notebook';

export function mountSheets() {
  const sheets = Object.fromEntries(
    [...document.querySelectorAll<HTMLElement>('.sheet')].map((el) => [el.dataset.sheet as Sheet, el]),
  ) as Record<Sheet, HTMLElement>;
  let current: HTMLElement | null = null;

  // Where the panel would sit, so it can start shrunk onto `from` and grow from there
  const aim = (el: HTMLElement, from: DOMRect) => {
    const panel = el.querySelector<HTMLElement>('.panel')!;
    panel.style.removeProperty('--from');
    const r = panel.getBoundingClientRect();
    const s = Math.max(0.05, Math.min(1, from.width / r.width, from.height / r.height));
    const dx = from.x + from.width / 2 - (r.x + r.width / 2), dy = from.y + from.height / 2 - (r.y + r.height / 2);
    panel.style.setProperty('--from', `translate(${dx}px, ${dy}px) scale(${s})`);
  };
  const close = () => {
    const el = current;
    if (!el) return;
    current = null;
    el.classList.remove('open');
    setTimeout(() => !el.classList.contains('open') && (el.hidden = true), 600);
  };
  const open = (what: Sheet, from: DOMRect) => {
    if (current && current !== sheets[what]) close();
    const el = sheets[what];
    if (what === 'quote') printQuote();
    if (what === 'notebook') goTo(0, false);
    if (what === 'card') card.classList.remove('flipped');
    if (current === el) return;
    current = el;
    el.hidden = false;
    el.classList.remove('open');
    aim(el, from);
    el.getBoundingClientRect(); // start from the shrunk pose
    requestAnimationFrame(() => {
      el.classList.add('open');
      el.querySelector<HTMLElement>('[data-close]:not(.scrim)')?.focus({ preventScroll: true });
    });
  };
  for (const el of Object.values(sheets)) el.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
  addEventListener('keydown', (e) => {
    if (!current) return;
    if (e.key === 'Escape') close();
    if (current === sheets.notebook && e.key === 'ArrowRight') goTo(at + 1);
    if (current === sheets.notebook && e.key === 'ArrowLeft') goTo(at - 1);
  });

  // Calling card: clicking it turns it over
  const card = sheets.card.querySelector<HTMLElement>('.callcard')!;
  card.addEventListener('click', () => card.classList.toggle('flipped'));

  // Printed quote: a random one, never the same twice running, fed out of the slot
  const receipt = sheets.quote.querySelector<HTMLElement>('.receipt')!;
  const field = (name: string) => receipt.querySelector<HTMLElement>(`[data-${name}]`)!;
  let last = -1, ticket = 100 + Math.floor(Math.random() * 800);
  const printQuote = () => {
    let i = Math.floor(Math.random() * (quotes.length - 1));
    if (i >= last) i++;
    last = i;
    const q = quotes[i];
    field('text').textContent = `“${q.text}”`;
    field('by').textContent = `— ${q.by}`;
    field('from').textContent = q.from ?? '';
    field('when').textContent = new Date().toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    field('no').textContent = `No. ${String(++ticket).padStart(4, '0')}`;
    receipt.classList.remove('printing');
    receipt.getBoundingClientRect(); // restart the feed
    receipt.classList.add('printing');
  };
  sheets.quote.querySelector('[data-again]')!.addEventListener('click', printQuote);

  // Notebook: `at` leaves are turned (0 = closed on its cover, all = closed on its back). Clicking a page on the right
  // turns it over; clicking one on the left turns it back. The turning leaf rides on top until it lands.
  const book = sheets.notebook.querySelector<HTMLElement>('.book')!;
  const leaves = [...book.querySelectorAll<HTMLElement>('.leaf')];
  const prev = sheets.notebook.querySelector<HTMLButtonElement>('[data-prev]')!, next = sheets.notebook.querySelector<HTMLButtonElement>('[data-next]')!;
  let at = 0;
  const goTo = (n: number, animate = true) => {
    n = Math.max(0, Math.min(leaves.length, n));
    const moving = n > at ? leaves[at] : n < at ? leaves[n] : null;
    at = n;
    leaves.forEach((leaf, k) => {
      leaf.style.transition = animate ? '' : 'none';
      leaf.classList.toggle('turned', k < at);
      leaf.style.zIndex = String(k < at ? k + 1 : leaves.length - k);
    });
    if (moving) {
      moving.style.zIndex = String(leaves.length + 1);
      setTimeout(() => {
        const k = leaves.indexOf(moving);
        moving.style.zIndex = String(k < at ? k + 1 : leaves.length - k);
      }, 900);
    }
    book.style.transition = animate ? '' : 'none';
    book.dataset.at = at === 0 ? '0' : at === leaves.length ? 'end' : 'open';
    prev.disabled = at === 0;
    next.disabled = at === leaves.length;
  };
  leaves.forEach((leaf, k) => leaf.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a')) return;
    goTo(k < at ? k : k + 1);
  }));
  prev.addEventListener('click', () => goTo(at - 1));
  next.addEventListener('click', () => goTo(at + 1));

  return { open, close };
}
