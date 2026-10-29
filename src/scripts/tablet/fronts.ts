// Front pages: each project opens on the business's own one-page website (made up, sample copy), with the system
// behind its login or order button. The hero shows a live, shrunken copy of the system.
import { h, toast } from './ui';

export type Site = {
  brand: string; mark: string; serif?: boolean;
  theme: { bg: string; ink: string; muted: string; accent: string; on: string; card: string; line: string };
  nav: string[]; login: string; eyebrow: string; title: string; sub: string;
  cta: string; ctaOpens?: boolean; // the main button opens the system (customer-facing) or just answers (demo)
  feats: [string, string][];
};

export function frontPage(s: Site, app: (root: HTMLElement) => void, openApp: () => void) {
  const t = s.theme;
  const shot = h('div', { class: 'fp-shot-live', inert: true });
  app(shot);
  const soon = (what: string) => () => toast(`${what} (demo: only the system is built)`);
  return h('div', {
    class: `fp${s.serif ? ' serif' : ''}`,
    style: `--fp-bg:${t.bg};--fp-ink:${t.ink};--fp-muted:${t.muted};--fp-accent:${t.accent};--fp-on:${t.on};--fp-card:${t.card};--fp-line:${t.line}`,
  },
    h('nav', { class: 'fp-nav' },
      h('span', { class: 'fp-brand' }, h('span', { class: 'fp-mark' }, s.mark), s.brand),
      h('span', { class: 'fp-links' }, s.nav.map((n) => h('button', { onclick: soon(n) }, n))),
      h('button', { class: 'fp-login', onclick: openApp }, s.login)),
    h('section', { class: 'fp-hero' },
      h('div', { class: 'fp-copy' },
        h('span', { class: 'fp-eyebrow' }, s.eyebrow),
        h('h1', null, s.title),
        h('p', null, s.sub),
        h('div', { class: 'fp-ctas' },
          h('button', { class: 'fp-btn', onclick: s.ctaOpens ? openApp : soon(s.cta) }, s.cta),
          s.ctaOpens ? null : h('button', { class: 'fp-btn ghost', onclick: openApp }, `${s.login} →`))),
      h('button', { class: 'fp-shot', 'aria-label': `Open the ${s.brand} system`, onclick: openApp },
        h('span', { class: 'fp-shot-bar' }, h('i'), h('i'), h('i')), shot)),
    h('section', { class: 'fp-feats' }, s.feats.map(([a, b]) => h('div', null, h('b', null, a), h('p', null, b)))),
    h('footer', { class: 'fp-foot' }, h('span', null, `© ${new Date().getFullYear()} ${s.brand}`), h('span', null, 'Sample website made for this portfolio')));
}

