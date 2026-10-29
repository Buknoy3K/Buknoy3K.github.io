// Concept systems for local businesses: working front ends with sample data, nothing saved.
import { h, icon, fill, peso, toast, I } from '../ui';

const sideApp = (accent: string, logo: string, name: string, sub: string, nav: HTMLElement[], main: HTMLElement) =>
  h('div', { class: 'app', style: `--a:${accent}` },
    h('aside', { class: 'side' }, h('div', { class: 'brand' }, h('span', { class: 'mono-logo' }, logo), h('div', null, h('b', null, name), h('small', null, sub))), h('nav', { class: 'nav' }, nav)),
    main);
const navBtn = (label: string, ic: string | string[], on = false) => h('button', { 'aria-current': on ? 'true' : null, onclick: () => toast(`${label} (demo)`) }, icon(ic, 16), label);

/** Snack Stop POS: tap items, take cash, stock goes down. */
export function pos(root: HTMLElement) {
  const items = [
    ['Siomai (4 pcs)', 35, 24], ['Fishball (10 pcs)', 15, 40], ['Kikiam', 20, 18], ['Banana cue', 20, 6], ['Turon', 15, 9],
    ['Lumpiang shanghai', 30, 4], ['Pancit canton', 45, 12], ['Hotdog sandwich', 40, 10], ['Palamig', 20, 22], ['Iced coffee', 39, 15],
    ['Bottled water', 20, 30], ['Cheese stick (5 pcs)', 25, 3],
  ].map(([name, price, stock]) => ({ name: name as string, price: price as number, stock: stock as number }));
  const cart = new Map<number, number>();
  let cash = 0, sales = 0, total = 0;
  const main = h('div', { class: 'main pos' });
  root.append(sideApp('#e5b454', 'SS', 'Snack Stop', 'Counter 1', [navBtn('Checkout', I.cart, true), navBtn('Stock', I.grid), navBtn('Costing', I.ledger), navBtn('Reports', I.receipt)], main));

  function render() {
    const due = [...cart].reduce((n, [i, q]) => n + items[i].price * q, 0);
    fill(main,
      h('section', { class: 'pane' },
        h('div', { class: 'head' }, h('div', null, h('h2', null, 'Checkout'), h('p', null, `Today: ${peso(total)} from ${sales} sales`))),
        h('div', { class: 'tiles-grid' }, items.map((it, i) => h('button', {
          class: 'item', disabled: it.stock - (cart.get(i) ?? 0) <= 0,
          onclick: () => { cart.set(i, (cart.get(i) ?? 0) + 1); render(); },
        }, h('b', null, it.name), h('span', null, peso(it.price)),
          h('small', { class: it.stock <= 5 ? 'low' : '' }, it.stock <= 5 ? `Low: ${it.stock} left` : `${it.stock} in stock`))))),
      h('section', { class: 'pane cart' },
        h('h3', null, 'Order'),
        cart.size ? h('ul', { class: 'lines' }, [...cart].map(([i, q]) => h('li', null,
          h('span', null, items[i].name),
          h('span', { class: 'qty' },
            h('button', { 'aria-label': 'Less', onclick: () => { q > 1 ? cart.set(i, q - 1) : cart.delete(i); render(); } }, icon(I.minus, 14)), q,
            h('button', { 'aria-label': 'More', onclick: () => { if (q < items[i].stock) cart.set(i, q + 1); render(); } }, icon(I.plus, 14))),
          h('b', null, peso(items[i].price * q))))) : h('p', { class: 'muted' }, 'Tap an item to add it.'),
        h('div', { class: 'sum' }, h('span', null, 'Total'), h('b', null, peso(due))),
        h('div', { class: 'cash' }, [100, 200, 500, 1000].map((v) => h('button', { class: `btn sm${cash === v ? ' on' : ''}`, onclick: () => { cash = v; render(); } }, peso(v)))),
        h('div', { class: 'sum' }, h('span', null, 'Change'), h('b', null, cash >= due && due ? peso(cash - due) : '—')),
        h('button', {
          class: 'btn primary full', disabled: !due || cash < due,
          onclick: () => {
            for (const [i, q] of cart) items[i].stock -= q;
            total += due; sales++; cart.clear(); cash = 0;
            toast('Sale saved. Stock updated.');
            render();
          },
        }, 'Complete sale')));
  }
  render();
}

