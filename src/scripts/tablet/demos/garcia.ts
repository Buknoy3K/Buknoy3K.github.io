// Garcia Bookkeeping: an accounting office's client tracker. Every client's BIR returns are worked out from what the
// client is registered for (VAT or not, employees, individual or corporation), with due dates computed from today,
// so the dashboard always shows a believable live picture. All clients and numbers are sample data.
import { h, icon, fill, peso, toast, I } from '../ui';

type Status = 'pending' | 'prepared' | 'filed' | 'overdue';
type Client = {
  id: string; name: string; kind: 'Sole proprietor' | 'Corporation' | 'Professional'; vat: boolean; rdo: string;
  tin: string; staff: number; agent: boolean; contact: string; fee: number;
};
type Filing = { client: Client; form: string; what: string; period: string; due: Date; key: string };

const CLIENTS: Client[] = [
  { id: 'mbc', name: 'Mountain Brew Café', kind: 'Sole proprietor', vat: false, rdo: '009', tin: '412', staff: 4, agent: false, contact: 'Liza Ramos', fee: 3500 },
  { id: 'pvl', name: 'Pines View Lodging Inc.', kind: 'Corporation', vat: true, rdo: '008', tin: '208', staff: 18, agent: true, contact: 'Arnel Bautista', fee: 9000 },
  { id: 'dch', name: 'Dela Cruz Hardware', kind: 'Sole proprietor', vat: true, rdo: '009', tin: '771', staff: 6, agent: true, contact: 'Rudy Dela Cruz', fee: 6000 },
  { id: 'ksf', name: 'Kapi Strawberry Farm', kind: 'Sole proprietor', vat: false, rdo: '009', tin: '305', staff: 0, agent: false, contact: 'Joy Kapi', fee: 2500 },
  { id: 'bfv', name: 'Benguet Fresh Veggie Trading Corp.', kind: 'Corporation', vat: true, rdo: '009', tin: '590', staff: 11, agent: true, contact: 'Mark Odsey', fee: 8500 },
  { id: 'sar', name: 'Sablan Auto Repair', kind: 'Sole proprietor', vat: false, rdo: '009', tin: '133', staff: 3, agent: false, contact: 'Ben Palasi', fee: 3000 },
  { id: 'hdc', name: 'Dr. Ana Lagman, Dentist', kind: 'Professional', vat: false, rdo: '008', tin: '846', staff: 1, agent: false, contact: 'Ana Lagman', fee: 3000 },
  { id: 'cps', name: 'Cordillera Print Shop', kind: 'Sole proprietor', vat: false, rdo: '008', tin: '627', staff: 2, agent: false, contact: 'Paolo Wayas', fee: 3000 },
  { id: 'acr', name: 'Atok Coffee Roasters Corp.', kind: 'Corporation', vat: true, rdo: '009', tin: '954', staff: 9, agent: true, contact: 'Grace Tumpap', fee: 7500 },
];

const FORM_NAMES: Record<string, string> = {
  '1601-C': 'Withholding tax on compensation',
  '0619-E': 'Expanded withholding (monthly remittance)',
  '1601-EQ': 'Expanded withholding (quarterly)',
  '2550Q': 'Quarterly VAT',
  '2551Q': 'Quarterly percentage tax',
  '1701Q': 'Quarterly income tax (individual)',
  '1702Q': 'Quarterly income tax (corporation)',
  '1701': 'Annual income tax (individual)',
  '1702-RT': 'Annual income tax (corporation)',
  '1604-C': 'Annual info return, compensation',
};

const formsOf = (c: Client) => {
  const f: string[] = [];
  if (c.staff) f.push('1601-C');
  if (c.agent) f.push('0619-E', '1601-EQ');
  f.push(c.vat ? '2550Q' : '2551Q');
  f.push(...(c.kind === 'Corporation' ? ['1702Q', '1702-RT'] : ['1701Q', '1701']));
  if (c.staff) f.push('1604-C');
  return f;
};

const DAY = 864e5;
const today = new Date();
today.setHours(0, 0, 0, 0);
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const d = (y: number, m: number, day: number) => new Date(y, m, day); // month may overflow, Date rolls it over
const lastDay = (y: number, m: number) => new Date(y, m + 1, 0);
const fmt = (x: Date) => `${MON[x.getMonth()]} ${x.getDate()}`;
const days = (x: Date) => Math.round((x.getTime() - today.getTime()) / DAY);
const when = (x: Date) => {
  const n = days(x);
  return n === 0 ? 'today' : n === 1 ? 'tomorrow' : n > 0 ? `in ${n} days` : n === -1 ? '1 day late' : `${-n} days late`;
};

