# Wayne Vicente: Systems and Automation

Personal portfolio built with [Astro](https://astro.build) and React. It has two sections:

- **Systems** (`/systems`): full apps, each with screenshots, a write-up, and a clickable demo. The demos are mockups: buttons react on screen, but nothing is sent, saved or downloaded.
- **Automations** (`/automations`): n8n workflows, each shown as a chain of nodes with its trigger, results, and an optional n8n canvas screenshot and workflow download.

The colors are Supabase × ZeBeyond: a near-black green background, Supabase green `#3ECF8E`, and mint/teal accents. All the color tokens are at the top of `src/styles/global.css`.

## Run it

Install [Node.js 22.12+](https://nodejs.org), then run:

```sh
npm install
npm run dev        # http://localhost:4321
```

## Where things live

| What | File |
|---|---|
| Name, tagline, services, process | `src/config/site.ts` |
| Systems (one Markdown file each) | `src/content/projects/*.md` |
| Automations (one Markdown file each) | `src/content/automations/*.md` |
| Testimonials (one Markdown file each; copy `_template.md`) | `src/content/testimonials/*.md` |
| Thoughts / posts (one Markdown file each; copy `_template.md`) | `src/content/thoughts/*.md` |
| Fields for both | `src/content.config.ts` |
| Screenshots and photos | `src/assets/projects/<build>/` |
| Interactive demos | `src/components/demos/` |
| Header, footer, toast | `src/layouts/Base.astro` |
| Colors and global styles | `src/styles/global.css` |

## Adding an n8n automation

1. Copy `src/content/automations/_template-n8n.md` to e.g. `invoice-reminders.md`. Removing the leading `_` is what publishes it, and the file name becomes the URL `/automations/invoice-reminders`.
2. Fill in `trigger` and the `flow` list (one line per node: the app and what it does). The node chain on the card and the page is drawn from it.
3. Optional: screenshot the n8n canvas into `src/assets/automations/invoice-reminders/canvas.png` and set `cover:` to it.
4. Optional: export the workflow from n8n (**⋯ → Download**), **remove any credentials or API keys from the JSON**, save it as `public/workflows/invoice-reminders.json`, and set `download: /workflows/invoice-reminders.json`.
5. If it runs inside one of the systems, set `system:` to that system's file name (e.g. `laundry`). Both pages then link to each other.

## Adding a system (e.g. the accounting firm)

1. Copy `src/content/projects/_template-accounting.md` to `accounting-firm.md`. Removing the leading `_` is what publishes it, and the file name becomes the URL `/systems/accounting-firm`.
2. Make a folder `src/assets/projects/accounting-firm/` and put the pictures in it.
3. In the new file, set `cover:` and the gallery `src:` paths to those pictures, then fill in the text.
4. Set `category:` to `Software`, `AI` or `Automation`. It shows as the small label on the card.

## Adding photos of the businesses

Each build's `gallery:` list contains slots with no `src:`. These show as "Photo coming soon". To fill one:

1. Save the photo (JPG or PNG; any size, since it is resized automatically) into that build's folder, for example `src/assets/projects/snackstop/shop-front.jpg`.
2. Add `src:` to the slot:

```yaml
  - { src: ../../assets/projects/snackstop/shop-front.jpg, caption: Snack Stop shop front }
```

These slots are waiting for photos:

| Build | Suggested file name |
|---|---|
| SnackStop | `snackstop/shop-front.jpg`, `snackstop/counter.jpg` |
| LaundryTrack | `laundry/shop-front.jpg` |
| DocGen | `doc-gen/office.jpg` |

## Deploy for free

Push this folder to GitHub, then connect the repo to either host:

- **Cloudflare Pages:** Create project → connect the GitHub repo → Framework preset **Astro**. Build command `npm run build`, output folder `dist`.
- **Netlify:** Add new site → import from GitHub. Build command `npm run build`, publish directory `dist`.

The site is fully static, with no server and no API keys.

## Commands

| Command | Action |
|---|---|
| `npm run dev` | Local dev server at `localhost:4321` |
| `npm run build` | Build the production site to `./dist/` |
| `npm run preview` | Preview the built site locally |
| `npx astro check` | Type-check |