/** Laundry Kiosk: customers drop off on their own; staff move orders along the board. */
export function laundry(root: HTMLElement) {
  const services = [['Wash, dry & fold', 35], ['Wash & dry only', 28], ['Comforter / blanket', 180]] as const;
  const stages = ['Received', 'Washing', 'Drying', 'Ready'];
  const orders = [
    { no: 138, name: 'Kim', kg: 6, stage: 3 }, { no: 139, name: 'Rhea', kg: 8, stage: 2 },
    { no: 140, name: 'Jomar', kg: 5, stage: 1 }, { no: 141, name: 'Ate Linda', kg: 12, stage: 1 },
  ];
  let svc = 0, kg = 5, no = 142;
  const main = h('div', { class: 'main split' });
  root.append(h('div', { class: 'app single', style: '--a:#4fb8d6' }, main));

  function render() {
    const [label, rate] = services[svc];
    const price = svc === 2 ? rate : rate * kg;
    fill(main,
      h('section', { class: 'pane kiosk' },
        h('div', { class: 'kiosk-top' }, h('span', { class: 'mono-logo' }, 'SW'), h('b', null, 'Suds & Wash Self-Service')),
        h('h2', null, 'Drop off your laundry'),
        h('p', { class: 'muted' }, '1. Choose a service'),
        h('div', { class: 'opts' }, services.map(([l, r], i) => h('button', { class: `opt${i === svc ? ' on' : ''}`, onclick: () => { svc = i; render(); } },
          h('b', null, l), h('small', null, i === 2 ? `${peso(r)} per piece` : `${peso(r)} per kilo`)))),
        svc === 2 ? null : h('div', null,
          h('p', { class: 'muted' }, '2. Weight on the scale'),
          h('div', { class: 'stepper' },
            h('button', { 'aria-label': 'Less', onclick: () => { kg = Math.max(3, kg - 1); render(); } }, icon(I.minus)),
            h('b', null, `${kg} kg`),
            h('button', { 'aria-label': 'More', onclick: () => { kg = Math.min(20, kg + 1); render(); } }, icon(I.plus)))),
        h('div', { class: 'sum big' }, h('span', null, label), h('b', null, peso(price))),
        h('button', {
          class: 'btn primary full lg',
          onclick: () => {
            orders.push({ no, name: 'Walk-in', kg: svc === 2 ? 1 : kg, stage: 0 });
            toast(`Your order number is L-0${no}. We'll text you when it's ready.`);
            no++;
            render();
          },
        }, 'Confirm and get my number')),
      h('section', { class: 'pane' },
        h('div', { class: 'head' }, h('div', null, h('h2', null, 'Order board'), h('p', null, 'Customers get a text the moment an order is Ready.'))),
        h('div', { class: 'board' }, stages.map((s, si) => h('div', { class: 'lane' },
          h('h4', null, s, h('span', { class: 'muted' }, orders.filter((o) => o.stage === si).length)),
          orders.filter((o) => o.stage === si).map((o) => h('div', { class: 'ticket' },
            h('b', null, `L-0${o.no}`), h('small', null, `${o.name} · ${o.kg} kg`),
            si < 3 ? h('button', { class: 'btn sm', onclick: () => { o.stage++; if (o.stage === 3) toast(`Text sent to ${o.name}: L-0${o.no} is ready for pickup`); render(); } }, `To ${stages[si + 1]}`)
              : h('button', { class: 'btn sm ghost', onclick: () => { orders.splice(orders.indexOf(o), 1); render(); } }, 'Picked up'))))))));
  }
  render();
}

