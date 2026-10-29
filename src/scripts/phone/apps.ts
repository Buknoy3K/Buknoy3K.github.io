// The phone in the campfire scene: a home screen with four apps. Two are working demos of real projects (the laundry
// kiosk's customer side and the car rental Messenger bot); two are ideas, marked as such. Sample data, nothing saved.
import { h, icon, fill, peso, toast, I } from '../tablet/ui';

const chat = ['M4 5h16v11H9l-5 4z', 'M8 9h8M8 12h5'];
const cloud = 'M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 11 3.5 3.5 0 0 0 7 18z';
const search = ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'm20 20-4-4'];

type App = { id: string; name: string; sub: string; color: string; ic: string | string[]; idea?: boolean; run: (root: HTMLElement) => void };
const apps: App[] = [
  { id: 'laundry', name: 'Suds & Wash', sub: 'Drop off and track your laundry', color: '#2f97b6', ic: I.shirt, run: laundry },
  { id: 'rental', name: 'Car Rental', sub: 'Book a unit on Messenger', color: '#0a7cff', ic: chat, run: rental },
  { id: 'pila', name: 'Pila', sub: 'Your place in line, from anywhere', color: '#e3a42b', ic: I.users, idea: true, run: pila },
  { id: 'presyo', name: 'Presyo', sub: 'Trading post prices, every morning', color: '#1b4430', ic: I.leaf, idea: true, run: presyo },
];
const byId = (id: string) => apps.find((a) => a.id === id)!;

// The notification list on the home screen: the latest from each app
const notes = [
  { app: 'laundry', title: 'L-0139 is now drying', text: 'About 40 minutes to go. We’ll text you when it’s ready.', ago: '2m' },
  { app: 'rental', title: 'Booking request received', text: 'Innova · Sat, Oct 31, 8:00 AM · waiting for the owner', ago: '14m' },
  { app: 'presyo', title: 'Cabbage is up ₱4 this morning', text: '₱38 a kilo at the La Trinidad trading post', ago: '1h' },
];
const flame =
  '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2.5 1.4-4 2.6-5.2.3 1.6 1 2.6 2.2 3.2C11 8.6 11 5 12 2z" fill="#c0222f"/><path d="M12 12c.6 1.6 2.2 2.4 2.2 4.4a2.2 2.2 0 0 1-4.4 0c0-1.2.6-1.9 1.2-2.5.1.6.4 1 .9 1.3-.2-1.1-.2-2.1.1-3.2z" fill="#e3a42b"/></svg>';

export function mountPhone(root: HTMLElement) {
  const time = h('b', { class: 'time' });
  const tick = () => (time.textContent = new Date().toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/i, ''));
  tick();
  setInterval(tick, 10_000);
  const status = h('div', { class: 'status' }, time, h('span', { class: 'sys' }, signal(), battery()));
  const screen = h('div', { class: 'screen' });
  root.append(status, screen, h('div', { class: 'home-bar', onclick: () => home() }));

  function home() {
    root.classList.remove('in-app');
    const now = new Date(), hr = now.getHours();
    const mark = h('span', { class: 'flame' });
    mark.innerHTML = flame;
    fill(screen,
      h('div', { class: 'home' },
        h('header', { class: 'greet' },
          h('small', null, now.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })),
          h('h1', null, hr < 12 ? 'Magandang umaga' : hr < 18 ? 'Magandang hapon' : 'Magandang gabi')),

        h('div', { class: 'widgets' },
          h('div', { class: 'w weather' },
            h('div', { class: 'w-top' }, icon(cloud, 26), h('b', null, '18°')),
            h('div', { class: 'w-txt' }, h('b', null, 'La Trinidad'), h('small', null, 'Fog clearing by noon')),
            h('div', { class: 'hours' }, [['9AM', 16], ['12PM', 19], ['3PM', 18], ['6PM', 15]].map(([t, d]) => h('span', null, h('small', null, t), `${d}°`)))),
          h('div', { class: 'w brand' },
            mark,
            h('div', { class: 'w-txt' }, h('b', null, 'Saleng Labs'), h('small', null, 'Systems for local businesses')),
            h('div', { class: 'chips' }, h('span', null, '2 demos'), h('span', null, '2 ideas')))),

        h('section', null,
          h('h2', null, 'Apps'),
          h('div', { class: 'grid' }, apps.map((a) => h('button', { class: 'icon', onclick: () => open(a) },
            h('span', { class: 'tile', style: `--c:${a.color}` }, icon(a.ic, 28), a.idea ? h('i', { class: 'badge' }, 'Idea') : null),
            h('span', { class: 'name' }, a.name))))),

        h('section', null,
          h('h2', null, 'Notifications', h('small', null, `${notes.length} new`)),
          h('div', { class: 'notes' }, notes.map((n) => {
            const a = byId(n.app);
            return h('button', { class: 'n', onclick: () => open(a) },
              h('span', { class: 'n-ic', style: `--c:${a.color}` }, icon(a.ic, 16)),
              h('span', { class: 'n-txt' },
                h('span', { class: 'n-row' }, h('small', null, a.name), h('small', null, n.ago)),
                h('b', null, n.title),
                h('small', null, n.text)));
          }))),

        h('div', { class: 'dock' },
          h('button', { class: 'search', onclick: () => toast('Search is just for show. Tap an app to try it.') }, icon(search, 16), 'Search'),
          h('div', { class: 'dots' }, h('i', { class: 'on' }), h('i')))));
  }

  function open(a: App) {
    // The status bar takes the app's colour, so it runs into the app's header
    root.classList.add('in-app');
    root.style.setProperty('--top', a.color);
    const body = h('div', { class: 'app-body' });
    fill(screen,
      h('div', { class: 'app', style: `--a:${a.color}` },
        h('header', { class: 'app-top' },
          h('div', { class: 'app-bar' },
            h('button', { class: 'back', onclick: home, 'aria-label': 'Home' }, '‹'),
            h('span', { class: 'pill' }, a.idea ? 'Idea' : 'Demo')),
          h('div', { class: 'app-title' },
            h('span', { class: 'app-ic' }, icon(a.ic, 22)),
            h('div', null, h('b', null, a.name), h('small', null, a.sub)))),
        a.idea ? h('p', { class: 'idea-note' }, h('b', null, 'Idea'), 'Not built yet. This is how it could work.') : null,
        body));
    a.run(body);
  }

  home();
}

