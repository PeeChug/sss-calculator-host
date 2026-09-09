# Employee portal drop-in (Astro / Cloudflare Pages)

Apply these files on **`akg696/websites`** inside `superior-stain-solutions/`. This GitHub repo (`sss-calculator-host`) cannot edit that Origin repo from the calculator-host cloud agent.

## What this does

- New URL: `/employee-portal/` (trailing slash, same as the rest of the Astro site)
- Footer: one Company-column link, same style as Contact
- Page loads **`sss-calculator-pages.js`** first-party from `/js/sss-calculator-pages.js` (a copy of the live employee calc). Live Wix keeps `sss-calculator.js`.
- Pages Function proxies `/_functions/*` to live Wix Velo so PIN login and quotes keep working
- `GET /_functions/jobberStartAuth` 302s to Wix so Jobber OAuth stays on www

## What this does not do

- Does **not** change `sss-calculator.js`
- Does **not** change www.superiorstainsolutions.com (public Wix)
- Does **not** change `/employee-estimator-v2` (employees keep using it)
- Does **not** ship the customer calculator

## Copy these files

| Drop-in path | Destination in `superior-stain-solutions/` |
|---|---|
| `src/pages/employee-portal.astro` | `src/pages/employee-portal.astro` |
| repo root `sss-calculator-pages.js` | `public/js/sss-calculator-pages.js` |
| `functions/_functions/[name].ts` | `functions/_functions/[name].ts` (keep the brackets) |
| `functions/api/[[path]].ts` | Only if you must deploy Functions without the original `lead.ts` / `google-rating.ts`. **Do not** add this if those files are already in the websites repo. |

Edit `sss-calculator-pages.js` to improve the new site. Never edit `sss-calculator.js` (Wix /employee-estimator-v2). PIN and quotes on the draft still hit live Wix `/_functions` until a backend fork exists. UI-only changes are safe; do not test quote/Jobber writes against production data.

Do not overwrite `functions/api/lead.ts` or `functions/api/google-rating.ts` when those exist.

## Pages direct-upload fallback (no Origin repo)

The websites repo is on Cursor Origin, not GitHub. If you cannot clone it, do **not** deploy a static-only upload (that would wipe `/api/lead`). Mirror the current hashed production files, add the portal page + footer + `_functions` proxy, and keep `/api/*` working by proxying to that same hash (`functions/api/[[path]].ts` in this drop-in). Pin the upstream hash in that file before deploy. Rollback target: the hashed deployment you mirrored.

## Footer

In `src/components/Footer.astro`, Company list, after Contact:

```html
<li><a href="/employee-portal/">Employee portal</a></li>
```

Do not add it to the header "More" menu.

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

## BLOCKER before merge: Base.astro noindex

Open `src/pages/font-samples.astro` and copy its Base robots props exactly. Do not merge until view-source on `/employee-portal/` shows:

```html
<meta name="robots" content="noindex, nofollow">
```

If font-samples uses `robots="noindex, nofollow"`, change employee-portal.astro to that instead of `noindex`.

Also copy however font-samples is excluded from the sitemap (`astro.config.mjs` filter or equivalent) and any `public/_headers` `x-robots-tag: noindex` rule for `/font-samples/*`, then add the same for `/employee-portal/*`. No `data-cta-bar` on this page.

## Pages Functions routing check

After copy, confirm the deploy includes `/_functions/*` in Functions routes (Cloudflare Pages Functions / generated `_routes.json`).

If `_routes.json` is hand-maintained, include `/_functions/*` next to `/api/*`.

Smoke (must be JSON from Wix, not the Astro 404 HTML):

```
GET https://<hashed-preview>/_functions/getPricingRules
```

Expect `{"ok":true,"rules":...}`.

## CSP

If `public/_headers` has script-src / img-src allowlists, add:

- `https://cdn.jsdelivr.net`
- `https://cdnjs.cloudflare.com`
- `https://static.wixstatic.com`

The live Pages draft currently has no CSP that would block these. Recheck if that changes.

## After deploy

1. Hashed Pages URL (not the lagging alias). Hard-refresh.
2. Home footer: Company column shows Employee portal, same size as Contact.
3. `/employee-portal/` loads the PIN gate (SS logo), not the public customer calc.
4. Adrian signs in with a real rep PIN. Do not send a customer test lead.
5. Optional: Connect Jobber if it shows disconnected. Popup opens www, finish OAuth there. Original tab should show Connected within about 30 seconds.
6. Confirm https://www.superiorstainsolutions.com/employee-estimator-v2 still loads for the crew.
7. Confirm public Wix home is unchanged.

Residual: photo upload and some Jobber buttons send cookies only, not Bearer. The proxy copies `sss_auth_token` from the Pages cookie into Authorization. If a Jobber push fails after a good PIN login, that is the first place to look. Do not patch the calculator JS to fix it.

## Why not iframe Wix

Wix wraps the calc in a custom-element iframe. Nesting that inside Pages would bring back the iOS scroll bug this Shadow DOM build was made to avoid. Proxy plus first-party `<sss-calculator>` from `sss-calculator-pages.js` keeps the live Wix JS file untouched and avoids nesting Wix chrome.