/** Every filing due from 40 days ago to 60 days ahead, for every client. */
function filings(): Filing[] {
  const out: Filing[] = [];
  const Y = today.getFullYear(), M = today.getMonth();
  for (const c of CLIENTS) {
    const forms = formsOf(c);
    const add = (form: string, period: string, due: Date) => {
      if (forms.includes(form)) out.push({ client: c, form, what: FORM_NAMES[form], period, due, key: `${c.id}|${form}|${period}` });
    };
    for (let k = -3; k <= 2; k++) {
      const p = d(Y, M + k, 1), y = p.getFullYear(), m = p.getMonth(), label = `${MON[m]} ${y}`;
      add('1601-C', label, m === 11 ? d(y + 1, 0, 15) : d(y, m + 1, 10));
      if (m % 3 !== 2) add('0619-E', label, d(y, m + 1, 10)); // the third month of a quarter goes on the 1601-EQ
      if (m % 3 === 2) {
        const q = `Q${(m + 1) / 3} ${y}`;
        add('1601-EQ', q, lastDay(y, m + 1));
        add('2550Q', q, d(y, m + 1, 25));
        add('2551Q', q, d(y, m + 1, 25));
        if (m < 11) {
          add('1701Q', q, d(y, m + 2, 15));
          add('1702Q', q, new Date(lastDay(y, m).getTime() + 60 * DAY));
        }
      }
    }
    for (const y of [Y - 1, Y]) {
      add('1701', String(y), d(y + 1, 3, 15));
      add('1702-RT', String(y), d(y + 1, 3, 15));
      add('1604-C', String(y), d(y + 1, 0, 31));
    }
  }
  return out.filter((f) => days(f.due) >= -40 && days(f.due) <= 60).sort((a, b) => a.due.getTime() - b.due.getTime());
}

const hash = (s: string) => [...s].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7);

