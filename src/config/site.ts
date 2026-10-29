// All the words on the site live here. Edit this file and every section picks it up.
// Anything in [brackets] is a placeholder: replace it with your real number before the pitch.
import type { ImageMetadata } from 'astro';
import docTools from '../assets/projects/doc-gen/tools.png';
import docForm from '../assets/projects/doc-gen/form.png';

export const brand = {
  name: 'Saleng Labs',
  tagline: 'Custom systems for local businesses',
  description:
    'Saleng Labs builds custom systems and automations for the schools, shops and offices that still run on paper.',
  location: 'La Trinidad, Benguet',
  email: 'hello@example.com', // TODO: your real email. While it's example.com, the buttons only show a message.
};

// The five colour blocks beside the hero photo. Each block is the colour of the chapter it opens.
export const nav = [
  { href: '#problem', label: 'Problem', field: 'night' },
  { href: '#products', label: 'Products', field: 'pine' },
  { href: '#market', label: 'Market', field: 'resin' },
  { href: '#model', label: 'Pricing', field: 'fog' },
  { href: '#roadmap', label: 'Roadmap', field: 'ember' },
];

export const hero = {
  eyebrow: 'Now piloting in Benguet',
  subtitle: 'Stop doing it the hard way.',
  text: 'Saleng starts the fire. We build the systems that keep it burning: automation, POS, booking, inventory, made for local businesses.',
};

export const problemHead = {
  title: 'Still done the hard way',
  // Set as a staircase: each item is one step (line) of the sentence.
  text: ['Across Benguet,', 'shops, schools and offices', 'run on notebooks,', 'paper slips and memory.', 'It works, until it doesn’t.'],
};

export const problems = [
  {
    title: 'Everything is done by hand',
    text: 'Logbooks, listahan, receipts and forms are filled out one at a time. The same work is repeated every day, and the line keeps growing.',
  },
  {
    title: 'Mistakes and lost records',
    text: 'A miscount, a lost slip or a wrong price is easy to miss and hard to fix. Small errors quietly cost time, money and trust.',
  },
  {
    title: 'Good systems cost too much',
    text: 'Most software is priced for big companies, with high setup costs, monthly fees and features small businesses never use. So most owners go without.',
  },
];

export const solution = {
  title: 'One system, built around how you already work',
  text: 'Saleng Labs builds small, focused systems for one business at a time. We bring and install the hardware too, from POS terminals to self-service kiosks, so you get one complete setup that works offline and is simple enough for new staff on day one.',
  points: ['Hardware included', 'Works offline', 'Staff trained on-site', 'Local support'],
};

export const steps = [
  { title: 'Visit & map', text: 'We sit with your staff and map every step of the work you want to fix.' },
  { title: 'Build', text: 'We build a system around that exact workflow, using your own forms and templates.' },
  { title: 'Install & train', text: 'We install the system and the hardware it needs (a POS terminal, a kiosk, or your own PC) and train your team until they are comfortable.' },
  { title: 'Support', text: 'We stay on call for fixes and updates as your business changes.' },
];

export type Product = {
  slug: string; // the page address: /products/<slug>
  name: string;
  status: 'live' | 'dev';
  for: string;
  short: string; // one line on the card
  tint: string; // the card's color
  visual: 'docs' | 'pos' | 'kiosk'; // the little illustration on the card
  problem: string; // the specific problem, shown on the product page
  built: string[]; // what we built (or are building)
  results?: string[];
  shots: { src: ImageMetadata; caption: string }[]; // screenshots; leave empty until you have some
};

export const products: Product[] = [
  {
    slug: 'doc-gen',
    name: 'DOC GEN',
    status: 'live',
    for: 'School registrars',
    short: 'Print-ready school certificates in seconds, not an hour.',
    tint: '#3ecf8e',
    visual: 'docs',
    problem:
      'Every certificate (grades, enrollment, graduation, GWA, honorable dismissal, transcripts) was typed by hand into Word and Excel. Staff copied names, subjects and grades from the school system. A single typo meant reprinting on official paper, and the line at the window kept growing.',
    built: [
      'Staff pick one of 11 documents and paste the student’s record straight from the school system',
      'DOC GEN reads the record and pulls out terms, subjects, units and grades',
      'It computes the weighted average and GWA, so nobody does it on a calculator',
      'It fills the official template, positioned to print exactly onto pre-printed paper',
    ],
    results: ['Seconds instead of close to an hour per document', 'No copy errors: grades come straight from the source', 'New staff can issue certificates on day one'],
    shots: [
      { src: docTools, caption: 'Each of the 11 documents has its own tool' },
      { src: docForm, caption: 'Paste the record, and the form fills itself' },
    ],
  },
  {
    slug: 'snack-stop-pos',
    name: 'Snack Stop POS',
    status: 'dev',
    for: 'Snack shops & sari-sari stores',
    short: 'Fast checkout, live stock, and real profit per item.',
    tint: '#e5b454',
    visual: 'pos',
    problem:
      'Sales are written in a notebook and stock is counted by hand at closing. When ingredient prices go up, owners can’t easily tell which items still make money, and running out of a best-seller is only noticed when a customer asks for it.',
    built: [
      'A simple checkout screen: tap the items, see the total and change',
      'Stock goes down with every sale, with a warning when something runs low',
      'Real cost per item from ingredient prices, so owners see the profit on each one',
      'Daily sales summary without counting by hand',
    ],
    shots: [],
  },
  {
    slug: 'laundry-kiosk',
    name: 'Laundry Kiosk',
    status: 'dev',
    for: 'Laundry shops',
    short: 'Self-service drop-off, tracking and ready-for-pickup alerts.',
    tint: '#4fb8d6',
    visual: 'kiosk',
    problem:
      'Customers line up just to drop off a bag or ask if their laundry is done. Staff juggle paper claim slips, and a lost slip means an argument at pickup.',
    built: [
      'A kiosk where customers drop off and get an order number on their own',
      'Each order moves through Received, Washing, Drying and Ready',
      'Customers get a message the moment their laundry is ready',
      'No paper claim slips to lose',
    ],
    shots: [],
  },
];

