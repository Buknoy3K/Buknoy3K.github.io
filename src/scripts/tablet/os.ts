// The tablet's desktop: a menu bar, Work and Contact icons, a dock, and windows. The Work window lists every project
// as a simple poster (its logo on its brand colour); opening one shows that front page (the business's website), and its login
// or order button opens the working system. DOC GEN is the real app's pages (public/demos/docgen), whose home page is
// its front page.
import { h, icon, fill, toast, I } from './ui';
import { frontPage, SITES } from './fronts';
import { garcia } from './demos/garcia';
import { pos, laundry, resto, rental, boarding, veggie } from './demos/props';

type Project = {
  id: string; name: string; kind: string; tag?: string; color: string; ic: string | string[];
  run?: (root: HTMLElement) => void; src?: string; // a built-in system with a front page, or a page of its own
  poster: [bg: string, fg: string, serif?: boolean]; // the Work card: brand colour, logo colour, serif name
};

const PROJECTS: Project[] = [
  { id: 'garcia', name: 'Garcia Bookkeeping', kind: 'Website + BIR compliance tracker', color: '#8b5cf6', ic: I.ledger, run: garcia, poster: ['#ede7fb', '#5b21b6', true] },
  { id: 'docgen', name: 'DOC GEN', kind: 'Registrar document system, in use', color: '#1f9d6a', ic: I.doc, src: '/demos/docgen/index.html', poster: ['#0b1120', '#4ade80'] },
  { id: 'pos', name: 'Snack Stop', kind: 'Website + POS with live stock', tag: 'In development', color: '#c9932a', ic: I.cart, run: pos, poster: ['#f6c453', '#3a2500'] },
  { id: 'laundry', name: 'Suds & Wash', kind: 'Website + self-service laundry kiosk', tag: 'In development', color: '#2f97b6', ic: I.shirt, run: laundry, poster: ['#dcf0f8', '#1f8db3'] },
  { id: 'resto', name: 'Kusina Highland', kind: 'Website + table ordering and kitchen screen', tag: 'Concept', color: '#e0583f', ic: I.bowl, run: resto, poster: ['#2a1a16', '#f97362', true] },
  { id: 'rental', name: 'Pine Ridge Car Rental', kind: 'Website + Messenger booking bot', tag: 'Concept', color: '#3d6fe0', ic: I.car, run: rental, poster: ['#2f6bff', '#ffffff'] },
  { id: 'boarding', name: 'Casa Benguet', kind: 'Website + rent and electric billing', tag: 'Concept', color: '#d4569c', ic: I.home, run: boarding, poster: ['#fbe3ee', '#b5306f', true] },
  { id: 'veggie', name: 'Highland Trading', kind: 'Website + price board and farmer payouts', tag: 'Concept', color: '#5f9a14', ic: I.leaf, run: veggie, poster: ['#1d2a12', '#a3e635'] },
];