const signal = () => h('span', { class: 'bars' }, [1, 2, 3, 4].map((n) => h('i', { style: `height:${n * 2 + 2}px` })));
const battery = () => h('span', { class: 'batt' }, h('i'));

/** Suds & Wash: the customer's side of the laundry kiosk. Drop off, then follow the order until it's ready. */
function laundry(root: HTMLElement) {
  const services = [['Wash, dry & fold', 35], ['Wash & dry only', 28]] as const;
  const stages = ['Received', 'Washing', 'Drying', 'Ready'];
  const order = { no: 139, kg: 8, svc: 0, stage: 1 };
  let svc = 0, kg = 5;

  function render() {
    const [label, rate] = services[order.svc];
    fill(root,
      h('section', { class: 'card' },
        h('div', { class: 'row' }, h('small', { class: 'muted' }, 'Your order'), h('b', { class: 'mono' }, `L-0${order.no}`)),
        h('p', { class: 'muted' }, `${label} · ${order.kg} kg · ${peso(rate * order.kg)}`),
        h('ol', { class: 'track' }, stages.map((s, i) => h('li', { class: i < order.stage ? 'done' : i === order.stage ? 'now' : '' }, h('i'), s))),
        order.stage < 3
          ? h('button', { class: 'btn ghost', onclick: () => { order.stage++; if (order.stage === 3) toast(`Suds & Wash: L-0${order.no} is ready for pickup`); render(); } }, 'Move it along (demo)')
          : h('p', { class: 'ok' }, 'Ready for pickup. Show this number at the counter.')),
      h('section', { class: 'card' },
        h('b', null, 'New drop-off'),
        h('div', { class: 'opts' }, services.map(([l, r], i) => h('button', { class: `opt${i === svc ? ' on' : ''}`, onclick: () => { svc = i; render(); } },
          h('span', null, l), h('small', null, `${peso(r)}/kg`)))),
        h('div', { class: 'stepper' },
          h('button', { 'aria-label': 'Less', onclick: () => { kg = Math.max(3, kg - 1); render(); } }, icon(I.minus)),
          h('b', null, `${kg} kg`),
          h('button', { 'aria-label': 'More', onclick: () => { kg = Math.min(20, kg + 1); render(); } }, icon(I.plus))),
        h('div', { class: 'row total' }, h('span', null, 'Estimate'), h('b', null, peso(services[svc][1] * kg))),
        h('button', {
          class: 'btn', onclick: () => {
            Object.assign(order, { no: order.no + 3, kg, svc, stage: 0 });
            toast(`Your number is L-0${order.no}. We'll text you when it's ready.`);
            root.parentElement?.scrollTo({ top: 0, behavior: 'smooth' });
            render();
          },
        }, 'Get my number')));
  }
  render();
}

