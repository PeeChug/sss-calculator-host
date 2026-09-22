/**
 * Headless Chrome harness for estimator pass mp16.
 * Mixed-quote Chalk lines, exterior/cabinet color+TBD, TBD chip rename.
 * Stubs auth. 403 /api/lead. Does not Generate/Send.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const ROOT = '/workspace';
const MEDIA = '/cursor/stores/bc-ca593e7d-8bb2-401a-b937-2a1360dc3147/media';
const JS = fs.readFileSync(path.join(ROOT, 'sss-calculator-pages.js'), 'utf8');
const PORT = 8766;
const PAYLOAD_PATH = '/tmp/mixed-chalk-payload.json';
const LINES_PATH = '/tmp/mixed-chalk-lines.json';

const HTML = `<!doctype html><html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>calc harness</title>
<style>html,body{margin:0;background:#f7f5f1}sss-calculator{display:block;min-height:100vh}</style>
</head><body>
<sss-calculator></sss-calculator>
<script>${JS}</script>
</body></html>`;

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = req.url || '/';
      if (url.startsWith('/js/sss-calculator-pages.js') || url === '/' || url.startsWith('/employee-portal')) {
        res.writeHead(200, { 'content-type': url.includes('.js') ? 'text/javascript' : 'text/html' });
        res.end(url.includes('.js') ? JS : HTML);
        return;
      }
      res.writeHead(404);
      res.end('no');
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

function blankStain(type, ord, extra = {}) {
  const measurements = type === 'fence'
    ? { linearft: 180, height: 6, style: 'privacy' }
    : type === 'pergola'
      ? { length: 12, width: 12, sqft: 144 }
      : { flat: 320, rail: 40, stairs: 0 };
  return Object.assign({
    type,
    measurements,
    condition: 'soft_wash',
    productType: 'oil',
    tier: 'performance',
    conditionConfirmed: true,
    productConfirmed: true,
    tierConfirmed: true,
    woodAge: 'weathered',
    selectedColor: { name: 'Cedar', code: '', line: 'EXPERT Stain & Seal' },
    addons: {},
    serviceAddons: {},
    selectedDiscounts: [],
    customAddons: [],
    hoa: { brand: '', transparency: '', productName: '', color: '', notes: '' },
    previousStain: { wasStained: false, previousProductType: '', brand: '', transparency: '', productName: '', colorNotes: '' },
    referencePhotos: [],
    _uid: 'p_' + type,
    _ord: ord,
    _seq: undefined,
  }, extra);
}

function interiorProject(ord) {
  return {
    type: 'interior',
    productType: 'interior_paint',
    productConfirmed: true,
    condition: null,
    conditionConfirmed: true,
    tier: 'performance',
    tierConfirmed: true,
    selectedColor: { name: 'Agreeable Gray', code: 'SW 7029', brand: 'Sherwin-Williams' },
    addons: {},
    serviceAddons: {},
    selectedDiscounts: [],
    customAddons: [],
    hoa: {},
    previousStain: { wasStained: false },
    referencePhotos: [],
    _uid: 'p_interior',
    _ord: ord,
    measurements: {
      rooms: [
        {
          id: 'room-a', type: 'living', label: 'Living Room',
          len: 14, wid: 12, height: 8, sizePreset: '12x14',
          surfaces: { walls: true, ceiling: true, trim: true, crown: false, accent: false, closet: false, doors: 1, windows: 1, windowsDouble: 0 },
          extras: {}, drywall: 'none', notes: '',
        },
        {
          id: 'room-b', type: 'bedroom', label: 'Bedroom',
          len: 12, wid: 11, height: 8, sizePreset: '11x12',
          surfaces: { walls: true, ceiling: true, trim: true, crown: false, accent: false, closet: false, doors: 1, windows: 1, windowsDouble: 0 },
          extras: {}, drywall: 'none', notes: '',
        },
      ],
      colorPlan: {
        mode: 'split',
        wall: { name: 'Agreeable Gray', code: 'SW 7029', hex: '#d1cbc0' },
        ceiling: { name: 'Extra White', code: 'SW 7006', hex: '#EEEFEA' },
        trim: { name: 'Extra White', code: 'SW 7006', hex: '#EEEFEA' },
        perRoom: {},
      },
    },
  };
}

function exteriorProject(ord, extra = {}) {
  return Object.assign({
    type: 'exterior',
    productType: 'exterior_paint',
    productConfirmed: true,
    condition: null,
    conditionConfirmed: true,
    tier: 'performance',
    tierConfirmed: true,
    selectedColor: null,
    addons: {},
    serviceAddons: {},
    selectedDiscounts: [],
    customAddons: [],
    hoa: {},
    previousStain: { wasStained: false },
    referencePhotos: [],
    _uid: 'p_exterior',
    _ord: ord,
    measurements: {
      sides: [
        { id: 'side-a', preset: 'Front', label: 'Front', len: 40, height: 10, substrate: 'wood', peel: 'none', notes: '' },
        { id: 'side-b', preset: 'Rear', label: 'Rear', len: 36, height: 10, substrate: 'wood', peel: 'none', notes: '' },
      ],
      ext: {
        trimFascia: 80, soffit: 0, gutters: 0, windows: 4, shutters: 0,
        doors: 1, garage1: 0, garage2: 0, porchCeilingSqFt: 0,
        railingLnFt: 0, columns: 0, pre1978: false,
      },
      colorPlan: {
        _ext: true,
        body: null,
        trim: { name: 'Extra White', code: 'SW 7006', hex: '#EEEFEA' },
        door: null,
        shutters: null,
        bodySheen: 'Satin',
        trimSheen: 'Gloss',
        doorSheen: 'Gloss',
      },
    },
  }, extra);
}

function cabinetProject(ord) {
  return {
    type: 'cabinet',
    productType: 'cabinet_paint',
    productConfirmed: true,
    condition: null,
    conditionConfirmed: true,
    tier: 'performance',
    tierConfirmed: true,
    selectedColor: null,
    addons: {},
    serviceAddons: {},
    selectedDiscounts: [],
    customAddons: [],
    hoa: {},
    previousStain: { wasStained: false },
    referencePhotos: [],
    _uid: 'p_cabinet',
    _ord: ord,
    measurements: {
      areas: [
        {
          id: 'cab-a', type: 'kitchen', label: 'Kitchen',
          doors: 12, drawers: 6, glassDoors: 0, endPanels: 2,
          crownLnFt: 0, insideBoxes: 0, finish: 'painted',
          oakGrain: false, thermofoil: false, notes: '',
        },
        {
          id: 'cab-b', type: 'island', label: 'Island',
          doors: 4, drawers: 4, glassDoors: 0, endPanels: 0,
          crownLnFt: 0, insideBoxes: 0, finish: 'painted',
          oakGrain: false, thermofoil: false, notes: '',
        },
      ],
      colorPlan: { _cab: true, mode: 'single', main: null, island: null, sheen: 'Satin' },
    },
  };
}

async function sEval(page, fn, ...args) {
  return page.$eval('sss-calculator', (el, fnSrc, argList) => {
    const fn2 = eval('(' + fnSrc + ')');
    return fn2(el.shadowRoot, ...argList);
  }, fn.toString(), args);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function fail(msg) { throw new Error(msg); }

async function boot(page) {
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/api/lead')) return req.respond({ status: 403, contentType: 'text/plain', body: 'forbidden' });
    if (url.includes('authStatus')) {
      return req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, rep: { id: 'r1', name: 'Test Rep', role: 'admin', initials: 'TR' } }),
      });
    }
    if (url.includes('getPricingRules')) {
      return req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    }
    if (url.includes('listQuotes') || url.includes('/_functions/')) {
      return req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, quotes: [] }) });
    }
    req.continue();
  });
  await page.goto(`http://127.0.0.1:${PORT}/employee-portal/?v=mp16`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('sss-calculator');
  await page.waitForFunction(() => {
    const el = document.querySelector('sss-calculator');
    return el && el.shadowRoot && typeof window.lockAuthBehindGate === 'function';
  });
  await page.evaluate(() => {
    try { window.lockAuthBehindGate(false); } catch (e) {}
    const gate = document.querySelector('sss-calculator').shadowRoot.getElementById('authGate');
    if (gate) gate.style.display = 'none';
  });
}

async function loadQuote(page, projects, stage) {
  await page.evaluate((plist, stageN) => {
    window.state._applyToAllStain = false;
    window.state.bundledProjects = [];
    window.state.activeProject = plist[0];
    window.state.bundledProjects = plist.slice(1);
    window.state.currentStage = stageN;
    window.state.maxStageReached = Math.max(stageN, 10);
    window.state.customer = {
      name: 'Test Homeowner', phone: '8645550100', email: 'test@example.com',
      address: '', firstName: 'Test', lastName: 'Homeowner',
      street1: '', city: '', province: '', postalCode: '',
    };
    window.showStage(stageN);
  }, projects, stage);
  await sleep(320);
}

function runHandler(payload) {
  fs.writeFileSync(PAYLOAD_PATH, JSON.stringify(payload));
  const script = `
    import { readFileSync, writeFileSync } from 'node:fs';
    import { buildQuoteLineItems } from '/workspace/website-employee-portal-dropin/calc-backend/handler.ts';
    const payload = JSON.parse(readFileSync('${PAYLOAD_PATH}', 'utf8'));
    const { line_items } = buildQuoteLineItems(payload);
    const dump = line_items.map((l) => ({
      name: l.name,
      unit_price_cents: l.unit_price_cents,
      description: String(l.description || ''),
      product_id: l.product_id || null,
    }));
    writeFileSync('${LINES_PATH}', JSON.stringify(dump, null, 2));
    console.log(JSON.stringify(dump));
  `;
  const r = spawnSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', script], {
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  });
  if (r.status !== 0) {
    throw new Error('handler dump failed: ' + (r.stderr || r.stdout));
  }
  return JSON.parse(fs.readFileSync(LINES_PATH, 'utf8'));
}

async function screenshotLines(page, lines, outName) {
  const rows = lines.map((l) =>
    `<div class="row"><span class="name">${String(l.name).replace(/</g, '&lt;')}</span>` +
    `<span class="cents">${l.unit_price_cents}</span></div>`
  ).join('');
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8">
<style>
  html,body{margin:0;background:#f7f5f1;color:#1a2540;font:15px/1.45 system-ui,sans-serif}
  .wrap{padding:28px 32px;max-width:720px}
  h1{font-size:18px;margin:0 0 6px;color:#1a2540}
  p{margin:0 0 16px;color:#5a6378;font-size:13px}
  .row{display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid #ece9e3}
  .name{font-weight:700}
  .cents{font-family:ui-monospace,monospace;color:#2d6e4e;font-weight:700}
</style></head><body>
<div class="wrap">
  <h1>Chalk quote lines (handler dry-run)</h1>
  <p>buildQuoteLineItems output. unit_price_cents per line. No POST /api/lead.</p>
  ${rows}
</div></body></html>`);
  await sleep(80);
  await page.screenshot({ path: path.join(MEDIA, outName), fullPage: true });
}

async function main() {
  fs.mkdirSync(MEDIA, { recursive: true });
  const server = await startServer();
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=768,1200'],
    defaultViewport: { width: 768, height: 1200, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  const leadHits = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/lead') && req.method() === 'POST') leadHits.push(req.url());
  });
  try {
    await boot(page);

    // 1. Mixed quote Chalk lines: Fence + Deck + Interior (2 rooms) + Exterior (2 sides)
    const mixedProjects = [
      blankStain('fence', 1),
      blankStain('deck', 2),
      interiorProject(3),
      exteriorProject(4, {
        selectedColor: { name: 'Naval body / Extra White trim', code: 'SW 6244', brand: 'Sherwin-Williams' },
        measurements: {
          sides: [
            { id: 'side-a', preset: 'Front', label: 'Front', len: 40, height: 10, substrate: 'wood', peel: 'none', notes: '' },
            { id: 'side-b', preset: 'Rear', label: 'Rear', len: 36, height: 10, substrate: 'wood', peel: 'none', notes: '' },
          ],
          ext: {
            trimFascia: 80, soffit: 0, gutters: 0, windows: 4, shutters: 0,
            doors: 1, garage1: 0, garage2: 0, porchCeilingSqFt: 0,
            railingLnFt: 0, columns: 0, pre1978: false,
          },
          colorPlan: {
            _ext: true,
            body: { name: 'Naval', code: 'SW 6244', hex: '#2f3d4c' },
            trim: { name: 'Extra White', code: 'SW 7006', hex: '#EEEFEA' },
            door: null, shutters: null,
            bodySheen: 'Satin', trimSheen: 'Gloss', doorSheen: 'Gloss',
          },
        },
      }),
    ];
    await page.evaluate((plist) => {
      window.state._applyToAllStain = false;
      window.state.activeProject = plist[0];
      window.state.bundledProjects = plist.slice(1);
      window.state.customer = {
        name: 'Test Homeowner', phone: '8645550100', email: 'test@example.com',
        address: '100 N Main St', firstName: 'Test', lastName: 'Homeowner',
        street1: '100 N Main St', city: 'Greenville', province: 'SC', postalCode: '29601',
      };
      window.refreshAllProjectCaches();
    }, mixedProjects);
    const payload = await page.evaluate(() => window.buildCloudPayload());
    if (!payload || !payload.projects || payload.projects.length !== 4) {
      fail('mixed payload projects: ' + JSON.stringify(payload && payload.projects && payload.projects.map((p) => p.type)));
    }
    const types = payload.projects.map((p) => p.type);
    if (types.join(',') !== 'fence,deck,interior,exterior') fail('project order: ' + types.join(','));

    const frontend = payload.projects.flatMap((p) => {
      const rooms = Array.isArray(p._jobberRoomLineItems) ? p._jobberRoomLineItems : [];
      if (rooms.length) {
        return rooms.map((r) => ({
          type: p.type,
          name: r.name,
          unit_price_cents: r.unit_price_cents,
          totalPrice: r.totalPrice,
        }));
      }
      return [{ type: p.type, name: p._jobberName, unit_price_cents: Math.round(Number(p.preDiscountSubtotal || 0) * 100), totalPrice: p.preDiscountSubtotal }];
    });
    console.log('FRONTEND_LINES', JSON.stringify(frontend, null, 2));

    const fenceLines = frontend.filter((l) => l.type === 'fence');
    const deckLines = frontend.filter((l) => l.type === 'deck');
    const intLines = frontend.filter((l) => l.type === 'interior');
    const extLines = frontend.filter((l) => l.type === 'exterior');
    if (fenceLines.length !== 1) fail('fence should be one line: ' + JSON.stringify(fenceLines));
    if (deckLines.length !== 1) fail('deck should be one line: ' + JSON.stringify(deckLines));
    if (intLines.length < 2) fail('interior should fan rooms: ' + JSON.stringify(intLines));
    if (!intLines.some((l) => /Living/i.test(l.name)) || !intLines.some((l) => /Bedroom/i.test(l.name))) {
      fail('interior room names: ' + JSON.stringify(intLines));
    }
    if (extLines.length < 2) fail('exterior should fan sides: ' + JSON.stringify(extLines));
    if (!extLines.some((l) => /Front/i.test(l.name)) || !extLines.some((l) => /Rear/i.test(l.name))) {
      fail('exterior side names: ' + JSON.stringify(extLines));
    }
    const intSum = intLines.reduce((s, l) => s + l.unit_price_cents, 0);
    const extSum = extLines.reduce((s, l) => s + l.unit_price_cents, 0);
    const intProj = Math.round(Number(payload.projects.find((p) => p.type === 'interior').preDiscountSubtotal) * 100);
    const extProj = Math.round(Number(payload.projects.find((p) => p.type === 'exterior').preDiscountSubtotal) * 100);
    if (intSum !== intProj) fail('interior room cents ' + intSum + ' != project ' + intProj);
    if (extSum !== extProj) fail('exterior side cents ' + extSum + ' != project ' + extProj);
    if (intLines[0].unit_price_cents === intProj && intLines.slice(1).every((l) => l.unit_price_cents === 0)) {
      fail('interior dumped total on line 1');
    }
    if (extLines[0].unit_price_cents === extProj && extLines.slice(1).every((l) => l.unit_price_cents === 0)) {
      fail('exterior dumped total on line 1');
    }

    const lines = runHandler(payload);
    console.log('HANDLER_LINES', JSON.stringify(lines, null, 2));
    if (lines.some((l) => l.product_id)) fail('handler product_id present');
    if (lines.length < 6) fail('expected stain + rooms + sides, got ' + lines.length);
    const quoteTotal = frontend.reduce((s, l) => s + l.unit_price_cents, 0);
    if (lines[0].unit_price_cents === quoteTotal) fail('handler dumped quote total on line 1');
    const hInt = lines.filter((l) => /^Interior/.test(l.name));
    const hExt = lines.filter((l) => /^Exterior/.test(l.name));
    if (hInt.length !== intLines.length) fail('handler interior count ' + hInt.length);
    if (hExt.length !== extLines.length) fail('handler exterior count ' + hExt.length);
    if (hInt[0].unit_price_cents !== intLines[0].unit_price_cents) fail('handler interior cents mismatch');
    if (!String(hInt[hInt.length - 1].description).includes('PAINT (ESTIMATED ORDER)')) {
      console.log('WARN interior gallons missing from last interior line', hInt[hInt.length - 1].description.slice(0, 200));
    }
    await screenshotLines(page, lines, 'chalk-lines-mixed-quote.png');
    console.log('PASS mixed chalk lines', lines.map((l) => [l.name, l.unit_price_cents]));

    // Reboot calc after setContent
    await page.goto(`http://127.0.0.1:${PORT}/employee-portal/?v=mp16`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('sss-calculator')?.shadowRoot && typeof window.lockAuthBehindGate === 'function');
    await page.evaluate(() => {
      try { window.lockAuthBehindGate(false); } catch (e) {}
      const gate = document.querySelector('sss-calculator').shadowRoot.getElementById('authGate');
      if (gate) gate.style.display = 'none';
    });

    // 2. Exterior color + TBD on stacked quote (Fence + Exterior), apply-all off
    await loadQuote(page, [
      blankStain('fence', 1, { selectedColor: { name: 'Cedar', code: '', line: 'EXPERT Stain & Seal' } }),
      exteriorProject(2),
    ], 7);
    const extUi = await sEval(page, (root) => {
      const apply = root.querySelector('#applyAllProjectsCb');
      const extBlock = root.querySelector('.finish-block[data-uid="p_exterior"]');
      const fenceBlock = root.querySelector('.finish-block[data-uid="p_fence"]');
      const modes = [...(extBlock ? extBlock.querySelectorAll('.int-mode-card') : [])].map((b) => b.textContent.trim());
      const planner = extBlock && extBlock.querySelector('.int-color-planner');
      const tbd = extBlock && [...extBlock.querySelectorAll('[data-x-tbd="body"]')].pop();
      const swatches = extBlock ? [...extBlock.querySelectorAll('[data-x-target="body"].int-swatch:not(.tbd-swatch)')] : [];
      const firstFam = extBlock && extBlock.querySelector('details');
      if (firstFam) firstFam.open = true;
      return {
        applyOff: !(apply && apply.checked),
        stacked: !!(extBlock && fenceBlock),
        plannerW: planner && Math.round(planner.getBoundingClientRect().width),
        tbdName: tbd && tbd.textContent.trim(),
        tbdLast: !!(tbd && tbd.parentElement && [...tbd.parentElement.querySelectorAll('.int-swatch, details')].pop() === tbd || (tbd && !tbd.nextElementSibling?.matches?.('.int-swatch, details'))),
        swatchCount: swatches.length,
        banner: !!(extBlock && extBlock.querySelector('.tbd-color-banner')),
        nextDisabled: root.getElementById('stage7Next') && root.getElementById('stage7Next').disabled,
        modes,
      };
    });
    if (!extUi.stacked) fail('exterior not stacked with fence: ' + JSON.stringify(extUi));
    if (!extUi.applyOff) fail('apply-to-all should be off');
    if (extUi.plannerW < 500) fail('exterior planner not tablet-wide: ' + JSON.stringify(extUi));
    if (!/To Be Determined/i.test(extUi.tbdName || '')) fail('exterior TBD label: ' + extUi.tbdName);
    if (extUi.banner) fail('exterior TBD banner still shown');

    await sEval(page, (root) => {
      const extBlock = root.querySelector('.finish-block[data-uid="p_exterior"]');
      const fam = extBlock.querySelector('[data-x-picker="body"] details');
      if (fam) fam.open = true;
    });
    await sleep(120);
    await sEval(page, (root) => {
      const extBlock = root.querySelector('.finish-block[data-uid="p_exterior"]');
      const sw = extBlock.querySelector('[data-x-target="body"].int-swatch:not(.tbd-swatch)');
      if (!sw) throw new Error('no exterior body swatch');
      sw.scrollIntoView({ block: 'center' });
      sw.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      sw.click();
    });
    await sleep(280);
    let snap = await page.evaluate(() => window.__sssQuoteSnapshot());
    const extAfterColor = snap.projects.find((p) => p.type === 'exterior');
    const fenceAfterColor = snap.projects.find((p) => p.type === 'fence');
    if (!extAfterColor.selectedColor || extAfterColor.selectedColor.tbd) {
      fail('exterior color click did not stick: ' + JSON.stringify(extAfterColor.selectedColor));
    }
    if (fenceAfterColor.selectedColor && fenceAfterColor.selectedColor.name !== 'Cedar') {
      fail('fence color leaked: ' + JSON.stringify(fenceAfterColor.selectedColor));
    }

    await sEval(page, (root) => {
      const extBlock = root.querySelector('.finish-block[data-uid="p_exterior"]');
      const tbd = [...extBlock.querySelectorAll('[data-x-tbd="body"]')].pop();
      tbd.scrollIntoView({ block: 'center' });
      tbd.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      tbd.click();
    });
    await sleep(280);
    snap = await page.evaluate(() => window.__sssQuoteSnapshot());
    const extTbd = snap.projects.find((p) => p.type === 'exterior');
    const fenceTbd = snap.projects.find((p) => p.type === 'fence');
    if (!extTbd.selectedColor || !extTbd.selectedColor.tbd) fail('exterior TBD did not stick: ' + JSON.stringify(extTbd.selectedColor));
    if (fenceTbd.selectedColor && fenceTbd.selectedColor.name !== 'Cedar') fail('fence leaked after exterior TBD');
    const nextOn = await sEval(page, (root) => {
      const next = root.getElementById('stage7Next');
      return { disabled: !!(next && next.disabled), text: next && next.textContent.trim() };
    });
    if (nextOn.disabled) fail('Next should enable after exterior TBD: ' + JSON.stringify(nextOn));

    await sEval(page, (root) => {
      const extBlock = root.querySelector('.finish-block[data-uid="p_exterior"]');
      if (extBlock) extBlock.scrollIntoView({ block: 'start', inline: 'nearest' });
    });
    await sleep(150);
    const host = await page.$('sss-calculator');
    const extHandle = await host.evaluateHandle((c) =>
      c.shadowRoot.querySelector('.finish-block[data-uid="p_exterior"] .int-color-planner')
      || c.shadowRoot.querySelector('.finish-block[data-uid="p_exterior"]')
    );
    const extEl = extHandle.asElement();
    if (!extEl) fail('exterior planner handle missing');
    await extEl.screenshot({ path: path.join(MEDIA, 'exterior-color-working.png') });
    console.log('PASS exterior color', { color: extAfterColor.selectedColor, tbd: extTbd.selectedColor, nextOn });

    // Cabinet modes + TBD, stacked with Fence, apply-all off
    await loadQuote(page, [
      blankStain('fence', 1, { selectedColor: { name: 'Cedar', code: '', line: 'EXPERT Stain & Seal' } }),
      cabinetProject(2),
    ], 7);
    const clickCabMode = async (mode) => {
      await sEval(page, (root, m) => {
        const block = root.querySelector('.finish-block[data-uid="p_cabinet"]');
        const btn = block.querySelector('[data-cabc-mode="' + m + '"]');
        if (!btn) throw new Error('missing cabinet mode ' + m);
        btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
        btn.click();
      }, mode);
      await sleep(220);
      return page.evaluate(() => {
        const snap = window.__sssQuoteSnapshot();
        const cab = snap.projects.find((p) => p.type === 'cabinet');
        const fence = snap.projects.find((p) => p.type === 'fence');
        const root = document.querySelector('sss-calculator').shadowRoot;
        const block = root.querySelector('.finish-block[data-uid="p_cabinet"]');
        const titles = [...(block ? block.querySelectorAll('.int-sec-title') : [])].map((el) => el.textContent.trim());
        const on = [...(block ? block.querySelectorAll('.int-mode-card') : [])].map((b) => ({
          mode: b.getAttribute('data-cabc-mode'),
          on: b.classList.contains('on'),
        }));
        return { mode: cab.colorPlan && cab.colorPlan.mode, titles, on, fenceColor: fence.selectedColor };
      });
    };
    const cabSingle = await clickCabMode('single');
    if (cabSingle.mode !== 'single') fail('cabinet single did not stick: ' + JSON.stringify(cabSingle));
    if (cabSingle.fenceColor && cabSingle.fenceColor.name !== 'Cedar') fail('cabinet mode leaked onto fence');
    const cabTwo = await clickCabMode('twoTone');
    if (cabTwo.mode !== 'twoTone') fail('cabinet twoTone did not stick: ' + JSON.stringify(cabTwo));
    if (!cabTwo.titles.some((t) => /Island/i.test(t))) fail('two-tone island picker missing: ' + JSON.stringify(cabTwo.titles));
    await sEval(page, (root) => {
      const block = root.querySelector('.finish-block[data-uid="p_cabinet"]');
      const tbd = [...block.querySelectorAll('[data-x-tbd="main"]')].pop();
      tbd.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      tbd.click();
    });
    await sleep(220);
    const cabAfterTbd = await page.evaluate(() => window.__sssQuoteSnapshot());
    const cabPlan = cabAfterTbd.projects.find((p) => p.type === 'cabinet').colorPlan;
    if (!cabPlan.main || !(cabPlan.main.tbd || cabPlan.main.isTbd || /to be determined/i.test(cabPlan.main.name || ''))) {
      fail('cabinet TBD main missing: ' + JSON.stringify(cabPlan.main));
    }
    console.log('PASS cabinet modes+TBD', { single: cabSingle.mode, twoTone: cabTwo.mode });

    // Deck (other stain type besides fence) TBD chip still works per-project
    await loadQuote(page, [
      blankStain('fence', 1, { selectedColor: { name: 'Cedar', code: '', line: 'EXPERT Stain & Seal' } }),
      blankStain('deck', 2, { selectedColor: null }),
    ], 7);
    await sEval(page, (root) => {
      const deck = root.querySelector('.finish-block[data-uid="p_deck"]');
      const tbd = deck.querySelector('.tbd-swatch');
      tbd.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      tbd.click();
    });
    await sleep(220);
    snap = await page.evaluate(() => window.__sssQuoteSnapshot());
    const deckP = snap.projects.find((p) => p.type === 'deck');
    const fenceP = snap.projects.find((p) => p.type === 'fence');
    if (!deckP.selectedColor || !deckP.selectedColor.tbd) fail('deck TBD failed: ' + JSON.stringify(deckP.selectedColor));
    if (fenceP.selectedColor && fenceP.selectedColor.name !== 'Cedar') fail('deck TBD leaked onto fence');
    console.log('PASS deck TBD per-project');

    // 3. Chip rename: To Be Determined, last, dotted, not a banner
    await loadQuote(page, [blankStain('fence', 1, { selectedColor: null })], 7);
    const tbdUi = await sEval(page, (root) => {
      const grid = root.getElementById('colorGrid');
      const banner = grid.querySelector('.tbd-color-banner, .tbd-color-btn');
      const bannerShown = !!(banner && getComputedStyle(banner).display !== 'none');
      const chips = [...grid.querySelectorAll('.color-swatch')];
      const tbdIdx = chips.findIndex((c) => c.classList.contains('tbd-swatch'));
      const tbd = chips[tbdIdx];
      const chip = tbd && tbd.querySelector('.chip, .tbd-chip');
      const other = chips.find((c) => !c.classList.contains('tbd-swatch'));
      const otherChip = other && other.querySelector('.chip');
      const cs = tbd && getComputedStyle(tbd);
      const ccs = chip && getComputedStyle(chip);
      const tbdRect = tbd && tbd.getBoundingClientRect();
      const otherRect = other && other.getBoundingClientRect();
      return {
        bannerShown,
        tbdIdx,
        total: chips.length,
        name: tbd && tbd.textContent.replace(/\s+/g, ' ').trim(),
        border: cs && cs.borderTopStyle,
        chipBorder: ccs && ccs.borderTopStyle,
        chipH: chip && Math.round(chip.getBoundingClientRect().height),
        chipW: chip && Math.round(chip.getBoundingClientRect().width),
        otherH: otherChip && Math.round(otherChip.getBoundingClientRect().height),
        otherW: otherChip && Math.round(otherChip.getBoundingClientRect().width),
        swatchH: tbdRect && Math.round(tbdRect.height),
        otherSwatchH: otherRect && Math.round(otherRect.height),
      };
    });
    if (tbdUi.bannerShown) fail('TBD banner still visible');
    if (tbdUi.tbdIdx !== tbdUi.total - 1) fail('TBD chip must be last: ' + JSON.stringify(tbdUi));
    if (tbdUi.name !== 'To Be Determined') fail('TBD label exact mismatch: ' + JSON.stringify(tbdUi.name));
    if (tbdUi.border !== 'dotted' && tbdUi.chipBorder !== 'dotted') fail('TBD not dotted: ' + JSON.stringify(tbdUi));
    if (tbdUi.swatchH > (tbdUi.otherSwatchH || 0) * 1.5) fail('TBD chip much larger than neighbors: ' + JSON.stringify(tbdUi));
    await sEval(page, (root) => {
      const tbd = root.querySelector('.tbd-swatch');
      tbd.scrollIntoView({ block: 'center' });
    });
    await sleep(80);
    await page.screenshot({ path: path.join(MEDIA, 'tbd-to-be-determined.png'), fullPage: false });
    console.log('PASS TBD rename', tbdUi);

    if (leadHits.length) fail('POST /api/lead was attempted');
    console.log('ALL HARNESS CHECKS PASSED');
    console.log('MIXED_LINE_LIST');
    lines.forEach((l) => console.log(`${l.name}\t${l.unit_price_cents}`));
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