/** Resto: guests order from a table tablet; the kitchen screen gets the ticket with a running timer. */
export function resto(root: HTMLElement) {
  const menu = [
    ['Pinikpikan', 260], ['Etag fried rice', 180], ['Sinigang na baboy', 240], ['Chicken inasal', 195],
    ['Strawberry taho', 85], ['Ube champorado', 95], ['Benguet coffee', 70], ['Calamansi juice', 60],
  ] as const;
  const order = new Map<number, number>();
  let table = 4, ticketNo = 23;
  const tickets = [
    { no: 21, table: 2, items: ['2× Chicken inasal', '1× Calamansi juice'], at: Date.now() - 9 * 60e3 },
    { no: 22, table: 7, items: ['1× Pinikpikan', '3× Benguet coffee'], at: Date.now() - 3 * 60e3 },
  ];
  const main = h('div', { class: 'main split' });
  root.append(h('div', { class: 'app single', style: '--a:#f97362' }, main));
  const timer = setInterval(() => { if (!root.isConnected) clearInterval(timer); else kds(); }, 1000);
  const kdsBox = h('div', { class: 'board kds' });

  function kds() {
    fill(kdsBox, tickets.map((t) => {
      const m = Math.floor((Date.now() - t.at) / 60e3), s = Math.floor(((Date.now() - t.at) % 60e3) / 1e3);
      return h('div', { class: `ticket${m >= 8 ? ' slow' : ''}` },
        h('div', { class: 'ticket-top' }, h('b', null, `Table ${t.table}`), h('span', null, `${m}:${String(s).padStart(2, '0')}`)),
        h('small', { class: 'muted' }, `Order #${t.no}`),
        h('ul', null, t.items.map((x) => h('li', null, x))),
        h('button', { class: 'btn sm full', onclick: () => { tickets.splice(tickets.indexOf(t), 1); toast(`Table ${t.table}: order #${t.no} served`); kds(); } }, 'Done, bump'));
    }), tickets.length ? null : h('p', { class: 'muted' }, 'No open orders.'));
  }

  function render() {
    const due = [...order].reduce((n, [i, q]) => n + menu[i][1] * q, 0);
    fill(main,
      h('section', { class: 'pane' },
        h('div', { class: 'head' }, h('div', null, h('h2', null, 'Table tablet'), h('p', null, 'Guests order and pay from their table.')),
          h('label', { class: 'select' }, 'Table ', h('select', { onchange: (e: Event) => { table = Number((e.target as HTMLSelectElement).value); } },
            [1, 2, 3, 4, 5, 6, 7, 8].map((n) => h('option', { value: n, selected: n === table }, n))))),
        h('div', { class: 'tiles-grid two' }, menu.map(([name, price], i) => h('button', { class: 'item', onclick: () => { order.set(i, (order.get(i) ?? 0) + 1); render(); } },
          h('b', null, name), h('span', null, peso(price)), order.get(i) ? h('small', { class: 'count' }, `× ${order.get(i)}`) : h('small', null, 'Tap to add')))),
        h('div', { class: 'sum' }, h('span', null, `${[...order.values()].reduce((a, b) => a + b, 0)} items`), h('b', null, peso(due))),
        h('button', {
          class: 'btn primary full', disabled: !due,
          onclick: () => {
            tickets.push({ no: ticketNo++, table, items: [...order].map(([i, q]) => `${q}× ${menu[i][0]}`), at: Date.now() });
            order.clear(); toast('Sent to the kitchen'); render();
          },
        }, 'Send to kitchen')),
      h('section', { class: 'pane dark' }, h('div', { class: 'head' }, h('div', null, h('h2', null, 'Kitchen display'), h('p', null, 'Tickets turn red after 8 minutes.'))), kdsBox));
    kds();
  }
  render();
}