/** Car rental Messenger bot: a scripted run of the real bot's flow (units, availability, quote, pending booking). */
function rental(root: HTMLElement) {
  const steps: { ask: string; reply: string[] }[] = [
    { ask: 'Anong units meron kayo?', reply: ['Meron po kaming 2 unit:\n- Toyota Innova 2022, 7 seats, automatic\n- Toyota Hiace 2021, 15 seats, manual', '₱2,500 po bawat 24 oras. Gusto n’yo po bang makita ang mga larawan? 🚗'] },
    { ask: 'Available ba ang Innova sa Sabado?', reply: ['Anong oras po ang pickup at anong oras ang balik?'] },
    { ask: 'Sabado 8am, balik Lunes 8am', reply: ['Available po ang Innova mula Sat, Oct 31, 8:00 AM hanggang Mon, Nov 2, 8:00 AM ✅', '2 araw × ₱2,500 = ₱5,000. Self-drive po ba o may driver?'] },
    { ask: 'Self-drive po', reply: ['Noted po! Naitala ko na ang booking request ninyo bilang PENDING.', 'Kakausapin po kayo ng may-ari tungkol sa deposit at pickup. Salamat po! 🙏'] },
  ];
  let step = 0;
  const log = h('div', { class: 'chat' });
  const replies = h('div', { class: 'quick' });
  root.append(h('p', { class: 'sys-note' }, 'Benguet Car Rental · usually replies instantly'), log, replies);

  const say = (text: string, me = false) => {
    log.append(h('p', { class: `msg${me ? ' me' : ''}` }, text));
    log.scrollTop = log.scrollHeight;
  };
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  async function answer(lines: string[]) {
    replies.replaceChildren();
    for (const line of lines) {
      const dots = h('p', { class: 'msg typing' }, h('i'), h('i'), h('i'));
      log.append(dots);
      log.scrollTop = log.scrollHeight;
      await wait(700 + line.length * 6);
      dots.remove();
      say(line);
    }
    if (step === steps.length) {
      log.append(h('p', { class: 'sys-note' }, 'Owner notified · booking saved as pending'));
      log.scrollTop = log.scrollHeight;
    }
    offer();
  }
  function offer() {
    fill(replies, step < steps.length
      ? h('button', { onclick: () => { const s = steps[step++]; say(s.ask, true); answer(s.reply); } }, steps[step].ask)
      : h('button', { onclick: () => { step = 0; log.replaceChildren(); answer(['Magandang araw po! Ako po ang assistant ng Benguet Car Rental. Paano ko po kayo matutulungan?']); } }, 'Start over'));
  }
  answer(['Magandang araw po! Ako po ang assistant ng Benguet Car Rental. Paano ko po kayo matutulungan?']);
}

/** Idea: take a queue number for the clinic, registrar or barangay hall from your phone, and get told when to go. */
function pila(root: HTMLElement) {
  let mine = 0, serving = 19;
  const offices = ['Municipal Health Office', 'BSU Registrar', 'Barangay Hall, Poblacion'];
  let office = 0;
  function render() {
    const ahead = mine ? Math.max(0, mine - serving) : 0;
    fill(root,
      h('section', { class: 'card' },
        h('small', { class: 'muted' }, 'Where'),
        h('div', { class: 'opts' }, offices.map((o, i) => h('button', { class: `opt${i === office ? ' on' : ''}`, disabled: !!mine, onclick: () => { office = i; render(); } }, h('span', null, o))))),
      h('section', { class: 'card center' },
        h('small', { class: 'muted' }, 'Now serving'),
        h('b', { class: 'big mono' }, `A-0${serving}`),
        mine
          ? h('div', { class: 'stack' },
              h('small', { class: 'muted' }, 'Your number'),
              h('b', { class: 'big mono accent' }, `A-0${mine}`),
              h('p', null, ahead ? `${ahead} ahead of you · about ${ahead * 4} min` : 'It’s your turn. Go to window 2.'),
              ahead ? h('button', { class: 'btn ghost', onclick: () => { serving++; if (mine - serving === 2) toast('Pila: 2 more ahead of you. Time to head over.'); render(); } }, 'Next number (demo)') : null)
          : h('button', { class: 'btn', onclick: () => { mine = serving + 5; render(); } }, 'Get a number')),
      h('p', { class: 'muted small' }, 'Wait at home or at work instead of on the bench. A text comes when two people are left ahead of you.'));
  }
  render();
}

/** Idea: today's vegetable prices at the La Trinidad trading post, with a text when a price crosses your mark. */
function presyo(root: HTMLElement) {
  const veg = [['Cabbage', 38, 34], ['Carrots', 62, 66], ['Potatoes', 55, 55], ['Lettuce', 90, 78], ['Broccoli', 120, 128], ['Sayote', 18, 20]] as const;
  const watched = new Set<number>();
  function render() {
    fill(root,
      h('p', { class: 'muted small' }, 'La Trinidad Trading Post · per kilo · this morning'),
      h('ul', { class: 'prices' }, veg.map(([name, now, before], i) => {
        const d = now - before;
        return h('li', null,
          h('span', null, name),
          h('b', null, peso(now)),
          h('small', { class: d > 0 ? 'up' : d < 0 ? 'down' : 'muted' }, d ? `${d > 0 ? '▲' : '▼'} ${Math.abs(d)}` : '—'),
          h('button', {
            class: `watch${watched.has(i) ? ' on' : ''}`, 'aria-label': `Watch ${name}`,
            onclick: () => { watched.has(i) ? watched.delete(i) : (watched.add(i), toast(`We'll text you when ${name.toLowerCase()} moves past ${peso(now + 5)}.`)); render(); },
          }, icon(I.bell, 16)));
      })),
      h('p', { class: 'muted small' }, 'Farmers and buyers see the price before the trip down, not after.'));
  }
  render();
}