export function garcia(root: HTMLElement) {
  const all = filings();
  const set = new Map<string, Status>(); // changes made in the demo
  const status = (f: Filing): Status => {
    const s = set.get(f.key);
    if (s) return s;
    const n = days(f.due), r = hash(f.key);
    if (n < 0) return r % 11 === 0 ? 'overdue' : 'filed';
    if (n <= 14) return (['filed', 'prepared', 'pending', 'pending'] as Status[])[r % 4];
    return 'pending';
  };
  const chip = (s: Status) => h('span', { class: `chip ${{ filed: 'ok', prepared: 'info', pending: 'mute', overdue: 'bad' }[s]}` }, s[0].toUpperCase() + s.slice(1));
  const action = (f: Filing) => {
    const s = status(f);
    if (s === 'filed') return h('span', { class: 'muted sm' }, 'Done');
    const next: Status = s === 'pending' ? 'prepared' : 'filed';
    return h('button', {
      class: 'btn sm',
      onclick: () => {
        set.set(f.key, next);
        toast(`${f.client.name}: ${f.form} ${next === 'filed' ? 'marked filed' : 'ready to file'}`);
        render();
      },
    }, next === 'filed' ? 'Mark filed' : 'Mark prepared');
  };

  const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const docs = [
    ['mbc', `${MON[prev.getMonth()]} sales and purchase invoices`],
    ['pvl', `Payroll register, ${MON[prev.getMonth()]}`],
    ['bfv', 'Certificates of withholding (2307) from buyers'],
    ['dch', `${MON[prev.getMonth()]} official receipts, booklet 14`],
    ['acr', 'Bank statements for the quarter'],
    ['sar', 'Receipts for new equipment'],
  ];
  const got = new Set<number>([1]);

  let view = 'dash', picked = CLIENTS[1], day = today.getDate();
  const main = h('div', { class: 'main' });
  const navs = ([['dash', 'Dashboard', I.grid], ['clients', 'Clients', I.users], ['cal', 'BIR calendar', I.cal], ['bill', 'Billing', I.receipt]] as const).map(([id, label, ic]) =>
    h('button', { 'data-v': id, onclick: () => { view = id; render(); } }, icon(ic, 16), label));

  root.append(
    h('div', { class: 'app', style: '--a:#a78bfa' },
      h('aside', { class: 'side' },
        h('div', { class: 'brand' }, h('span', { class: 'mono-logo' }, 'GB'), h('div', null, h('b', null, 'Garcia'), h('small', null, 'Bookkeeping Services'))),
        h('nav', { class: 'nav' }, navs),
        h('div', { class: 'side-foot' }, h('span', { class: 'dot' }), 'BIR rules updated')),
      main));

  function dash() {
    const open = all.filter((f) => status(f) !== 'filed');
    const week = open.filter((f) => days(f.due) >= 0 && days(f.due) <= 7).length;
    const late = open.filter((f) => status(f) === 'overdue').length;
    const done = all.filter((f) => status(f) === 'filed' && f.due.getMonth() === today.getMonth()).length;
    const rows = open.filter((f) => days(f.due) <= 21).slice(0, 9);
    return [
      h('div', { class: 'head' }, h('div', null, h('h2', null, 'Good day, Ms. Garcia'), h('p', null, `${today.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })} · ${CLIENTS.length} active clients`)),
        h('button', { class: 'btn primary', onclick: () => toast('New client form (demo)') }, icon(I.plus, 16), 'New client')),
      h('div', { class: 'tiles' },
        tile('Due in 7 days', week, 'returns to file'),
        tile('Overdue', late, late ? 'needs attention' : 'all clear', late ? 'bad' : ''),
        tile(`Filed in ${MON[today.getMonth()]}`, done, 'returns'),
        tile('Retainers this month', peso(CLIENTS.reduce((n, c) => n + c.fee, 0)), `${CLIENTS.length} clients`)),
      h('div', { class: 'cols' },
        h('section', { class: 'card grow' },
          h('h3', null, 'Upcoming BIR deadlines'),
          h('table', { class: 't' },
            h('thead', null, h('tr', null, h('th', null, 'Client'), h('th', null, 'Form'), h('th', null, 'Period'), h('th', null, 'Due'), h('th', null, 'Status'), h('th'))),
            h('tbody', null, rows.map((f) => h('tr', null,
              h('td', null, f.client.name),
              h('td', null, h('b', null, f.form), h('div', { class: 'muted sm' }, f.what)),
              h('td', { class: 'nw' }, f.period),
              h('td', { class: `nw${days(f.due) < 0 ? ' late' : ''}` }, fmt(f.due), h('div', { class: 'sm' }, when(f.due))),
              h('td', null, chip(status(f))),
              h('td', { class: 'right' }, action(f))))))),
        h('section', { class: 'card side-card' },
          h('h3', null, 'Documents to collect'),
          h('ul', { class: 'checks' }, docs.map(([id, text], i) => h('li', null,
            h('label', null,
              h('input', { type: 'checkbox', checked: got.has(i), onchange: () => { got.has(i) ? got.delete(i) : got.add(i); render(); } }),
              h('span', null, h('b', null, CLIENTS.find((c) => c.id === id)!.name), h('small', { class: got.has(i) ? 'done' : '' }, text)))))),
          h('button', { class: 'btn ghost full', onclick: () => toast('Reminders sent by SMS to 5 clients (demo)') }, icon(I.bell, 16), 'Remind clients'))),
    ];
  }

  function clients() {
    const c = picked;
    const mine = all.filter((f) => f.client === c);
    return [
      h('div', { class: 'head' }, h('div', null, h('h2', null, 'Clients'), h('p', null, 'Registration details and every return each client files.'))),
      h('div', { class: 'cols' },
        h('section', { class: 'card list-card' },
          h('ul', { class: 'pick' }, CLIENTS.map((x) => {
            const late = all.some((f) => f.client === x && status(f) === 'overdue');
            return h('li', null, h('button', { 'aria-current': x === c ? 'true' : null, onclick: () => { picked = x; render(); } },
              h('span', null, x.name, h('small', null, `${x.kind} · ${x.vat ? 'VAT' : 'Non-VAT'}`)), late ? h('span', { class: 'chip bad' }, 'Late') : null));
          }))),
        h('section', { class: 'card grow' },
          h('div', { class: 'detail-head' }, h('h3', null, c.name), h('span', { class: 'chip info' }, c.kind), h('span', { class: `chip ${c.vat ? 'ok' : 'mute'}` }, c.vat ? 'VAT registered' : 'Non-VAT')),
          h('dl', { class: 'facts' },
            fact('TIN', `•••-•••-${c.tin}-000`), fact('RDO', `${c.rdo} · ${c.rdo === '008' ? 'Baguio City' : 'La Trinidad, Benguet'}`),
            fact('Employees', c.staff || 'None'), fact('Contact', c.contact), fact('Monthly retainer', peso(c.fee)), fact('Withholding agent', c.agent ? 'Yes' : 'No')),
          h('h4', null, 'Returns this client files'),
          h('div', { class: 'chips' }, formsOf(c).map((f) => h('span', { class: 'chip mute', title: FORM_NAMES[f] }, f))),
          h('h4', null, 'Recent and upcoming'),
          h('table', { class: 't' },
            h('tbody', null, mine.slice(0, 7).map((f) => h('tr', null,
              h('td', null, h('b', null, f.form), h('div', { class: 'muted sm' }, f.what)), h('td', { class: 'nw' }, f.period),
              h('td', { class: 'nw' }, fmt(f.due)), h('td', null, chip(status(f))), h('td', { class: 'right' }, action(f)))))))),
    ];
  }

  function calendar() {
    const Y = today.getFullYear(), M = today.getMonth();
    const first = new Date(Y, M, 1).getDay(), n = lastDay(Y, M).getDate();
    const dueOn = (x: number) => all.filter((f) => f.due.getFullYear() === Y && f.due.getMonth() === M && f.due.getDate() === x);
    const cells: HTMLElement[] = [];
    for (let i = 0; i < first; i++) cells.push(h('div', { class: 'cal-cell empty' }));
    for (let x = 1; x <= n; x++) {
      const due = dueOn(x), forms = [...new Set(due.map((f) => f.form))];
      cells.push(h('button', { class: `cal-cell${x === day ? ' on' : ''}${x === today.getDate() ? ' today' : ''}`, onclick: () => { day = x; render(); } },
        h('span', { class: 'cal-n' }, x), forms.slice(0, 3).map((f) => h('span', { class: 'cal-f' }, f)), forms.length > 3 ? h('span', { class: 'muted sm' }, `+${forms.length - 3}`) : null));
    }
    const list = dueOn(day);
    return [
      h('div', { class: 'head' }, h('div', null, h('h2', null, `BIR calendar · ${today.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}`), h('p', null, 'Due dates for every client, worked out from their registrations.'))),
      h('div', { class: 'cols' },
        h('section', { class: 'card grow' },
          h('div', { class: 'cal' }, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => h('div', { class: 'cal-w' }, w)), cells)),
        h('section', { class: 'card side-card' },
          h('h3', null, `${MON[M]} ${day}`),
          list.length ? h('ul', { class: 'due-list' }, list.map((f) => h('li', null, h('div', null, h('b', null, f.form), ' ', f.client.name, h('small', null, `${f.what} · ${f.period}`)), chip(status(f)))))
            : h('p', { class: 'muted' }, 'Nothing due on this day.'))),
    ];
  }

  const paid = new Set(CLIENTS.filter((c) => hash(c.id) % 3 !== 0).map((c) => c.id));
  const lastPaid = new Set(CLIENTS.filter((c) => c.id !== 'sar').map((c) => c.id));
  function billing() {
    const out = CLIENTS.filter((c) => !paid.has(c.id));
    const late = CLIENTS.filter((c) => !lastPaid.has(c.id));
    return [
      h('div', { class: 'head' }, h('div', null, h('h2', null, 'Billing'), h('p', null, `Monthly retainers for ${MON[today.getMonth()]} ${today.getFullYear()}.`))),
      h('div', { class: 'tiles' },
        tile('Collected', peso(CLIENTS.filter((c) => paid.has(c.id)).reduce((n, c) => n + c.fee, 0)), `${paid.size} of ${CLIENTS.length} clients`),
        tile('Outstanding', peso(out.reduce((n, c) => n + c.fee, 0)), `${out.length} invoices`),
        tile('Past due', peso(late.reduce((n, c) => n + c.fee, 0)), late.length ? `from ${MON[prev.getMonth()]}` : 'none', late.length ? 'bad' : '')),
      h('section', { class: 'card' },
        h('table', { class: 't' },
          h('thead', null, h('tr', null, h('th', null, 'Invoice'), h('th', null, 'Client'), h('th', null, 'Amount'), h('th', null, 'Status'), h('th'))),
          h('tbody', null, CLIENTS.map((c, i) => {
            const pastDue = !lastPaid.has(c.id), ok = paid.has(c.id) && !pastDue;
            return h('tr', null,
              h('td', { class: 'muted' }, `GB-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}${String(i + 1).padStart(2, '0')}`),
              h('td', null, c.name), h('td', null, peso(pastDue ? c.fee * 2 : c.fee)),
              h('td', null, h('span', { class: `chip ${ok ? 'ok' : pastDue ? 'bad' : 'warn'}` }, ok ? 'Paid' : pastDue ? '2 months due' : 'Unpaid')),
              h('td', { class: 'right' }, ok ? null : h('span', { class: 'row-btns' },
                h('button', { class: 'btn sm ghost', onclick: () => toast(`Reminder sent to ${c.contact} (demo)`) }, 'Remind'),
                h('button', { class: 'btn sm', onclick: () => { paid.add(c.id); lastPaid.add(c.id); toast(`${c.name} paid`); render(); } }, 'Mark paid'))));
          })))),
    ];
  }

  function render() {
    for (const b of navs) b.toggleAttribute('aria-current', b.dataset.v === view);
    const top = main.scrollTop;
    fill(main, view === 'dash' ? dash() : view === 'clients' ? clients() : view === 'cal' ? calendar() : billing());
    main.scrollTop = top;
  }
  render();
}

const tile = (label: string, value: string | number, note: string, tone = '') =>
  h('div', { class: `tile ${tone}` }, h('span', null, label), h('b', null, value), h('small', null, note));
const fact = (k: string, v: string | number) => h('div', null, h('dt', null, k), h('dd', null, v));
