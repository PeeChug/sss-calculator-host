# Employee calc Pages rebuild (research + action plan)

Status: research only. Do not implement until Adrian signs off.

Hard rule: live Wix and `sss-calculator.js` never change. This plan is only for `sss-calculator-pages.js` and new Cloudflare resources that are not production Jobber / Velo / EmployeeQuotes.

---

## Isolation (non-negotiable)

| Live (do not touch) | Pages draft (new product) |
|---|---|
| `sss-calculator.js` | `sss-calculator-pages.js` |
| www `/employee-estimator-v2` | `/employee-portal/` |
| Wix Velo `/_functions/*` | New Pages Functions / Worker |
| Wix CMS (EmployeeQuotes, PricingRules, PipelineCards, …) | New D1 database |
| Jobber OAuth + GraphQL | ChalkCRM API (`app.chalkcrm.com`) |
| Wix Media photos | New R2 bucket |
| Public site `LEADS_DB` / `sss-website-lead-photos` | Separate D1 + R2 names |

Do not proxy writes from the draft to live Wix. The current `/_functions` proxy is a temporary compatibility layer. It must be removed before any PIN, quote, or CRM work happens on the copy.

Do not use live Jobber tokens. Do not dual-write quotes to Jobber from this copy.

---

## What we already have

The Pages fork is the same app as live, plus a five-line banner. Custom element `<sss-calculator>`, open Shadow DOM, one compiled JS file from `calculator.html` via `build-custom-element.py`.

Crew walk (keep this workflow): PIN sign-in, dashboard (quotes / leads / pipeline / analytics), 10-step quote (customer, type, measure/photos, condition, product, tier, color, add-ons, discounts, review), cloud save, PDF, customer education (tiers, oil vs water, DIY comparison, Wisetack, side tracker).

Wix glue (replace): `$w` / page-code.js storage, iframe cookie fan-out, Velo `{method}_{name}` GET hack, `window.open` Jobber OAuth, Wix Media base64 uploads, jsDelivr color pin, 16k-line compiled blob, `whoami` Wix member.

Login is navy (`#1a2540` gradient). Site is walnut (`#1b110c`). Portal still wraps the calc in marketing Base: nav, footer, “Employee portal” title band.

ChalkCRM is Adrian’s CRM (`chalk-crm-production` Worker, app at `app.chalkcrm.com`). Public command map: https://www.chalkcrm.com/dev. Developer keys are AI plan only (`chk_live_…`). Website ingest (`X-Api-Key` + `/api/ingest/lead`) is leads only, not a priced quote.

---

## Phase 0. Kill live coupling

1. Stop calling Wix from the draft. Point `/_functions/*` at a new Pages API, or return a clear “disconnected” error until Phase 2 ships.
2. Create new Cloudflare resources (names TBD, not shared with live):
   - D1 `sss-employee-calc-draft` (reps, devices, sessions, quotes, pricing, tech notes)
   - R2 `sss-employee-calc-draft-photos`
   - Secrets: `CHALK_API_KEY` (draft shop or sandbox only)
3. First-admin bootstrap on the new D1 so PIN login does not hit live reps.

Exit: signing in on `/employee-portal/` cannot list or write live EmployeeQuotes or Jobber.

---

## Phase 1. Shell and visual (first visible work)

Goal: looks like the new site, feels like an internal tool, no SEO, no marketing chrome.

1. New Astro layout for `/employee-portal/` only. No `Base` nav, footer, callbar, GTM, or “Employee portal” H1 band. Full-viewport `<sss-calculator>`. Keep `noindex, nofollow`, robots Disallow, no sitemap.
2. Auth gate: walnut `#1b110c` instead of navy gradient. Card linen/cream. Logo walnut or coral mark. Primary button coral `#dd6565` on walnut text (site `.btn`), not Jobber-era green. Fonts: Instrument Sans + Geist on `:host`.
3. Map calc tokens: `--navy` → `--walnut` / `--ink`; `--slate` → `--muted`; `--cream` → site cream/linen; `--coral` → `#dd6565`. Keep green only as save/success if needed.
4. Calc header stays (quote id, totals, Jobber pill becomes Chalk pill later). That is tool chrome, not the website header.

---

## Phase 2. Native backend on Cloudflare

Replace Velo + git-hosted CE compile with a first-party API next to the page.

Proposed shape:

