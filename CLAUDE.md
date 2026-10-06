# CLAUDE.md — read fully at the start of every session

## Every session
1. **Follow the Karpathy rules below.** They are copied from the `ariesmakatau-afk/karpathy` repo, which is read-only. Never change that repo.
2. **Use the superpowers.** `.claude/settings.json` enables the `superpowers` plugin from `obra/superpowers-marketplace`. Use its skills: brainstorming, planning, test-driven development, debugging and verification.
3. **Keep the memory current.** Before the session ends, update the "Memory" section below:
   - tick finished to-dos
   - add new decisions, prices and facts
   - remove anything out of date

   Then commit this file and push it to `main` with the session's work. Never write keys or passwords here.

---

# Karpathy rules

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

# Memory

## Who I am
- I run **Yianni's Hellenic Yiros**, a Greek yiros shop (Australia). The Yiros shop has been going 49+ years; the brand dates from 2002.
- Keep answers practical and short. Explain tech steps in plain words — I'm the shop owner, not a developer.
- Ask before big changes to wording or design. Push website changes to `main` once they're tested.

## Repos (GitHub: ariesmakatau-afk)
- **111**: copy of template-update for refining the site. **Make all changes here** and push to `main`.
- **template-update**: the live website (template-update-one.vercel.app). **Read-only — never change it.**
- **Template**: the older original. Reference only, don't push.
- **karpathy**: my coding rules ("superpowers"). **Read and follow it. Never change it.**

## Website facts
- Stack: Next.js 15 (App Router), React 19, Tailwind, TypeScript, Supabase (database + photo storage), Vercel.
- Look: Greek blue/white with navy-black. Never orange or black-and-orange. No orange button shadows.
- Copy tone: warm, with light Greek-ish humour. Approved claims:
  - "a million-plus yiros"
  - "Yiannis for decades"
  - "a yiros shop for 49+ years"
  - "brand since 2002"
- Photos come from Dropbox `/Posts/Social`, the real shop shots.
- Pages: `/` home, `/menu`, `/order`, `/catering`, `/parea`, `/story`.
- Staff pages:
  - `/staff` is the login. Staff go to `/kitchen` after signing in; admins go to `/admin`.
  - `/kitchen` has:
    - an Accept button with a ready-time picker
    - an ⋯ menu for order options
    - a Settings sheet
    - 9 loud alarm MP3s in `public/sounds`, with "disturbance" as the default
  - `/admin`: photo uploads (up to 4 per wall, no placeholders), the Deal, and enquiries.
- Photo uploads now refresh the home page and `/parea` straight away. Before, the cached pages could take a few visits to show new photos.
- **Deal:** set in `/admin` → Deal (on/off switch, one banner line, optional full details).
  - The banner shows at the top of the home page.
  - The full deal shows at the top of `/menu` (`/menu#deal`), and the banner links there.
  - Both load the deal fresh in the browser (`/api/deal`), not from the page cache, so turning it off or editing it shows on the next page load. (The first version was cached and the home banner lagged behind.)
- The home page Parea section has a line pointing people to the photos on `/parea`.
- Customers see their order tracking code at checkout and on the tracker page.
- Push notifications on iPhone only work if the kitchen board is added to the **Home Screen** from Safari. A plain Safari tab can't receive them.
- Secrets live only in Vercel env vars. **Never** put keys or passwords in code or chat. (Keys were once pasted into a chat; they should have been rotated.)

## Things still to do on my side
- [ ] Re-run `supabase-schema.sql` in Supabase (SQL editor), so push subscriptions save.
- [ ] Add the kitchen board to the Home Screen on the shop iPhone/iPad, then turn on alerts.
- [ ] Rotate the keys that were pasted in chat: Supabase service role, VAPID, Telegram, Resend, CRON/session secrets, admin passwords.
- [ ] Finish the Uber Eats menu rebuild (below). Keep the store paused until it's done.

## Uber Eats
- Uber takes 30% commission plus GST, about 33% in total.
- **Rule:** the shop must receive the website menu price.
  - Uber price = website price ÷ 0.67, rounded **up** to the next 50c.
- The tablet Uber supplies is locked. The plan is my own Android tablet running the Uber Eats Orders app, plus the kitchen board installed as an app.
- Menu rebuild with Claude in Chrome:
  - Keep the existing items.
  - Rebuild clean categories and modifier groups.
  - Use per-item size groups, with the item itself priced at $0.
  - The build sheet and spreadsheet are `Uber_menu_build_sheet.md` and `Yiannis_UberEats_Menu.xlsx`.
- Uber Direct (Uber delivers my own website orders): saves customers about $5–10 an order within ~5 km. It needs Stripe and an Uber Direct account. Not built yet.

## Done so far (don't redo)
- Mobile layout fixes and new photos
- Kitchen redesign, alarms, push fixes
- Staff/admin routing
- Admin photo upload fix
- Blue colours, menu thumbnails
- Lamb & Garlic wrap at $22
- Copy rewrite with humour
- This CLAUDE.md (rules + superpowers + memory) added
- Photos show straight after upload, Parea teaser on home, Deal banner + /menu deal
- 111 refinement pass (Oct 2026): orange button shadows → navy; builder − 1 + stepper fixed; "The usuals" swipe on phones; iPhone safe-area for order bar/sheets; hero downloads one photo per device; missing hero video no longer requested; canonical URLs, robots rules, site address from Vercel; smaller favicon; light wording tidy-ups
- Hero video: spits over the coals, a tall clip for phones and a wide one for larger screens (`public/video/`, see its README). Fresh Dropbox photos on the fire section, Story/Visit and the Yiros Pack.
- Delivery (Uber Direct) + card payments (Stripe) live in the **Yiannis** repo, not here.
- Once the shop's own domain is live, set `NEXT_PUBLIC_SITE_URL` in Vercel so Google uses it.