/** Car rental: a Messenger bot answers, checks the calendar and books, any hour. */
export function rental(root: HTMLElement) {
  const cars = ['Vios 2023 · ₱2,200/day', 'Innova 2022 · ₱3,500/day', 'Hiace 2021 · ₱5,000/day'];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const dayNames = Array.from({ length: 7 }, (_, i) => new Date(start.getTime() + i * 864e5).toLocaleDateString('en-PH', { weekday: 'short', day: 'numeric' }));
  const booked: [number, number][] = [[0, 0], [0, 1], [1, 3], [1, 4], [1, 5], [2, 1], [2, 2]];
  const mine: [number, number][] = [];
  const msgs: { me: boolean; text: string }[] = [{ me: false, text: 'Hi! I’m the Pine Ridge Car Rental assistant. What can I help you with?' }];
  let replies = ['See our cars', 'Is the Innova free this weekend?', 'Book a car'];
  let typing = false;
  const main = h('div', { class: 'main split' });
  root.append(h('div', { class: 'app single', style: '--a:#5b8cff' }, main));

  const SCRIPT: Record<string, [string, string[]]> = {
    'See our cars': ['We have a Vios (₱2,200/day), an Innova (₱3,500/day) and a Hiace van (₱5,000/day). Driver available for ₱1,000/day.', ['Is the Innova free this weekend?', 'Book a car']],
    'Is the Innova free this weekend?': ['Let me check… The Innova is free on the days shown in green on our calendar. Want me to hold it?', ['Book a car', 'See our cars']],
    'Book a car': ['Which car would you like?', ['Vios', 'Innova', 'Hiace']],
    Vios: ['', []], Innova: ['', []], Hiace: ['', []],
  };
  function say(text: string) {
    msgs.push({ me: true, text });
    replies = [];
    typing = true;
    render();
    setTimeout(() => {
      typing = false;
      const car = ['Vios', 'Innova', 'Hiace'].indexOf(text);
      if (car >= 0) {
        const free = [0, 1, 2, 3, 4, 5, 6].find((d) => !booked.some(([c, x]) => c === car && x === d) && !mine.some(([c, x]) => c === car && x === d));
        if (free == null) msgs.push({ me: false, text: `Sorry, the ${text} is fully booked this week.` });
        else {
          mine.push([car, free]);
          msgs.push({ me: false, text: `Done! The ${text} is booked for ${dayNames[free]}. Please send the ₱1,000 deposit by GCash to confirm. See you!` });
        }
        replies = ['See our cars', 'Book a car'];
      } else {
        const [answer, next] = SCRIPT[text];
        msgs.push({ me: false, text: answer });
        replies = next;
      }
      render();
    }, 700);
  }

  function render() {
    fill(main,
      h('section', { class: 'pane chat' },
        h('div', { class: 'chat-top' }, h('span', { class: 'mono-logo' }, 'PR'), h('div', null, h('b', null, 'Pine Ridge Car Rental'), h('small', null, 'Replies instantly'))),
        h('div', { class: 'msgs' }, msgs.map((m) => h('div', { class: `msg${m.me ? ' me' : ''}` }, m.text)), typing ? h('div', { class: 'msg typing' }, '• • •') : null),
        h('div', { class: 'quick' }, replies.map((r) => h('button', { class: 'btn sm ghost', onclick: () => say(r) }, r)))),
      h('section', { class: 'pane' },
        h('div', { class: 'head' }, h('div', null, h('h2', null, 'Fleet calendar'), h('p', null, 'The bot books straight into this calendar.'))),
        h('div', { class: 'fleet', style: 'grid-template-columns: 170px repeat(7, 1fr)' },
          h('div'), dayNames.map((n) => h('div', { class: 'fleet-d' }, n)),
          cars.flatMap((c, ci) => [h('div', { class: 'fleet-c' }, c), ...dayNames.map((_, di) => {
            const mineHere = mine.some(([a, b]) => a === ci && b === di), taken = booked.some(([a, b]) => a === ci && b === di);
            return h('div', { class: `slot${taken ? ' taken' : ''}${mineHere ? ' new' : ''}` }, mineHere ? 'New' : taken ? 'Booked' : 'Free');
          })]))));
    const box = main.querySelector('.msgs');
    if (box) box.scrollTop = box.scrollHeight;
  }
  render();
}

/** Boarding house: rooms, who has paid this month, and the electric bill split by submeter. */
export function boarding(root: HTMLElement) {
  const names = ['Aira', 'Bea', 'Cholo', 'Dan', 'Ella', 'Franz', 'Gwen', 'Hans', 'Ivy', 'Jules', 'Kat', 'Leo'];
  const rooms = names.map((n, i) => ({ room: `${Math.floor(i / 4) + 1}0${(i % 4) + 1}`, name: n, rent: i % 4 === 0 ? 3500 : 2800, kwh: 18 + ((i * 7) % 23), paid: i % 3 !== 1, late: i === 4 || i === 10 }));
  const rate = 13.2; // ₱ per kWh, sample
  const main = h('div', { class: 'main' });
  root.append(sideApp('#f472b6', 'CB', 'Casa Benguet', 'Boarding house', [navBtn('This month', I.home, true), navBtn('Tenants', I.users), navBtn('Meter readings', I.bolt), navBtn('Payments', I.receipt)], main));
  const month = new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });

  function render() {
    const due = (r: (typeof rooms)[number]) => r.rent + Math.round(r.kwh * rate);
    const got = rooms.filter((r) => r.paid).reduce((n, r) => n + due(r), 0), all = rooms.reduce((n, r) => n + due(r), 0);
    fill(main,
      h('div', { class: 'head' }, h('div', null, h('h2', null, month), h('p', null, `Electric at ${peso(rate, true)} per kWh, read from each room’s submeter.`)),
        h('button', { class: 'btn ghost', onclick: () => toast('Reminders sent by SMS to tenants with balances (demo)') }, icon(I.bell, 16), 'Remind unpaid')),
      h('div', { class: 'tiles' },
        h('div', { class: 'tile' }, h('span', null, 'Collected'), h('b', null, peso(got)), h('small', null, `of ${peso(all)}`)),
        h('div', { class: 'tile' }, h('span', null, 'Paid'), h('b', null, `${rooms.filter((r) => r.paid).length} / ${rooms.length}`), h('small', null, 'tenants')),
        h('div', { class: 'tile bad' }, h('span', null, 'Late'), h('b', null, rooms.filter((r) => !r.paid && r.late).length), h('small', null, 'past the 5th'))),
      h('div', { class: 'rooms' }, rooms.map((r) => h('div', { class: `room${r.paid ? ' paid' : r.late ? ' late' : ''}` },
        h('div', { class: 'ticket-top' }, h('b', null, `Room ${r.room}`), h('span', { class: `chip ${r.paid ? 'ok' : r.late ? 'bad' : 'warn'}` }, r.paid ? 'Paid' : r.late ? 'Late' : 'Due')),
        h('span', null, r.name),
        h('small', { class: 'muted' }, `Rent ${peso(r.rent)} + ${r.kwh} kWh ${peso(Math.round(r.kwh * rate))}`),
        h('div', { class: 'ticket-top' }, h('b', null, peso(due(r))),
          r.paid ? h('span', { class: 'muted sm' }, 'Receipt sent') : h('button', { class: 'btn sm', onclick: () => { r.paid = true; toast(`${r.name} paid ${peso(due(r))}. Receipt sent.`); render(); } }, 'Record payment'))))));
  }
  render();
}

