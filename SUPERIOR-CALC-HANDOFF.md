# Superior Calc — Cursor Project Handoff

**Attach this file as always-on Project Knowledge.** It is the operating manual for the Superior Stain Solutions employee calculator (Pages + Chalk). Read it before changing code, deploying, quoting, or touching the public site.

The owner of this work is **Adrian Gluchowski**. Call him Adrian.

---

## 1. How to use this in Cursor Projects

1. Create (or open) a Cursor Project for the employee calc.
2. Attach GitHub repo **`PeeChug/sss-calculator-host`**. That is the calculator-host repo you are in now.
3. Add **this file** as Project Knowledge so every new chat starts with it.
4. Work on branch **`cursor/employee-portal-astro-dropin-c00c`** (open PR **#2** into `main`). Do not treat `main` as the place to edit the Pages product.
5. The public marketing site lives in a **different** repo: Cursor Origin **`akg696/websites`**, folder `superior-stain-solutions/`. This GitHub checkout cannot edit that Origin repo. Pages deploys for the calc are **direct upload**, not a Git-connected Pages source.
6. If Cloudflare, Chalk, Gmail, or Jobber MCP tools are connected, use them. Do not invent tokens. Secrets never go in git.

If two products conflict, this rule wins: **live Wix is frozen; Pages is the product you edit.**

---

## 2. Who this is for

**Business:** Superior Stain Solutions LLC (Duncan / Greenville / Spartanburg, Upstate SC). Fence, deck, and wood staining plus interior / exterior / cabinet painting.

**Commercial facts (always true):**

| | |
|---|---|
| Phone | 864-800-8275 |
| Email | contact@superiorstainsolutions.com |
| Public site | https://www.superiorstainsolutions.com |
| Quotes | Flat-rate, free estimates |
| Financing | Wisetack |
| Warranty | 12-month workmanship |
| CRM (new product) | ChalkCRM at https://app.chalkcrm.com |
| Chalk API docs | https://www.chalkcrm.com/dev |

**Brand on the Pages calc (restored, do not restyle to walnut):**

- Navy `#1a2540`
- Green `#2d6e4e`
- Cream / linen backgrounds around `#f7f5f1` / `#f6eee0`
- Theme color on the portal page: `#1a2540`

`website-employee-portal-dropin/REBUILD-PLAN.md` Phase 1 still talks about walnut / coral. **That restyle was reverted.** Keep navy/green unless Adrian explicitly asks to match the new marketing site.

Customer-facing copy: no em dashes. Keep it plain.

---

## 3. What we are building (objectives)

The Pages employee calc is the **on-the-job quoting tool**. A rep walks a job with a customer, educates them, and produces **one complete quote in Chalk**.

Keep this product job:

1. PIN sign-in on an iPad / phone in the field.
2. 10-step walk that teaches while it prices (tiers, oil vs water, prep, DIY comparison, Wisetack).
3. Multi-project quotes without restarting the wizard (fence + deck on one quote is the flagship case).
4. Autosave drafts to Cloudflare D1.
5. **Generate** creates a Chalk quote (draft, not auto-sent).
6. **Send** is a separate, explicit action (email + SMS). Never send as a side effect of push.
7. Office can open the quote in **app.chalkcrm.com**, not the customer hub.

This is **not** a marketing page. `/employee-portal/` is full-bleed calc, `noindex`, no site nav, no GTM, no callbar.

---

## 4. Two products. Do not mix them.

| Live (frozen) | Pages product (edit this) |
|---|---|
| `sss-calculator.js` | `sss-calculator-pages.js` |
| SHA **`2d491ea`** on `main` | Feature branch + Pages deploy |
| Wix `www.superiorstainsolutions.com` | Cloudflare Pages `superior-stain-solutions` |
| Path `/employee-estimator-v2` | `/employee-portal/` |
| Wix Velo + Jobber (`jobber.jsw` is **not in this repo**) | Native Pages Functions + ChalkCRM |
| Wix CMS EmployeeQuotes | Draft D1 `sss-employee-calc-draft` |
| Wix Media | R2 `sss-employee-calc-draft-photos` |

**Never edit `sss-calculator.js`.** Crew still uses the Wix estimator until Adrian cuts over.

Customer calculators (`sss-customer-calculator.js`, `sss-customer-calculator-sw.js`) are **out of scope**. Do not port them to Pages as part of this work. Do not post test leads through `/api/lead`.

---

## 5. Never do this

These are hard stops. Violating them can wipe the public lead form, spam real customers, or fork the live crew tool.

1. **Never edit `sss-calculator.js`.**
2. **Never change live Wix** `www.superiorstainsolutions.com` or `/employee-estimator-v2`.
3. **Never dual-write to Jobber** from the Pages copy. Chalk only.
4. **Never bind live Chalk D1 `chalk-crm`.** Calc uses its own D1 + HTTP to `app.chalkcrm.com`.
5. **Never static-only Pages deploy.** Uploading `dist/` without Functions wipes `/api/lead` and `/_functions/*`.
6. **Never overwrite** existing `functions/api/lead.ts` or `functions/api/google-rating.ts` when those files exist in the websites repo.
7. **Never send test customer leads** through `/api/lead`.
8. **Never spam Chalk.** Do not click **Send** on **John Ball** (`adgluchow@gmail.com`).
9. **Never commit secrets, PINs, Cloudflare tokens, or Chalk keys.**
10. **Never send Chalk `product_id`** on quote line items. Custom lines only.
11. **Never put stain gallons on customer-facing line items.** Gallons belong in office notes.
12. **Never set `quote.message`** on push. Leave it empty so Chalk uses the shop default intro.
13. **Never set `deposit_cents` / `deposit_bp`** on push. Leave unset so the CRM shop default applies.
14. **Never nest the Wix calc iframe** inside Pages. That reintroduces the iOS Safari scroll bug the Shadow DOM custom element exists to avoid.
15. **Never deploy from a non-Greenville Cloudflare account.** Account id: `8c8c24bf10b7b69a2ceba7dd63f35019`.
16. **Do not rename Jobber-shaped API methods** (`pushToJobber`, `searchJobberClients`, `jobberWebUri`, …). The JS still uses those names. The handler maps them to Chalk.

---

## 6. Repos, URLs, accounts

### Git

- Calculator host: `https://github.com/PeeChug/sss-calculator-host`
- Default branch `main` = frozen live JS only.
- Active Pages work: `cursor/employee-portal-astro-dropin-c00c` → PR https://github.com/PeeChug/sss-calculator-host/pull/2
- Revert snapshot (pre multi-project): branch `cursor/employee-portal-pre-multiproject-c00c`, tag `pre-multiproject-776e67a` (commit `776e67a`).

### Websites (Origin, not this checkout)

Astro marketing site: **`akg696/websites`** / `superior-stain-solutions/`.

Copy map if you ever land files there is in `website-employee-portal-dropin/APPLY.md`. Until that repo is attached, keep using **direct upload** to Pages.

### Cloudflare Pages

| | |
|---|---|
| Project | `superior-stain-solutions` |
| Account | Greenville `8c8c24bf10b7b69a2ceba7dd63f35019` |
| Source | **None** (direct upload, not Git-connected) |
| Config | `website-employee-portal-dropin/wrangler.toml` |

**Hashed URLs (trust these; aliases lag):**

| Role | URL |
|---|---|
| Preview (employee-portal branch) | https://24b24419.superior-stain-solutions.pages.dev/employee-portal/ |
| Preview alias (can be stale) | https://employee-portal.superior-stain-solutions.pages.dev/employee-portal/ |
| Production hash | https://c8074b38.superior-stain-solutions.pages.dev/employee-portal/ |
| Production alias (can be stale) | https://superior-stain-solutions.pages.dev/employee-portal/ |

Always verify on a **hashed** `*.pages.dev` URL plus cache-bust `?v=mp2` on the script. Hard-refresh. If the UI looks old, the alias served stale JS.

### Public site (do not break)

- https://www.superiorstainsolutions.com is still Wix.
- Public lead ingest on Pages (`/api/lead`, Google rating) must keep working after every deploy.
- Live leads D1 `LEADS_DB` = `6e8da07d-e793-4754-9b44-7c0c78d07322` (`sss-website-leads`).
- Live lead photos R2 `LEAD_PHOTOS` = `sss-website-lead-photos`.

### Calc-only Cloudflare resources

| Binding | Name | Id / notes |
|---|---|---|
| `CALC_DB` | `sss-employee-calc-draft` | `5f7d1d6d-b9a9-44f5-ad7f-ef4dc232d05b` |
| `CALC_PHOTOS` | `sss-employee-calc-draft-photos` | Quote reference JPEGs |
| `CHALK_API_BASE` | var | `https://app.chalkcrm.com` |
| `CHALK_API_KEY` | Pages **secret** | Bearer to Chalk. Not in git. |
| `AUTH_SECRET` | Pages **secret** | HMAC for device tokens. Not in git. |

On some cloud-agent VMs, tokens were loaded from `/tmp/greenville-cf.env` and `/tmp/chalk-crm.env` (chmod 600). Those files are **not** in the repo and may not exist on a new machine. Prefer Wrangler login + Pages dashboard secrets.

---

## 7. How everything connects

```
Crew iPad
  └─ /employee-portal/  (Astro standalone HTML, no Base chrome)
       └─ <sss-calculator>  sss-calculator-pages.js  (open Shadow DOM)
            │
            ├─ PIN gate → cookie sss_auth_token + Bearer
            ├─ GET/POST /_functions/<method>
            │     functions/_functions/[name].ts
            │           └─ calc-backend/handler.ts
            │                 ├─ D1 CALC_DB  (reps, devices, quotes, pricing)
            │                 ├─ R2 CALC_PHOTOS  (ph_{uuid}.jpg)
            │                 └─ HTTPS Chalk  Authorization: Bearer CHALK_API_KEY
            │                       ├─ GET  /api/dashboard
            │                       ├─ GET  /api/clients/lookup + list + search (+ archived)
            │                       ├─ POST /api/clients  (+ /phones, /emails)
            │                       ├─ POST /api/properties
            │                       ├─ POST /api/quotes   (custom line_items, optional discount_cents)
            │                       ├─ PATCH /api/quotes/:id  (discount again)
            │                       ├─ POST/PATCH /api/notes  (pinned office notes)
            │                       ├─ PUT  /api/files?entity_type=quote&entity_id=…
            │                       ├─ POST /api/quotes/:id/link  → app_url (office)
            │                       └─ POST /api/quotes/:id/send  {email,sms}   (Send only)
            └─ GET /calc-photos/:id  → R2

Public marketing / lead form (must survive deploys)
  └─ /api/lead  /api/google-rating
        Either original lead.ts in the websites repo
        or fallback proxy functions/api/[[path]].ts
           → https://39d00fb0.superior-stain-solutions.pages.dev
```

**Save vs push vs send:**

1. While walking steps, `cloudSaveDraft` → `createQuote` / `updateQuote` (D1 JSON payload).
2. Review → Generate → `setQuoteStatus` `finished` then `POST /_functions/pushToJobber`.
3. Push creates or refreshes the Chalk quote. **It does not send.**
4. Send is `POST /_functions/sendQuoteToCustomer` → Chalk `/send`. Email+SMS, then SMS-only fallback.

If a D1 row already has `chalk_quote_id` and `force` is not set, push **re-syncs notes + photos** and returns `alreadyPushed: true`. It does not mint a second quote.

---

## 8. File map (this repo)

| Path | Role |
|---|---|
| `sss-calculator.js` | Frozen Wix custom element. **Do not edit.** |
| `sss-calculator-pages.js` | **The Pages calc.** ~16k-line compiled custom element. Edit this. |
| `sss-customer-calculator.js` | Public customer calc. Out of scope. |
| `sss-customer-calculator-sw.js` | SW-referral customer calc. Out of scope. |
| `sss-scroll-test.js` | iOS scroll probe. |
| `colors/` | Timber color JPEGs. |
| `website-employee-portal-dropin/` | Drop-in package for Pages / websites repo. |
| `…/src/pages/employee-portal.astro` | Full-bleed host. Script `/js/sss-calculator-pages.js?v=mp2`. |
| `…/calc-backend/handler.ts` | Native API. Chalk + D1 + R2. |
| `…/calc-backend/schema.sql` | D1 schema. |
| `…/functions/_functions/[name].ts` | Pages Function router (keep the brackets). |
| `…/functions/calc-photos/[id].ts` | Private-ish photo GET from R2. |
| `…/functions/api/[[path]].ts` | Fallback proxy for public `/api/*`. |
| `…/wrangler.toml` | Bindings. Keep **both** lead and calc D1/R2. |
| `…/APPLY.md` | How to copy into `akg696/websites`. |
| `…/REBUILD-PLAN.md` | Research plan. **Status: isolation + Chalk implemented. Phase 1 walnut notes are stale.** |
| `SUPERIOR-CALC-HANDOFF.md` | This file. |

There is no `package.json` at repo root. The calc JS is a single-file custom element, originally compiled from `calculator.html` via `build-custom-element.py` (that builder is for the **live** file; do not rebuild the frozen Wix CE from Pages edits).

---

## 9. How to push changes (deploy)

Pages source is **not** GitHub. `git push` updates the PR. **It does not update the live portal.** You must wrangler-upload.

### Staging directory

Work from a deploy folder that already has the current production `dist/` plus Functions. Historically:

```
/tmp/sss-pages-deploy
  dist/                         # mirrored hashed production site
  dist/js/sss-calculator-pages.js
  dist/employee-portal/index.html
  functions/                    # _functions + calc-photos + api fallback
  calc-backend/
  wrangler.toml
```

### Copy from this repo, then deploy

```bash
# 1. Update JS
cp /workspace/sss-calculator-pages.js /tmp/sss-pages-deploy/dist/js/sss-calculator-pages.js

# 2. Update handler (and any Function files you changed)
cp /workspace/website-employee-portal-dropin/calc-backend/handler.ts \
   /tmp/sss-pages-deploy/calc-backend/handler.ts

# 3. Update portal HTML if the Astro page changed (cache-bust query, etc.)
#    Rendered form lives at dist/employee-portal/index.html
#    Source of truth: website-employee-portal-dropin/src/pages/employee-portal.astro

# 4. Cloudflare token: Greenville account only. Do not commit it.
#    export CLOUDFLARE_API_TOKEN=...
#    export CLOUDFLARE_ACCOUNT_ID=8c8c24bf10b7b69a2ceba7dd63f35019

cd /tmp/sss-pages-deploy

# 5. Preview branch first
npx wrangler pages deploy dist \
  --project-name=superior-stain-solutions \
  --branch=employee-portal \
  --commit-dirty=true

# 6. Production only after smoke
npx wrangler pages deploy dist \
  --project-name=superior-stain-solutions \
  --branch=main \
  --commit-dirty=true
```

The deploy **must include the `functions/` directory** next to `dist`. Wrangler picks it up from the project root. Static-only `wrangler pages deploy dist` from a folder without Functions will destroy `/api/lead`.

Keep public bindings (`LEADS_DB`, `LEAD_PHOTOS`) and calc bindings (`CALC_DB`, `CALC_PHOTOS`) on the project. Dashboard secrets `CHALK_API_KEY` and `AUTH_SECRET` stay in the Pages UI; wrangler deploy does not replace them unless you change them.

### After every deploy

1. Note the new **hashed** URL in wrangler output. Use that, not the alias.
2. Smoke: `GET https://<hash>.superior-stain-solutions.pages.dev/_functions/getPricingRules`  
   Expect JSON (`{"ok":true,...}` or a rules payload), **not** Astro 404 HTML and not Wix.
3. Open `/employee-portal/` hashed URL, hard-refresh, confirm script `?v=mp2` (bump this query if the browser still caches).
4. Confirm `/employee-estimator-v2` on Wix still loads.
5. Confirm public home is unchanged. Do not submit a fake lead.

### Cache

Portal script: `website-employee-portal-dropin/src/pages/employee-portal.astro` loads `/js/sss-calculator-pages.js?v=mp2`. Bump `mp2` → `mp3` when JS changes and aliases look stale.

### Git for the PR

```bash
git add -A
git commit -m "…"
git push -u origin cursor/employee-portal-astro-dropin-c00c
```

`main` stays frozen until Adrian merges PR #2 **and** agrees to cut the crew over from Wix.

---

## 10. Chalk: contract and gotchas

### Naming

Frontend and API **keep Jobber names**. Handler writes to Chalk.

| JS / API name | Actual |
|---|---|
| `pushToJobber` | Create/sync Chalk quote |
| `searchJobberClients` | Chalk client search |
| `jobberStatus` / `jobberTest` | `GET /api/dashboard` |
| `jobberStartAuth` | HTML stub (API key, no OAuth) |
| `jobberRefresh` / `jobberDisconnect` | No-ops |
| `jobberRequests` | `GET /api/requests` |
| `jobberQuoteId` / `jobberQuoteNumber` / `jobberWebUri` | Chalk id, number, **office** URL |
| `customer.jobberClientId` / `jobberPropertyId` | Chalk client / property ids stored in the payload |

### Auth to Chalk

`Authorization: Bearer ${CHALK_API_KEY}` against `https://app.chalkcrm.com`.

Python `urllib` gets **403** from Chalk’s Cloudflare. **curl with a browser User-Agent works.** Use curl or `fetch` from the Worker.

### Client search

Live Chalk book can look empty because **clients were archived**. Search runs five GETs in parallel:

- `/api/clients/lookup?q=`
- `/api/clients?q=`
- `/api/search?q=&kind=client`
- same list + search with `archived=1`

Typeahead marks **Archived**. Prefer live over archived when the same id appears. Cap 8.

### Push body (custom quotes)

One **custom** line per project:

```json
{
  "name": "<_jobberName>",
  "description": "<_jobberDescription>",
  "quantity": 1,
  "unit": "each",
  "unit_price_cents": 12345
}
```

- Dollars come from `preDiscountSubtotal` (fallback `subtotal`).
- **Never** `product_id`. Do not use the Chalk price book from the calc.
- Stain gallons are **not** line items.
- `_jobberRoomLineItems` in the JS payload is **unused** by the Chalk push. One aggregate line per project.

**Discount:** quote-level `discount_cents` + `discount_reason` (max 120 chars) on POST, then PATCH the same. Includes bundle 10% **plus** stacked project discounts. **Not** a negative line.

**Deposit:** omit. Shop default in Chalk (typically 25%).

**Customer letter (`message`):** omit. Shop default intro.

**Office notes:** pinned note, starts with `INTERNAL - crew / office`. Includes payment copy (text only), calc quote id, rep notes, **MATERIALS** (product, color, gallons / paint order), photo URLs, project summary. `buildChalkOfficeNotes` in `handler.ts`.

**Photos:** stored on R2 as `ph_{uuid}.jpg`. Push `PUT /api/files?entity_type=quote&entity_id=…&filename=…` with **raw JPEG bytes**, not JSON.

**Open in Chalk:** `POST /api/quotes/:id/link` → use `app_url` if it is not a `hub.chalkcrm.com` URL. Fallback `https://app.chalkcrm.com/quotes/{id}`. Reject hub URLs for the office button.

### Send

`POST /api/quotes/:id/send` `{ "email": true, "sms": true }`. If that fails, retry SMS-only. Requires the quote already pushed. Needs Chalk `send` scope on the key.

Lead source on new clients: `Employee calc (Pages draft)`.

Default property province: `SC`.

---

## 11. Wizard (Pages JS)

Custom element `<sss-calculator>`, **open Shadow DOM** (iPad scroll fix). One file, inline `STYLE` + `HTML` strings. Prefer surgical edits. Do not start a Vite rewrite unless Adrian asks.

**Quote shape in memory (do not replace):** `state.activeProject` + `state.bundledProjects`. Helpers treat them as one list:

- `quoteProjects()`
- `stainProjects()`
- `quoteSkipsConditionProduct()` / `quoteSkipsColor()`
- `projectNeedsStage(p, n)`
- `addBlankProjectOfType` / `removeLastProjectOfType`
- `swapFocusTo`
- `measurementsAreComplete`
- `applyToStainProjects`
- `renderApplyAllStainToggle` / `renderStageSkipPanel`

### Steps

| # | Name | Notes |
|---|---|---|
| 1 | Customer | Contact + Chalk typeahead + SW-referral toggle |
| 2 | Project | **Multi-select.** `+` adds another of the same type. Tap selected with no data removes. Bundle 10% at 2+ projects. |
| 3 | Measurements | Stay until **every** selected project validates. Next swaps to the next incomplete. Bubbles show “needs info”. |
| 4 | Condition | Prep service. Skip 4–5 only if **all** projects are paint. |
| 5 | Product | Oil / water / HOA. Same skip as 4. |
| 6 | Tier | Essential / Performance / Showcase |
| 7 | Color | Skip only if **no** project needs color (HOA / clear). Paint still needs color. |
| 8 | Add-ons | |
| 9 | Discounts | Stack cap **10%**. Bundle 10% **on top**, not inside the cap. |
| 10 | Review | Add Another must **not** set `maxStageReached = 2`. Then Generate / Send. |

Also: dashboard, success, view-quote. Leads / Pipeline / Analytics tabs were **removed** on this branch (`ceb95fb`). Pipeline handler methods still stub empty.

**Apply-to-all stain** (default on): product / tier / color / condition copy across stain projects.

**Adding from Review:** do not duplicate when the type is already on the quote; adding a new type must not rewind the 10-step bar.

### Pricing (high level)

- `PRICING` object in `sss-calculator-pages.js` is the baked-in book.
- D1 `pricing` row id=1 can override via Settings (`getPricingRules` / `savePricingRules`).
- `DISCOUNT_STACK_CAP = 0.10`. Bundle `PRICING.bundleDiscount = 0.10` stacks separately.
- Minimum stain job `$500`. Prep floors exist per service.
- Deck water stains use SuperDeck names (live `main` also has this).

Settings UI is **not finished**. Do not assume every Settings tab persists. Pricing save to D1 **does** work for the rules payload.

---

## 12. Auth

- First visit with empty `reps` table bootstraps first admin (PIN hashed into D1).
- PIN: 4–8 digits. **PBKDF2 SHA-256, 100000 iterations** (Workers cap). Per-rep salt.
- Tell Adrian to **change the PIN in Settings** after bootstrap. Do not commit PINs.
- Cookie: `sss_auth_token`, `Path=/`, 7 days, `SameSite=Lax`, `Secure`.
- Also `Authorization: Bearer`.
- Devices table holds HMAC signatures with `AUTH_SECRET`.

D1 tables: `reps`, `devices`, `quotes` (includes `chalk_quote_id`, `chalk_quote_number`, `chalk_web_uri`), `pricing`, `tech_notes`, `pipeline_cards`.

---

## 13. Public `/api/lead` preservation

`wrangler.toml` keeps `LEADS_DB` + `LEAD_PHOTOS` so a Functions deploy does not drop the public form.

If the websites repo already has `functions/api/lead.ts` and `google-rating.ts`, **leave them**. The drop-in `[[path]].ts` is only for calculator-host direct uploads that do not include those sources.

Fallback proxy:

- File: `website-employee-portal-dropin/functions/api/[[path]].ts`
- Upstream pin: `https://39d00fb0.superior-stain-solutions.pages.dev`
- Loop guard header: `x-sss-api-proxy`

Do not send customer test leads through it.

---

## 14. Testing rules

- Verify UI on hashed Pages URLs, not only a screenshot of local HTML.
- Exercise the walk: PIN → Step 2 multi-select Fence+Deck → measure both on Step 3 → Condition still shows both for mixed stain → Review.
- Do **not** Generate/Send to real customers. Do **not** Send to John Ball.
- Backend unit check for discounts: two-project payload → two **positive** lines + `discountCents` (not a negative third line).
- Smoke `GET /_functions/getPricingRules`.
- If you change deploy shape, confirm `/api/lead` still exists (OPTIONS/GET without posting a lead).
- Chalk HTTP from a laptop: use curl + User-Agent, not Python urllib.

### Revert

If multi-project feels wrong:

- Branch `cursor/employee-portal-pre-multiproject-c00c`
- Tag `pre-multiproject-776e67a`

---

## 15. Open gaps (do not “fix” unless asked)

- Settings screens are incomplete; not every control saves.
- Pipeline / leads / customer-draft / analytics APIs **stub empty**. The UI tabs were removed; do not resurrect them into Chalk without a spec.
- `_jobberRoomLineItems` is not sent to Chalk (one line per project).
- Jobber-era comments remain in the JS (`http-functions.js`, Velo). Ignore them; the Pages handler is native.
- `REBUILD-PLAN.md` Phase 4: PWA, education restyle, first-party timber photos, offline queue, splitting the 16k-line blob. Optional later.
- Customer calc is still Wix-only.
- `akg696/websites` is not in this checkout; footer “Employee portal” link and `_redirects` live there / already on the mirrored `dist`.
- Price-book `product_id` mapping was considered and **rejected**. Stay on custom lines.

---

## 16. Agent working style for this project

- Call the user **Adrian**. Be direct. Finish the task; do not ask permission to proceed on work he already ordered.
- Prefer editing `sss-calculator-pages.js` + `website-employee-portal-dropin/calc-backend/handler.ts` + the Astro portal page.
- After JS or handler changes: copy into the deploy folder, wrangler deploy **with Functions**, smoke hashed URL, then git commit + push the branch.
- Do not estimate calendar time. Describe subsystems and risk instead.
- No secrets in commits, PR bodies, or this file.

---

## 17. Quick “where do I change X?”

| Want | Change |
|---|---|
| Wizard copy, steps, pricing math, education | `sss-calculator-pages.js` |
| Chalk payload, notes, discounts, search, send | `website-employee-portal-dropin/calc-backend/handler.ts` |
| PIN / D1 schema | `schema.sql` + `handler.ts` auth/quotes |
| Portal chrome, cache-bust, noindex | `src/pages/employee-portal.astro` |
| Bindings | `wrangler.toml` + Pages dashboard (secrets) |
| How to land in the Astro site repo | `APPLY.md` |
| Live crew tool on Wix | **You don’t.** |

---

## 18. Related docs in-repo

- `website-employee-portal-dropin/APPLY.md` — copy/deploy checklist for the websites repo and direct-upload fallback.
- `website-employee-portal-dropin/REBUILD-PLAN.md` — original plan. Isolation + native backend + Chalk are done. Ignore walnut Phase 1. Remaining ideas are Phase 4 polish.

When this file and those two disagree, **this handoff + the current handler/JS win.**