export function mountDesktop(desk: HTMLElement, owner: { name: string; role: string; initials: string; email: string; location: string }) {
  const wins = new Map<string, HTMLElement>();
  let z = 10;
  const dock = h('nav', { class: 'dock', 'aria-label': 'Dock' });

  function open(id: string, title: string, size: string, body: () => HTMLElement) {
    let w = wins.get(id);
    if (!w) {
      const close = () => { w!.remove(); wins.delete(id); syncDock(); };
      w = h('section', { class: `win ${size}`, role: 'dialog', 'aria-label': title },
        h('header', { class: 'bar' },
          h('div', { class: 'lights' }, h('button', { class: 'l-close', 'aria-label': `Close ${title}`, onclick: close }), h('span'), h('span')),
          h('span', { class: 'bar-title' }, title)),
        body());
      w.addEventListener('pointerdown', () => raise(w!));
      drag(w);
      wins.set(id, w);
      desk.append(w);
    }
    raise(w);
    syncDock();
  }
  const raise = (w: HTMLElement) => { w.style.zIndex = String(++z); };

  // Drag a window by its title bar, kept on the desktop
  function drag(w: HTMLElement) {
    const bar = w.querySelector<HTMLElement>('.bar')!;
    bar.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('button')) return;
      const r = w.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
      bar.setPointerCapture(e.pointerId);
      const move = (m: PointerEvent) => {
        w.style.left = `${Math.min(Math.max(m.clientX - dx, -r.width + 120), innerWidth - 120)}px`;
        w.style.top = `${Math.min(Math.max(m.clientY - dy, 28), innerHeight - 90)}px`;
        w.style.transform = 'none';
      };
      bar.addEventListener('pointermove', move);
      bar.addEventListener('pointerup', () => bar.removeEventListener('pointermove', move), { once: true });
    });
  }

  // A project's page for its window: the real app's own page, or the front page leading to the system
  const page = (p: Project, root: HTMLElement, openApp: () => void) => {
    if (p.src) fill(root, h('iframe', { class: 'demo-frame', src: p.src, title: p.name }));
    else fill(root, frontPage(SITES[p.id], p.run!, openApp));
  };

  const openProject = (p: Project) =>
    open(p.id, p.name, 'big', () => {
      const view = h('div', { class: 'win-body' });
      const back = h('button', { class: 'note-back', hidden: true, onclick: () => showFront() }, '← Website');
      const showApp = () => {
        view.className = 'win-body demo';
        fill(view);
        p.run!(view);
        back.hidden = false;
      };
      const showFront = () => {
        view.className = 'win-body front';
        page(p, view, showApp);
        back.hidden = true;
      };
      showFront();
      return h('div', { class: 'win-fill' },
        h('div', { class: 'demo-note' }, h('span', { class: 'note-left' }, back, p.kind), h('span', { class: 'chip mute' }, 'Working demo · sample data')),
        view);
    });

  const openWork = () =>
    open('work', 'Work', 'work', () => {
      const cards = PROJECTS.map((p) => {
        const [bg, fg, serif] = p.poster;
        return h('button', { class: 'card-p', onclick: () => openProject(p) },
          h('div', { class: `thumb poster${serif ? ' serif' : ''}`, style: `--pb:${bg};--pf:${fg}` },
            h('span', { class: 'poster-mark' }, icon(p.ic, 30)), h('span', { class: 'poster-name' }, p.name),
            p.tag ? h('span', { class: 'tag' }, p.tag) : null),
          h('b', null, p.name), h('small', null, p.kind));
      });
      const body = h('div', { class: 'win-body work-body' },
        h('h1', null, 'Systems for real businesses.'),
        h('p', { class: 'lede' }, 'Open one to see the business’s site and try the system behind it. Names and numbers are sample data.'),
        h('div', { class: 'grid' }, cards));
      return body;
    });

  const openContact = () =>
    open('contact', 'Contact', 'small', () => {
      const form = h('form', { class: 'contact-form' },
        h('label', { class: 'field' }, 'Your name', h('input', { name: 'n', required: true, autocomplete: 'name' })),
        h('label', { class: 'field' }, 'Business', h('input', { name: 'b', placeholder: 'e.g. a laundry shop in La Trinidad' })),
        h('label', { class: 'field' }, 'What takes your team the most time?', h('textarea', { name: 'm', rows: 3, required: true })),
        h('button', { class: 'btn primary full', type: 'submit' }, icon(I.send, 16), 'Send'));
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        form.reset();
        toast('Thanks! Messages aren’t connected yet, so please email instead.');
      });
      return h('div', { class: 'win-body contact' },
        h('div', { class: 'me' }, h('span', { class: 'avatar' }, owner.initials), h('div', null, h('b', null, owner.name), h('small', null, owner.role))),
        h('ul', { class: 'facts-list' },
          h('li', null, icon(I.mail, 16), owner.email),
          h('li', null, icon(I.pin, 16), owner.location)),
        form);
    });

  // Menu bar, desktop icons and dock
  const clock = h('span', { class: 'clock' });
  const tick = () => {
    clock.textContent = `La Trinidad ${new Date().toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' }).toLowerCase()}`;
  };
  tick();
  setInterval(tick, 15e3);
  desk.append(
    h('header', { class: 'menubar' },
      h('b', null, owner.name),
      h('button', { onclick: openWork }, 'Work'),
      h('button', { onclick: openContact }, 'Contact'),
      clock),
    h('div', { class: 'icons' },
      h('button', { class: 'd-icon', onclick: openWork }, h('span', null, icon(I.folder, 26)), 'Work'),
      h('button', { class: 'd-icon', onclick: openContact }, h('span', null, icon(I.mail, 26)), 'Contact')),
    dock);

  const dockBtn = (id: string, label: string, color: string, ic: string | string[], go: () => void) =>
    h('button', { class: 'dock-i', 'data-id': id, 'aria-label': label, onclick: go, style: `--c:${color}` }, icon(ic, 24), h('span', { class: 'tip' }, label));
  dock.append(
    ...PROJECTS.map((p) => dockBtn(p.id, p.name, p.color, p.ic, () => openProject(p))),
    h('span', { class: 'dock-sep' }),
    dockBtn('work', 'Work', '#5b5670', I.folder, openWork),
    dockBtn('contact', 'Contact', '#7c3aed', I.mail, openContact));
  function syncDock() {
    dock.querySelectorAll<HTMLElement>('.dock-i').forEach((b) => b.classList.toggle('open', wins.has(b.dataset.id!)));
  }

  openWork();
}
