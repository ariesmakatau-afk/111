# Yianni's Hellenic Yiros — yiannis4

The site for Yianni's, 270 Hindley Street, Adelaide: whitewash, Hellenic blue and
live coals — with online pickup ordering, a kitchen board and an admin area.

## Run it

```bash
npm install
cp .env.example .env.local   # optional — the site runs without any of it
npm run dev                  # http://localhost:3000
npm run build                # production build
```

Deploys to Vercel as a standard Next.js project.

## Pages

| Public | |
|---|---|
| `/` | Looping spit video hero with a live shop-pulse card, "Today at the shop" (hours + a time-of-day spotlight you can order from), house numbers, signatures, why charcoal + the three meats (with a halal lamb sticker), the yiros builder + wheel of Hindley, "the usuals" (now four — yes, pork's one) + order lookup, the crew & customer wall, a review reel, catering, find us, top FAQs |
| `/menu` | **Menu & online order** — halal-lamb stickers on meat choices, live kitchen strip, sold-out/pacing notices, search + tag filters, every item has *Add*; guided step-by-step builder (salad is subtractive, extras asked last); cart docket; pickup checkout |
| `/order/status/[id]` | Live order tracker (received → on the spit → collected, with wait time, the kitchen's busy-night pacing, and a 🔔 that pings the tab when status moves) |
| `/catering` | Catering info, a headcount slider that builds a real priced plan from the menu, + enquiry form |
| `/story` | History, milestones (2002, delicious. 100 Nov 2023, 2025 renovation) |
| `/parea` | Staff photos + the customer wall |
| `/visit` | Hours, map, dine-in / takeaway / delivery |

| Staff (password, not indexed) | |
|---|---|
| `/staff` | Sign in — 5 tries per device, then a 15-minute lock; at most 3 devices signed in at once |
| `/kitchen` | **Kitchen tab** — one big button per ticket: **Accept** opens a time picker and only accepts when you confirm, then **Collected**. A **⋯** menu per order holds more time, change amounts, sold out, pause online orders and reject. **⚙ Settings** holds pacing (+0–20 min), the sold-out line, pause, the alarm (nine recordings in `public/sounds`, "Absolute disturbance" by default, loops until silenced, red screen flash) and phone alerts. No Admin tab — staff can't reach admin. |
| `/admin` | **Admin tab** — today's numbers, online-ordering switch, staff photos, customer wall, catering enquiries, signed-in devices (sign any device out), setup checklist |

There's a small "Staff" link in the footer.

**Staff sign-in rules** (`lib/session.ts`):
- **Two passwords.** `STAFF_PASSWORD` for the crew, `ADMIN_PASSWORD` for the owner/manager.
- **5 password attempts per device** (by IP address — devices on the shop Wi-Fi share one), then that device is locked out for 15 minutes.
- **At most 3 staff devices signed in at once.** A 4th is turned away until a staff tab closes, or the admin signs one out from **Admin → Signed-in devices**.
- **The admin password is never locked out**: it skips the attempt limit, never uses one of the 3 slots, and staff can't sign an admin out. Because it can't be locked, make it long (12+ characters) — the Setup checklist warns if it isn't.
- **Signed in for as long as the staff tab is open** — reloads and a sleeping screen included, so the kitchen tablet stays signed in all night. **Closing the tab signs out**: any new or reopened tab asks for the password, and the closed tab's slot frees up within a minute.
- Staff sign-in needs the database (it's where sign-ins are tracked).

## How an order flows

1. Customer adds items on `/menu` and checks out (name, mobile, pickup time). **No online payment** — they pay at the counter.
2. The server **re-prices every line from the menu** (the browser's prices are never trusted) and rejects anything the menu doesn't allow.
3. The order is saved, and a message goes to the shop phone (Telegram).
4. The kitchen alarm goes off. Staff tap **Accept**, pick a wait (10/15/20/30/45 min, ±5), and confirm.
5. The customer's tracking page updates to "About 15 minutes". Staff mark it collected.
6. Every Sunday night, an email summarises the week's orders (orders are kept, never deleted).

Busy night? **Pause online orders** from the kitchen or admin — customers are asked to call instead.

## Going live with ordering — setup

1. **Supabase** (free tier is plenty): create a project, then
   - SQL Editor → paste `supabase-schema.sql` → Run. Safe on the database from the previous site — it only adds what's missing. (Already set up? Run it again — it adds the staff sign-in tables, and staff can't sign in until it has.)
   - Storage → New bucket → name `media`, **Public**.
   - Project Settings → API → copy the URL and the **service_role** key.
2. **Vercel → Project → Settings → Environment Variables** — add everything in `.env.example`:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `STAFF_PASSWORD` (what staff type in), `ADMIN_PASSWORD` (the owner's — never locked out, 12+ characters) and `STAFF_SESSION_SECRET` (`openssl rand -hex 32`)
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — the same bot as the previous site works
   - `RESEND_API_KEY`, `DIGEST_EMAIL_TO`, `DIGEST_EMAIL_FROM`, `CRON_SECRET` — for the weekly email
3. Redeploy. Open `/admin` → **Setup** shows a green tick for each part that's connected.

Without these, the site still works: menu and cart run, and orders are written to the server log
instead of being saved — handy for testing, not for trading.

## Editing things

| What | Where |
|---|---|
| Address, phone, hours, rating, award, FAQ, links | `lib/site.ts` |
| Menu, prices, lamb premiums, sauces, extras | `lib/menu.ts` |
| Menu photos | `lib/menu-media.ts` (+ file in `public/images/`) |
| Staff & customer photos, pausing orders | `/admin` — no code |
| **Pacing buffer / sold-out line** | `/kitchen` — no code; lands on menu, checkout, tracker within ~15s |
| **Phone alerts (VAPID keys)** | `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` + `VAPID_SUBJECT` in the deploy env — private key never in the repo |
| **Hero video** | drop it in `public/video/` as `spits.mp4` — `heroVideo.src` already points there; it eases over the poster once it can play |
| **Halal (lamb) & sold-out lines** | the halal sticker label lives in `lib/site.ts` (`halal`); sold-out/pacing set live from `/kitchen`, no redeploy |

**Hero video spec:** MP4 (H.264), 1920×1080, 8–15 seconds, seamless loop, no audio, under ~8MB.
Optionally a WebM too. Until it's set, the hero shows the poster photo drifting slowly under the
live embers.

## Design notes

- `lib/embers.ts` — the spark engine (sparks cool white-gold → red, turbulent updraft, soft
  out-of-focus motes). `components/fire/*` — spark fields, coal beds, page-wide bursts.
- Colours are tokens at the top of `app/globals.css`, mirrored in `tailwind.config.ts`.
- Everything respects `prefers-reduced-motion`.
- **Fonts ship with the bundle** (`@fontsource-variable/manrope`, `@fontsource/instrument-serif`)
  — no Google-Fonts request at build or run time; the stacks live in `:root` in `globals.css`.

## Phone alerts (Web Push)

Customers flip **📲 Ping me when my order moves** on the order-tracker page;
the kitchen has the same switch on `/kitchen` (bucket `kitchen` — no customer
data crosses it). Setup:

1. Generate keys: `npx web-push generate-vapid-keys`. Put all three `VAPID_*`
   values in the Vercel environment (the public key is also safe in `.env.local`
   for dev; the private one lives ONLY in the deploy env).
2. Run `supabase-schema.sql` again (it's idempotent) — it adds the
   `push_subscriptions` table.
3. Redeploy. Until all three exist, the toggles quietly fall back to
   alerts-while-the-page-is-open — nothing breaks, ordering never depends
   on push.

iPhone only allows push from an **installed** web app — the manifest is in
place, so "Share → Add to Home Screen" then the 📲 button covers it.

## Live widgets (`components/widgets/`, `lib/shop-live.ts`)

Everything here is derived from trading hours and the menu — no fake counters, no invented offers.

| Widget | What it does |
|---|---|
| `ShopPulse` | Hero glass card: Adelaide clock, fire status, countdown to close/open, last online slot |
| `BoundaryCountdown` | Ticking "Closes in 2h 14m" pill (header topbar + hero); goes last-call red under 10 min |
| `TodayAtYiannis` + `SpotlightCard` | "Today at the shop": live panel + a time-of-day spotlight that suggests a real, priced order with one tap |
| `WeekStrip` | Seven bars of trading hours with a live "now" cursor on today |
| `YirosBuilder` | Build a yiros on the home page — size, meat, salad *off*-switches, sauces, extras last; the wrap repaints live, priced by `lib/order` |
| `SpinForIt` | The wheel of Hindley: six house orders, one spin, "add it to my order" |
| `OrderLookup` | Paste an order code → jumps to the tracker |
| `KitchenStrip` | Live line on `/menu`: how long the pass is up, last timed slot, "track last order" |
| `MenuFinder` | Search + tag chips on `/menu`; filters are derived from the menu itself (`menuTags`) |
| `FeedingCrowd` | Catering headcount slider → a real menu plan, priced; "put it on my order" |
| `CartToast` | A toast every time anything lands in the cart, from any widget |
| `ShopNotice` | Polls the kitchen flags — sold-out line + pacing buffer — at the top of `/menu` and inside checkout |
| `FuseProgress` / `BackToTop` / `AdelaideClock` / `ShopTicker` | Scroll fuse, ember back-to-top, ticking clock (hero + footer) |

`components/Reveal.tsx` re-scans with a MutationObserver so widgets that hydrate after load
never stay hidden; all time math runs in `Australia/Adelaide` no matter where the visitor is.

## Carried over from the previous site

`lib/menu.ts` (client-confirmed prices and rules), `lib/supabase.ts`, `lib/session.ts`,
`lib/requireStaff.ts`, `middleware.ts`, `lib/alertSounds.ts`, the kitchen-board logic and the
weekly digest. Changes: server-side re-pricing, order totals, catering enquiries, multiple staff
photos, the ordering switch, and HTML-escaping in the digest email.
