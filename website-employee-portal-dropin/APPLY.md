# Employee portal drop-in (Astro / Cloudflare Pages)

Apply these files on **`akg696/websites`** inside `superior-stain-solutions/`. This GitHub repo (`sss-calculator-host`) cannot edit that Origin repo from the calculator-host cloud agent.

## What this does

- New URL: `/employee-portal/` (trailing slash, same as the rest of the Astro site)
- Standalone full-bleed page: no `Base.astro`, no site nav/footer, no callbar, no GTM, no skip-to-content, no lightbox
- Title is internal (`Crew calculator | Superior Stain Solutions`); no marketing H1 band
- `noindex, nofollow` in the page `<head>` (also `X-Robots-Tag` in `_headers`)
- Page loads **`sss-calculator-pages.js`** first-party from `/js/sss-calculator-pages.js` (a copy of the live employee calc). Live Wix keeps `sss-calculator.js`.
- Native calc backend on Pages Functions (`functions/_functions/[name].ts` → `calc-backend/handler.ts`) with draft D1 + R2. Does **not** proxy PIN, quotes, or Jobber to live Wix.

## What this does not do

- Does **not** change `sss-calculator.js`
- Does **not** change www.superiorstainsolutions.com (public Wix)
- Does **not** change `/employee-estimator-v2` (employees keep using it)
- Does **not** ship the customer calculator
- Does **not** wrap the calc in marketing Base chrome

## Copy these files

| Drop-in path | Destination in `superior-stain-solutions/` |
|---|---|
| `src/pages/employee-portal.astro` | `src/pages/employee-portal.astro` (standalone HTML document; do not import Base) |
| repo root `sss-calculator-pages.js` | `public/js/sss-calculator-pages.js` |
| `functions/_functions/[name].ts` | `functions/_functions/[name].ts` (keep the brackets) |
| `calc-backend/` | `calc-backend/` |
| `functions/calc-photos/[id].ts` | `functions/calc-photos/[id].ts` |
| `functions/api/[[path]].ts` | Only if you must deploy Functions without the original `lead.ts` / `google-rating.ts`. **Do not** add this if those files are already in the websites repo. |

Edit `sss-calculator-pages.js` to improve the new site. Never edit `sss-calculator.js` (Wix /employee-estimator-v2). PIN and quotes on the draft hit the native Pages backend (draft D1), not live Velo. Do not test against production Jobber or live EmployeeQuotes.

Do not overwrite `functions/api/lead.ts` or `functions/api/google-rating.ts` when those exist.

## Pages direct-upload fallback (no Origin repo)

The websites repo is on Cursor Origin, not GitHub. If you cannot clone it, do **not** deploy a static-only upload (that would wipe `/api/lead`). Mirror the current hashed production files, replace `dist/employee-portal/index.html` with the full-bleed page, keep the footer Company link on other pages, attach the native `_functions` handler + calc D1/R2, and keep `/api/*` working by proxying public lead/rating to the mirrored hash (`functions/api/[[path]].ts` in this drop-in). Pin the upstream hash in that file before deploy. Rollback target: the hashed deployment you mirrored.

## Footer (other pages only)

The portal page itself has no footer. Keep the Company-column link on the rest of the site. In `src/components/Footer.astro`, Company list, after Contact:

```html
<li><a href="/employee-portal/">Employee portal</a></li>
```

Do not add it to the header "More" menu. Do not remove it from other pages when stripping chrome from `/employee-portal/`.

## robots.txt

`public/robots.txt` already has `Disallow: /employee`, which also covers `/employee-portal`. Add an explicit line anyway:

```
Disallow: /employee-portal
```

## Redirects (new site only)

Append to `public/_redirects`. Do not add these on Wix.

```
/employee  /employee-portal/  301
/employee/  /employee-portal/  301
/employee-hub  /employee-portal/  301
/employee-hub/  /employee-portal/  301
```

## noindex

The portal page is a standalone document (not Base). Confirm view-source on `/employee-portal/` shows:

```html
<meta name="robots" content="noindex, nofollow">
```

Exclude it from the sitemap (`astro.config.mjs` filter or equivalent). Add `public/_headers` `X-Robots-Tag: noindex, nofollow` for `/employee-portal`, `/employee-portal/`, and `/employee-portal/*`. No `data-cta-bar` on this page.

## Pages Functions routing check

After copy, confirm the deploy includes `/_functions/*` in Functions routes (Cloudflare Pages Functions / generated `_routes.json`).

If `_routes.json` is hand-maintained, include `/_functions/*` next to `/api/*`.

Smoke (native JSON from the draft backend, not Astro 404 HTML and not live Wix):

```
GET https://<hashed-preview>/_functions/getPricingRules
```

Expect JSON from the Pages calc handler (`{"ok":true,...}` or a clear disconnected/empty payload), not Wix CMS.

## CSP

If `public/_headers` has script-src / img-src allowlists, add:

- `https://cdn.jsdelivr.net`
- `https://cdnjs.cloudflare.com`

The live Pages draft currently has no CSP that would block these. Recheck if that changes.

## After deploy

1. Hashed Pages URL (not the lagging alias). Hard-refresh.
2. Home footer: Company column still shows Employee portal, same size as Contact.
3. `/employee-portal/` is full-bleed: calc only, no site nav, footer, intro H1, or callbar. PIN gate (SS logo), not the public customer calc.
4. View-source: `noindex, nofollow`, no GTM/gtag, no Base.astro scripts.
5. Adrian signs in with a draft-backend PIN. Do not send a customer test lead. Do not write to live Jobber.
6. Confirm https://www.superiorstainsolutions.com/employee-estimator-v2 still loads for the crew.
7. Confirm public Wix home is unchanged.

## Why not iframe Wix

Wix wraps the calc in a custom-element iframe. Nesting that inside Pages would bring back the iOS scroll bug this Shadow DOM build was made to avoid. First-party `<sss-calculator>` from `sss-calculator-pages.js` plus the native Pages backend keeps the live Wix JS file and Velo/Jobber stack untouched.