export const SITES: Record<string, Site> = {
  garcia: {
    brand: 'Garcia Bookkeeping', mark: 'GB', serif: true,
    theme: { bg: '#f7f5fb', ink: '#1d1534', muted: '#5d5677', accent: '#6d28d9', on: '#ffffff', card: '#ffffff', line: '#e6e1f0' },
    nav: ['Services', 'Pricing', 'About', 'Contact'], login: 'Staff login',
    eyebrow: 'Bookkeeping & BIR compliance · Baguio and La Trinidad',
    title: 'Your books in order. Your BIR returns on time.',
    sub: 'Monthly bookkeeping, tax filing and payroll for small businesses and professionals in Benguet. We track every deadline, so you never pay a penalty.',
    cta: 'Book a free consultation',
    feats: [
      ['Monthly bookkeeping', 'Sales, expenses and receipts recorded every month, with books of accounts ready for the BIR.'],
      ['Every return, on time', '1601-C, 2550Q, 2551Q, 1701Q and the rest, filed before the due date and tracked per client.'],
      ['Payroll & withholding', 'Payslips, SSS, PhilHealth and Pag-IBIG contributions, and 2316s at year end.'],
    ],
  },
  pos: {
    brand: 'Snack Stop', mark: 'SS',
    theme: { bg: '#fff7e6', ink: '#3a2500', muted: '#7a6034', accent: '#e5a224', on: '#2b1a00', card: '#ffffff', line: '#f1dfb8' },
    nav: ['Menu', 'Bundles', 'Visit us'], login: 'Staff: open POS',
    eyebrow: 'Snacks & merienda · La Trinidad',
    title: 'Merienda, any time of day.',
    sub: 'Siomai, fishballs, turon and iced coffee, made fresh and served fast. Order at the counter and be on your way in a minute.',
    cta: 'See the menu',
    feats: [
      ['Made fresh daily', 'Small batches all day, so nothing sits under the lamp for long.'],
      ['Fast at the counter', 'Our POS rings you up in seconds, with the exact change every time.'],
      ['Barkada bundles', 'Siomai, fishball and palamig sets for four, ready in five minutes.'],
    ],
  },
  laundry: {
    brand: 'Suds & Wash', mark: 'SW',
    theme: { bg: '#eef8fc', ink: '#0d3a4a', muted: '#4c7584', accent: '#1f9bc4', on: '#ffffff', card: '#ffffff', line: '#d3ebf3' },
    nav: ['Services', 'Prices', 'How it works'], login: 'Staff login',
    eyebrow: 'Self-service laundry · La Trinidad',
    title: 'Drop it off. We’ll text you when it’s fresh.',
    sub: 'Weigh your laundry, choose a service and get your order number at the kiosk. No lines, no paper slips to lose.',
    cta: 'Try the kiosk', ctaOpens: true,
    feats: [
      ['₱35 per kilo', 'Wash, dry and fold, ready the same day for drop-offs before noon.'],
      ['A text when it’s ready', 'Your order moves from Washing to Ready, and your phone hears about it first.'],
      ['No paper slips', 'Your order number is all you need at pickup.'],
    ],
  },
  resto: {
    brand: 'Kusina Highland', mark: 'KH', serif: true,
    theme: { bg: '#1a1210', ink: '#f7ede4', muted: '#b9a596', accent: '#f97362', on: '#1a1210', card: '#241a17', line: '#3a2b26' },
    nav: ['Menu', 'Reservations', 'Our story'], login: 'Kitchen login',
    eyebrow: 'Cordillera kitchen · La Trinidad, Benguet',
    title: 'Highland flavors, ordered from your table.',
    sub: 'Pinikpikan, etag fried rice and strawberry taho. Order from the tablet at your table; it goes straight to the kitchen.',
    cta: 'Order from your table', ctaOpens: true,
    feats: [
      ['No waiting to order', 'Browse the menu and send your order the moment you sit down.'],
      ['Straight to the kitchen', 'Your order shows on the kitchen screen with a timer, so nothing gets forgotten.'],
      ['Local ingredients', 'Vegetables from the La Trinidad trading post, coffee from Atok.'],
    ],
  },
  rental: {
    brand: 'Pine Ridge Car Rental', mark: 'PR',
    theme: { bg: '#ffffff', ink: '#0f1b33', muted: '#55617a', accent: '#2f6bff', on: '#ffffff', card: '#f4f7ff', line: '#e1e7f5' },
    nav: ['Our cars', 'Rates', 'FAQ'], login: 'Fleet login',
    eyebrow: 'Car rental · Baguio City and Benguet',
    title: 'Rent a car in Baguio. Book it on Messenger.',
    sub: 'Sedans, MPVs and vans, with or without a driver. Our assistant answers and books any time, even at 2 am.',
    cta: 'Chat with us', ctaOpens: true,
    feats: [
      ['Answers in seconds', 'Rates, available cars and dates, right in Messenger.'],
      ['Booked on the spot', 'The assistant checks the fleet calendar and holds your car.'],
      ['With or without a driver', 'Self-drive or a local driver who knows the mountain roads.'],
    ],
  },
  boarding: {
    brand: 'Casa Benguet', mark: 'CB', serif: true,
    theme: { bg: '#fdf3f7', ink: '#3d1a2b', muted: '#7a5466', accent: '#c2417f', on: '#ffffff', card: '#ffffff', line: '#f3d9e5' },
    nav: ['Rooms', 'Rates', 'House rules'], login: 'Owner login',
    eyebrow: 'Student boarding house · La Trinidad',
    title: 'A quiet room near campus.',
    sub: 'Bedspace and private rooms a short walk from the university, with Wi-Fi, a study area and a submeter for every room.',
    cta: 'Ask about a room',
    feats: [
      ['Fair electric bills', 'Each room has its own submeter. You pay for what you use.'],
      ['Receipts by text', 'Pay rent and get your receipt on your phone, no notebook needed.'],
      ['Safe and quiet', 'Curfew, CCTV at the gate and a caretaker on site.'],
    ],
  },
  veggie: {
    brand: 'Highland Trading', mark: 'HT',
    theme: { bg: '#11180c', ink: '#eef6e4', muted: '#a7b797', accent: '#84cc16', on: '#11180c', card: '#1a2412', line: '#2b3a20' },
    nav: ['Today’s prices', 'For farmers', 'For buyers'], login: 'Stall login',
    eyebrow: 'Vegetable trading · La Trinidad Trading Post',
    title: 'Fresh from Benguet farms, priced every morning.',
    sub: 'We buy from local farmers and supply restaurants and markets across Luzon. Prices go up at 5 am, and farmers are paid the same day.',
    cta: 'See today’s prices', ctaOpens: true,
    feats: [
      ['Prices posted daily', 'Cabbage, carrots, potatoes and more, updated before the trucks arrive.'],
      ['Paid the same day', 'Every delivery is weighed, logged and paid out with a printed slip.'],
      ['Clear commission', 'One flat fee per delivery, shown on every slip.'],
    ],
  },
};