export const market = {
  title: 'Thousands still on paper',
  text: 'Our first market is the schools, shops and service businesses of Benguet, then the rest of the Cordillera.',
  tiers: [
    { label: 'TAM', value: '₱[000]M', text: 'Small businesses and schools in the Philippines that need custom systems' },
    { label: 'SAM', value: '₱[000]M', text: 'Businesses and schools in the Cordillera region' },
    { label: 'SOM', value: '₱[000]K', text: 'What we can reach in Benguet in the first [0] years' },
  ],
  segments: ['School registrars', 'Snack shops & sari-sari stores', 'Laundry shops', 'Restaurants & cafés'],
};

export const traction = {
  stats: [
    { value: '[00]', label: 'Businesses using our systems' },
    { value: '[00]', label: 'Staff trained on our systems' },
    { value: '[00] hrs', label: 'Staff time saved each month' },
    { value: '[0] min', label: 'Per document, down from ~1 hour' },
  ],
  pilot: {
    title: 'Pilot: DOC GEN at a college registrar',
    text: 'DOC GEN is in daily use at a college registrar’s office. Certificates that took close to an hour of careful typing now take seconds, and new staff can issue them on day one.',
  },
};

// To add a face: put the photo in src/assets/testimonials/, import it at the top of this file
// (e.g. `import ana from '../assets/testimonials/ana.jpg';`), and set `photo: ana`.
// Without a photo, the person's initials are shown. Remove `sample: true` for real ones.
export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  photo?: ImageMetadata;
  sample?: boolean;
};

export const testimonials: Testimonial[] = [
  {
    // Keep it short (6–10 words): it is set across the whole screen.
    quote: '[Your customer’s words go here]',
    name: '[Customer name]',
    role: '[Role, Business]',
    sample: true,
  },
];

export const pricing = {
  title: 'Build once, support monthly',
  text: 'Customers pay once for the system and a monthly fee for support and updates. That fee is our recurring revenue.',
  tiers: [
    {
      name: 'Starter',
      price: '₱[0,000]',
      unit: 'one-time',
      monthly: '+ ₱[000]/mo support',
      features: ['One ready-made system (POS, Kiosk or DOC GEN)', 'Hardware & on-site setup', 'Staff training'],
    },
    {
      name: 'Custom',
      price: '₱[00,000]',
      unit: 'one-time',
      monthly: '+ ₱[000]/mo support',
      features: ['System built for your workflow', 'Your own forms & templates', 'Training & on-site setup'],
      featured: true,
    },
    {
      name: 'Automation add-on',
      price: '₱[0,000]',
      unit: 'per automation',
      monthly: '+ ₱[000]/mo',
      features: ['SMS / Messenger alerts', 'Reports sent automatically', 'Connects to your existing tools'],
    },
  ],
  streams: ['One-time build fees', 'Monthly support & updates', 'Automation add-ons'],
};

export const roadmap = [
  { when: '2026', title: 'DOC GEN', text: 'Live at a college registrar.', done: true },
  { when: '[Q0 2026]', title: 'Snack Stop POS', text: 'Point-of-sale and stock for snack shops.', done: false },
  { when: '[Q0 2027]', title: 'Laundry Kiosk', text: 'Self-service kiosk for laundry shops.', done: false },
  { when: '[Q0 2027]', title: '[Next product]', text: '[What comes next]', done: false },
];

export const founder = {
  name: 'Wayne V. Banase',
  role: 'Founder · Systems & Automation',
  initials: 'WVB',
  // Your own words, from your portfolio About text.
  bio: 'Growing up in a community where many businesses, offices, and even the government still rely on manual processes, I’ve seen how much room there is for improvement. I believe everyone deserves a system that fits the way they work, no matter how small. I want to help bring that to local businesses, one system at a time.',
};

export const cta = {
  title: 'Let’s build your system',
  text: 'Tell us what takes your team the most time. We’ll show you what it could look like.',
};