- `functions/api/calc/*` (or a dedicated Worker) with ordinary REST, not Wix method names.
- Adapter in the Pages JS so existing `__sssBridge` method names can keep working during the port, then delete the adapter.
- D1 tables: `reps`, `devices`, `quotes`, `quote_projects`, `pricing_rules`, `tech_notes`. Optional: pull pipeline from Chalk instead of a local kanban table.
- Sessions: HttpOnly cookie on `pages.dev` plus Bearer. Drop parent `postMessage` / page-code.js.
- Photos: POST to R2, public or signed URLs for the quote and for Chalk `PUT /api/files`.
- Pricing: seed from the JS `PRICING` constants once, then edit in Settings against D1.

Source architecture (do this as we touch files, not a big-bang rewrite of 16k lines):

1. Keep the custom element (iPad Shadow DOM scroll fix still matters).
2. Stop editing the compiled blob by hand. Split `STYLE` / `HTML` / `PRICING` / auth / stages into modules and a real build (`vite` or the existing Python builder pointed at `calculator-pages.html` only).
3. Event listeners instead of `window` inline `onclick`.

---

## Phase 3. ChalkCRM instead of Jobber

Do not call Jobber from this copy.

Happy path (developer API, AI plan):

1. `GET /api/clients/lookup` then `POST /api/clients` + phones/emails.
2. `POST /api/properties` (quotes hang off the address).
3. Optional `POST /api/requests` then `/convert`, or skip funnel and `POST /api/quotes`.
4. `POST /api/quotes` with `line_items[]` using price-book `product_id` + `measures[]` (ln ft / sq ft in cents).
5. `PUT /api/files` for job photos.
6. Draft: `POST /api/quotes/:id/link`. Send: `/send` (needs `send` scope). Convert: `/convert` after approve.

UI replacements: Jobber search → Chalk lookup; Jobber pill → Chalk connected (API key is server-side, not OAuth popup); “Open in Jobber” → “Open in Chalk”; pipeline tab → Chalk `/api/requests/pipeline` or quotes board.

Need from Adrian before coding this phase: AI plan key, sandbox vs live shop, price-book product ids, draft vs auto-send, photo R2 ready, whether pipeline stays in Chalk.

---

## Phase 4. Improvements (after isolation + walnut shell)

Keep the product job: on-the-job estimate, educate the customer, one complete quote into Chalk.

- Tablet layout: calc is the page. Bigger type, safer iPad scroll, no marketing callbar fighting dash nav.
- Customer mode: side tracker as a clean “your quote” panel using site type (Instrument Sans, walnut/coral). Hide internal chips (SW toggle, Jobber ids, tech log) behind a crew menu.
- Education: keep tier / oil-water / prep / DIY / Wisetack; restyle cards to site radius and coral CTAs; first-party timber photos (stop jsDelivr pin).
- Quote quality for Chalk: one line per project (or per room) from the price book, not a Jobber description novel. Discounts as extras or adjusted `unit_price_cents`.
- Autosave to D1 with a visible saved state. Offline queue later if iPad reception dies on site.
- PWA on the iPad (Add to Home Screen), walnut theme-color `#1b110c`.
- Rep PIN and devices stay in our D1 (Chalk API does not hire or reset PINs).
- Drop Wix `whoami`. Employee identity is the PIN rep only.
- Customer-leads tab: later, ingest public calc into this D1 or into Chalk `/api/ingest/lead`. Out of scope until the crew quote path works.

---

## Build order

1. Phase 0 isolation (disconnect Wix/Jobber on the copy).
2. Phase 1 walnut + no site chrome (what Adrian asked first).
3. Phase 2 D1/R2 auth + quote save (so login and drafts work with no live DB).
4. Phase 3 Chalk push (the CRM goal).
5. Phase 4 education/UI polish and PWA.

Do not restyle the live file. Do not deploy these Functions over live Wix. Use hashed Pages URLs and a dedicated D1.

---

## Open questions

1. Chalk shop: live SSS or a sandbox tenant for this rebuild?
2. AI plan developer key available (`chk_live_…`)?
3. Fence/deck/paint products already in the Chalk price book with ln ft / sq ft measures?
4. After Send, should the calc mint a link only, auto-text/email, or leave a draft for the office?
5. New D1/R2 names OK as `sss-employee-calc-draft` / `sss-employee-calc-draft-photos`?
6. Keep compiling a custom element, or move to an Astro island once Shadow DOM is proven on the iPad Pages host?