/** Trading post: today's price board and farmers' deliveries, with the payout after commission. */
export function veggie(root: HTMLElement) {
  const crops = [['Cabbage', 38, 4], ['Carrots', 72, -6], ['Potatoes', 65, 2], ['Lettuce (iceberg)', 120, 15], ['Broccoli', 140, -10], ['Chayote', 18, 0], ['Baguio beans', 85, 8], ['Strawberries', 280, -20]] as const;
  const fee = 0.08; // commission, sample
  const rows = [
    { farmer: 'Mang Pedring', crop: 0, kg: 420 }, { farmer: 'Aling Rosa', crop: 1, kg: 180 },
    { farmer: 'Kiko Bayang', crop: 3, kg: 95 }, { farmer: 'Mang Ambo', crop: 2, kg: 310 },
  ];
  let crop = 6, kg = 120;
  const main = h('div', { class: 'main' });
  root.append(sideApp('#84cc16', 'TP', 'Highland Trading', 'Stall 42, La Trinidad', [navBtn('Today', I.leaf, true), navBtn('Farmers', I.users), navBtn('Buyers', I.cart), navBtn('Payouts', I.receipt)], main));

  function render() {
    const gross = (r: { crop: number; kg: number }) => crops[r.crop][1] * r.kg;
    fill(main,
      h('div', { class: 'head' }, h('div', null, h('h2', null, 'Price board'), h('p', null, `Per kilo, ${new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric' })}, 5:00 am. Sample prices.`))),
      h('div', { class: 'prices' }, crops.map(([n, p, ch]) => h('div', { class: 'price' }, h('span', null, n), h('b', null, peso(p)),
        h('small', { class: ch > 0 ? 'up' : ch < 0 ? 'down' : 'muted' }, ch > 0 ? `▲ ${ch}` : ch < 0 ? `▼ ${-ch}` : 'no change')))),
      h('div', { class: 'cols' },
        h('section', { class: 'card grow' },
          h('h3', null, 'Deliveries today'),
          h('table', { class: 't' },
            h('thead', null, h('tr', null, h('th', null, 'Farmer'), h('th', null, 'Crop'), h('th', null, 'Kilos'), h('th', null, 'Gross'), h('th', null, `Fee ${fee * 100}%`), h('th', null, 'Payout'))),
            h('tbody', null, rows.map((r) => h('tr', null, h('td', null, r.farmer), h('td', null, crops[r.crop][0]), h('td', null, r.kg),
              h('td', null, peso(gross(r))), h('td', { class: 'muted' }, peso(Math.round(gross(r) * fee))), h('td', null, h('b', null, peso(Math.round(gross(r) * (1 - fee)))))))))),
        h('section', { class: 'card side-card' },
          h('h3', null, 'New delivery'),
          h('label', { class: 'field' }, 'Crop', h('select', { onchange: (e: Event) => { crop = Number((e.target as HTMLSelectElement).value); render(); } },
            crops.map(([n], i) => h('option', { value: i, selected: i === crop }, n)))),
          h('label', { class: 'field' }, 'Kilos on the scale', h('input', { type: 'number', min: 1, value: kg, onchange: (e: Event) => { kg = Math.max(1, Number((e.target as HTMLInputElement).value) || 1); render(); } })),
          h('div', { class: 'sum' }, h('span', null, 'Farmer gets'), h('b', null, peso(Math.round(crops[crop][1] * kg * (1 - fee))))),
          h('button', { class: 'btn primary full', onclick: () => { rows.unshift({ farmer: 'Walk-in farmer', crop, kg }); toast('Delivery logged. Payout slip printed.'); render(); } }, 'Log delivery'))));
  }
  render();
}
