// Small DOM helpers shared by the tablet desktop and its demo apps.

type Child = Node | string | number | null | undefined | false;
type Props = Record<string, unknown> | null;

/** h('div', { class: 'x', onclick: fn }, 'text', child) builds an element. on* props become listeners. */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props?: Props, ...kids: (Child | Child[])[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
    else if (k === 'class') el.className = String(v);
    else if (k === 'style') el.style.cssText = String(v);
    else if (k === 'value') (el as HTMLInputElement).value = String(v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : String(kid));
  return el;
}

/** Inline stroke icon from one or more SVG path strings (24px grid). */
export function icon(paths: string | string[], size = 18) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  for (const d of [paths].flat()) {
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', d);
    svg.append(p);
  }
  return svg;
}

export const peso = (n: number, cents = false) =>
  '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });

/** A short message at the bottom of the desktop. */
export function toast(text: string) {
  const t = h('div', { class: 'toast', role: 'status' }, text);
  document.body.append(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => {
    t.classList.remove('in');
    setTimeout(() => t.remove(), 300);
  }, 2600);
}

/** Replaces everything inside el. */
export function fill(el: Element, ...kids: (Child | Child[])[]) {
  el.replaceChildren();
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : String(kid));
}

// Icons (lucide-style paths)
export const I = {
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  mail: ['M3 6h18v12H3z', 'm3 7 9 6 9-6'],
  doc: ['M7 3h7l5 5v13H7z', 'M14 3v5h5', 'M10 13h6M10 17h6'],
  ledger: ['M4 4h16v16H4z', 'M4 9h16M9 9v11', 'M12 13h5M12 16h5'],
  cart: ['M3 4h2l2.4 11h10.2L20 7H6.2', 'M9 20h.01M17 20h.01'],
  shirt: ['M8 3 4 6l2 4 2-1v12h8V9l2 1 2-4-4-3', 'M8 3a4 4 0 0 0 8 0'],
  bowl: ['M3 11h18a9 9 0 0 1-18 0z', 'M8 7c0-1 1-1 1-2M12 7c0-1 1-1 1-2M16 7c0-1 1-1 1-2'],
  car: ['M5 16V11l2-5h10l2 5v5', 'M3 16h18v3H3z', 'M7 19v1M17 19v1', 'M5 11h14'],
  home: ['M3 11 12 4l9 7', 'M5 10v10h14V10', 'M10 20v-5h4v5'],
  leaf: ['M5 19c0-8 5-14 15-15-1 10-7 15-15 15z', 'M5 19 13 11'],
  check: 'm5 12 4 4 10-10',
  x: 'M6 6l12 12M18 6 6 18',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  bell: ['M6 16V11a6 6 0 0 1 12 0v5l2 2H4z', 'M10 21h4'],
  cal: ['M4 6h16v14H4z', 'M4 10h16M8 3v4M16 3v4'],
  users: ['M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M2 21a7 7 0 0 1 14 0', 'M16 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-4-6.3'],
  grid: ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'],
  receipt: ['M6 3h12v18l-3-2-3 2-3-2-3 2z', 'M9 8h6M9 12h6'],
  send: ['M22 2 11 13', 'M22 2 15 22l-4-9-9-4z'],
  print: ['M7 9V3h10v6', 'M5 9h14v8h-3', 'M8 17H5V9', 'M8 14h8v7H8z'],
  user: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21a8 8 0 0 1 16 0'],
  pin: ['M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z', 'M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
};
