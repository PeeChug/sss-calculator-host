/**
 * Headless Chrome harness for per-project tier/color and interior tablet color UI.
 * Stubs auth. 403 /api/lead. Does not Generate/Send.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = '/workspace';
const MEDIA = '/cursor/stores/bc-ca593e7d-8bb2-401a-b937-2a1360dc3147/media';
const JS = fs.readFileSync(path.join(ROOT, 'sss-calculator-pages.js'), 'utf8');
const PORT = 8765;

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
  return Object.assign({
    type,
    measurements: type === 'fence'
      ? { linearft: 180, height: 6, style: 'privacy' }
      : { flat: 320, rail: 40, stairs: 0 },
    condition: 'soft_wash',
    productType: 'oil',
    tier: 'performance',
    conditionConfirmed: true,
    productConfirmed: true,
    tierConfirmed: true,
    woodAge: 'weathered',
    selectedColor: null,
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
    selectedColor: null,
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
    },
  };
}

async function shadow(page) {
  return page.$('sss-calculator');
}

async function sEval(page, fn, ...args) {
  return page.$eval('sss-calculator', (el, fnSrc, argList) => {
    const fn2 = eval('(' + fnSrc + ')');
    return fn2(el.shadowRoot, ...argList);
  }, fn.toString(), args);
}

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
  await page.goto(`http://127.0.0.1:${PORT}/employee-portal/?v=mp14`, { waitUntil: 'domcontentloaded' });
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
    window.state.customer = { name: 'Test Homeowner', phone: '8645550100', email: '', address: '1 Test St', firstName: 'Test', lastName: 'Homeowner' };
    window.showStage(stageN);
  }, projects, stage);
  await new Promise((r) => setTimeout(r, 250));
}

function fail(msg) { throw new Error(msg); }

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

    // --- Fence + Deck: change Fence tier only ---
    await loadQuote(page, [blankStain('fence', 1), blankStain('deck', 2)], 6);
    let snap = await page.evaluate(() => window.__sssQuoteSnapshot());
    if (snap.applyToAll) fail('apply-to-all must start off');
    const cbOn = await sEval(page, (root) => {
      const cb = root.querySelector('#applyAllProjectsCb');
      return !!(cb && cb.checked);
    });
    if (cbOn) fail('apply-to-all checkbox must be unchecked');

    await sEval(page, (root) => {
      const fence = root.querySelector('.finish-block[data-uid="p_fence"]');
      const card = fence.querySelector('.tier-card[data-tier="essential"]');
      card.click();
    });
    await new Promise((r) => setTimeout(r, 200));
    snap = await page.evaluate(() => window.__sssQuoteSnapshot());
    const fence = snap.projects.find((p) => p.type === 'fence');
    const deck = snap.projects.find((p) => p.type === 'deck');
    if (fence.tier !== 'essential') fail('Fence tier should be essential, got ' + fence.tier);
    if (deck.tier !== 'performance') fail('Deck tier leaked, got ' + deck.tier);
    await page.screenshot({ path: path.join(MEDIA, 'tier-per-project.png'), fullPage: true });
    console.log('PASS Fence tier only; Deck unchanged');

    // Apply-to-all still copies
    await sEval(page, (root) => {
      const cb = root.querySelector('#applyAllProjectsCb');
      cb.checked = true;
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await new Promise((r) => setTimeout(r, 200));
    snap = await page.evaluate(() => window.__sssQuoteSnapshot());
    if (!snap.applyToAll) fail('apply-to-all should turn on');
    const deck2 = snap.projects.find((p) => p.type === 'deck');
    if (deck2.tier !== 'essential') fail('apply-to-all should copy Fence essential onto Deck, got ' + deck2.tier);
    console.log('PASS apply-to-all copies tier');

    // --- Fence + Interior: Interior color/TBD only ---
    await loadQuote(page, [blankStain('fence', 1, { selectedColor: { name: 'Cedar', line: 'EXPERT' } }), interiorProject(2)], 7);
    await sEval(page, (root) => {
      const block = root.querySelector('.finish-block[data-uid="p_interior"]');
      const tbd = block.querySelector('[data-int-tbd-all]');
      tbd.click();
    });
    await new Promise((r) => setTimeout(r, 250));
    snap = await page.evaluate(() => window.__sssQuoteSnapshot());
    const fenceC = snap.projects.find((p) => p.type === 'fence');
    const intC = snap.projects.find((p) => p.type === 'interior');
    if (fenceC.selectedColor?.name !== 'Cedar') fail('Fence color leaked, got ' + JSON.stringify(fenceC.selectedColor));
    if (!intC.selectedColor?.tbd && intC.selectedColor?.name !== 'To be determined') {
      fail('Interior TBD did not stick: ' + JSON.stringify(intC.selectedColor));
    }
    await page.screenshot({ path: path.join(MEDIA, 'color-per-project.png'), fullPage: true });
    console.log('PASS Interior TBD only; Fence color unchanged');

    await sEval(page, (root) => {
      const block = root.querySelector('.finish-block[data-uid="p_interior"]');
      block.scrollIntoView({ block: 'start' });
    });
    await new Promise((r) => setTimeout(r, 150));
    const intBox = await sEval(page, (root) => {
      const block = root.querySelector('.finish-block[data-uid="p_interior"]');
      const r = block.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, 1180) };
    });
    await page.screenshot({
      path: path.join(MEDIA, 'interior-color-tablet.png'),
      clip: {
        x: Math.max(0, intBox.x - 8),
        y: Math.max(0, intBox.y - 8),
        width: Math.min(768, intBox.width + 16),
        height: Math.min(1200, intBox.height + 16),
      },
    });
    const layout = await sEval(page, (root) => {
      const block = root.querySelector('.finish-block[data-uid="p_interior"]');
      const planner = block.querySelector('.int-color-planner');
      const banner = block.querySelector('.tbd-color-banner');
      const mode = block.querySelector('.int-mode-grid');
      const host = block.querySelector('#colorGrid') || block.querySelector('[data-fid="colorGrid"]') || block.querySelector('[id$="_colorGrid"]');
      const pr = planner.getBoundingClientRect();
      const br = banner.getBoundingClientRect();
      const mr = mode.getBoundingClientRect();
      const hr = host.getBoundingClientRect();
      const cs = getComputedStyle(host);
      return {
        plannerW: Math.round(pr.width),
        bannerW: Math.round(br.width),
        bannerH: Math.round(br.height),
        modeW: Math.round(mr.width),
        hostW: Math.round(hr.width),
        hostDisplay: cs.display,
        hostCols: cs.gridTemplateColumns,
        crushed: pr.width < 500 || br.height < 40 || br.width < 500,
      };
    });
    if (layout.crushed) fail('Interior color UI crushed on tablet: ' + JSON.stringify(layout));
    console.log('PASS Interior color tablet layout', layout);

    // Multi-room payload cents
    const payload = await page.evaluate(() => {
      const intP = window.quoteProjects().find((p) => p.type === 'interior');
      const rooms = window.buildInteriorRoomLineItems(intP, 0);
      const sum = rooms.reduce((s, r) => s + r.unit_price_cents, 0);
      return {
        lines: rooms.map((r) => ({ name: r.name, cents: r.unit_price_cents, dollars: r.totalPrice })),
        sum,
        unique: new Set(rooms.map((r) => r.unit_price_cents)).size,
      };
    });
    if (payload.lines.length < 2) fail('expected 2+ interior room lines');
    if (payload.lines.some((l) => !l.cents)) fail('every room line needs cents: ' + JSON.stringify(payload));
    if (payload.unique === 1 && payload.lines.length > 1) {
      // identical prices can happen for identical rooms; still must not be 0
    }
    const firstIsTotal = payload.lines[0].cents === payload.sum && payload.lines.slice(1).every((l) => l.cents === 0);
    if (firstIsTotal) fail('project total dumped on line 1: ' + JSON.stringify(payload));
    console.log('PASS multi-room payload', payload);

    // Paint payload screenshot overlay
    await page.setViewport({ width: 900, height: 700 });
    await page.setContent(`<!doctype html><html><body style="font-family:Instrument Sans,system-ui;background:#1a2540;color:#f7f5f1;padding:32px">
      <h1 style="margin:0 0 8px;font-size:22px">Chalk line items (dry-run)</h1>
      <p style="opacity:.8;margin:0 0 18px">Each paint room has its own cents. Stain stays one line. No product_id.</p>
      <table style="width:100%;border-collapse:collapse;background:#fff;color:#1a2540;border-radius:12px;overflow:hidden">
        <tr style="background:#2d6e4e;color:#fff"><th style="text-align:left;padding:10px 12px">Line</th><th style="text-align:right;padding:10px 12px">unit_price_cents</th></tr>
        ${payload.lines.map((l) => `<tr><td style="padding:10px 12px;border-top:1px solid #ece9e3">${l.name}</td><td style="padding:10px 12px;border-top:1px solid #ece9e3;text-align:right;font-variant-numeric:tabular-nums">${l.cents}</td></tr>`).join('')}
        <tr><td style="padding:10px 12px;border-top:2px solid #1a2540;font-weight:700">Sum</td><td style="padding:10px 12px;border-top:2px solid #1a2540;text-align:right;font-weight:700">${payload.sum}</td></tr>
      </table>
    </body></html>`);
    await page.screenshot({ path: path.join(MEDIA, 'chalk-line-item-prices.png') });

    if (leadHits.length) fail('POST /api/lead was attempted');
    console.log('ALL HARNESS CHECKS PASSED');
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
