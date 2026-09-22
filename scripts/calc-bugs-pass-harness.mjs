/**
 * Headless Chrome harness for estimator pass mp15.
 * Stubs auth. 403 /api/lead. Does not Generate/Send.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = '/workspace';
const MEDIA = '/cursor/stores/bc-ca593e7d-8bb2-401a-b937-2a1360dc3147/media';
const JS = fs.readFileSync(path.join(ROOT, 'sss-calculator-pages.js'), 'utf8');
const PORT = 8766;

const HTML = `<!doctype html><html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>calc harness</title>
<style>html,body{margin:0;background:#f7f5f1}sss-calculator{display:block;min-height:100vh}</style>
</head><body>
<sss-calculator></sss-calculator>
<script>${JS}</script>
</body></html>`;

const REAL_ADDR = {
  source: 'places',
  street1: '100 N Main St',
  city: 'Greenville',
  province: 'SC',
  postalCode: '29601',
  label: '100 N Main St, Greenville, SC 29601',
};

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
    if (url.includes('searchAddresses')) {
      return req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, nodes: [REAL_ADDR] }),
      });
    }
    if (url.includes('listQuotes') || url.includes('/_functions/')) {
      return req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, quotes: [] }) });
    }
    req.continue();
  });
  await page.goto(`http://127.0.0.1:${PORT}/employee-portal/?v=mp15`, { waitUntil: 'domcontentloaded' });
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
  await sleep(280);
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

    // 1. Property address autofill — real Greenville street
    await loadQuote(page, [blankStain('fence', 1)], 1);
    await sEval(page, (root) => {
      const inp = root.getElementById('custAddress');
      inp.value = '100 N Main';
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await sleep(500);
    const addrUi = await sEval(page, (root) => {
      const box = root.getElementById('addrSearchResults');
      const rows = [...(box ? box.querySelectorAll('.addr-result') : [])].map((r) => r.textContent.trim());
      return { display: box && box.style.display, rows, html: box && box.innerHTML };
    });
    if (!addrUi.rows.length) fail('address suggestions missing: ' + JSON.stringify(addrUi));
    if (!addrUi.rows.some((r) => /100 N Main St/.test(r))) fail('real address not listed: ' + JSON.stringify(addrUi));
    await sEval(page, (root) => {
      const row = root.querySelector('.addr-result');
      row.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    });
    await sleep(150);
    const cust = await page.evaluate(() => window.__sssQuoteSnapshot().customer);
    if (cust.street1 !== '100 N Main St') fail('street1 not filled: ' + JSON.stringify(cust));
    if (cust.city !== 'Greenville' || cust.province !== 'SC' || cust.postalCode !== '29601') {
      fail('city/state/zip not filled: ' + JSON.stringify(cust));
    }
    await sEval(page, (root) => {
      const field = root.querySelector('.addr-search');
      field.scrollIntoView({ block: 'center' });
    });
    await sleep(80);
    await page.screenshot({ path: path.join(MEDIA, 'address-autofill.png'), fullPage: false });
    console.log('PASS address autofill', cust);

    // 2. Compact apply-to-all
    await loadQuote(page, [blankStain('fence', 1), blankStain('deck', 2)], 6);
    const applyUi = await sEval(page, (root) => {
      const bar = root.querySelector('.apply-all-bar');
      const cb = root.querySelector('#applyAllProjectsCb');
      const check = root.querySelector('.apply-all-check');
      const text = bar && bar.textContent.replace(/\s+/g, ' ').trim();
      const cs = bar && getComputedStyle(bar);
      const ccs = check && getComputedStyle(check);
      const br = bar && bar.getBoundingClientRect();
      return {
        text,
        checked: !!(cb && cb.checked),
        insideStack: !!(bar && bar.parentElement && bar.parentElement.classList.contains('finish-stack')),
        firstChild: !!(bar && bar.parentElement && bar.parentElement.firstElementChild === bar),
        padTop: cs && cs.paddingTop,
        bg: cs && cs.backgroundColor,
        radius: ccs && ccs.borderRadius,
        h: br && Math.round(br.height),
      };
    });
    if (applyUi.checked) fail('apply-to-all must start off');
    if (!applyUi.insideStack || !applyUi.firstChild) fail('apply-all must sit in stacked chrome: ' + JSON.stringify(applyUi));
    if (applyUi.h > 44) fail('apply-all still too tall: ' + JSON.stringify(applyUi));
    if (!/Use on all 2 projects/i.test(applyUi.text)) fail('compact copy missing: ' + applyUi.text);
    await sEval(page, (root) => {
      const bar = root.querySelector('.apply-all-bar');
      bar.scrollIntoView({ block: 'start' });
    });
    await sleep(80);
    await page.screenshot({ path: path.join(MEDIA, 'apply-to-all-compact.png'), fullPage: false });
    console.log('PASS compact apply-to-all', applyUi);

    // 3. HOA brand + transparency enables Next (no product name / required color)
    await loadQuote(page, [blankStain('fence', 1, { productType: null, productConfirmed: false, tierConfirmed: false })], 5);
    await sEval(page, (root) => {
      const card = root.querySelector('.product-choice-card[data-product="hoa"]');
      card.click();
    });
    await sleep(200);
    const hoaMid = await sEval(page, (root) => {
      const brand = root.getElementById('hoaBrand');
      const trans = root.getElementById('hoaTransparency');
      const next = root.getElementById('stage5Next');
      brand.value = brand.options[1].value;
      brand.dispatchEvent(new Event('change', { bubbles: true }));
      return {
        brand: brand.value,
        nextAfterBrand: next.disabled,
        transOpts: [...trans.options].map((o) => o.value).filter(Boolean),
      };
    });
    if (!hoaMid.nextAfterBrand) fail('Next should stay disabled with brand only');
    const hoaDone = await sEval(page, (root) => {
      const trans = root.getElementById('hoaTransparency');
      const color = root.getElementById('hoaColor');
      const name = root.getElementById('hoaProductName');
      const next = root.getElementById('stage5Next');
      trans.value = trans.options[1].value;
      trans.dispatchEvent(new Event('change', { bubbles: true }));
      color.value = '';
      name.value = '';
      return {
        brand: root.getElementById('hoaBrand').value,
        transparency: trans.value,
        color: color.value,
        productName: name.value,
        nextDisabled: next.disabled,
        validate: window.validateStage(5),
      };
    });
    if (hoaDone.nextDisabled) fail('Next should enable with brand + transparency: ' + JSON.stringify(hoaDone));
    if (!hoaDone.validate) fail('validateStage(5) should pass without HOA color: ' + JSON.stringify(hoaDone));
    const hoaSnap = await page.evaluate(() => window.__sssQuoteSnapshot());
    if (!hoaSnap.projects[0].hoa.brand || !hoaSnap.projects[0].hoa.transparency) {
      fail('HOA payload missing brand/transparency: ' + JSON.stringify(hoaSnap.projects[0].hoa));
    }
    if (hoaSnap.projects[0].hoa.color) fail('test required empty color, got ' + hoaSnap.projects[0].hoa.color);
    await sEval(page, (root) => {
      root.getElementById('hoaPanel').scrollIntoView({ block: 'center' });
    });
    await sleep(80);
    await page.screenshot({ path: path.join(MEDIA, 'hoa-next-enabled.png'), fullPage: false });
    console.log('PASS HOA Next', hoaDone);

    // 4. TBD dotted chip among colors, not first, not a banner
    await loadQuote(page, [blankStain('fence', 1, { productType: 'oil', selectedColor: null })], 7);
    const tbdUi = await sEval(page, (root) => {
      const grid = root.getElementById('colorGrid');
      const banner = grid.querySelector('.tbd-color-banner, .tbd-color-btn');
      const bannerShown = !!(banner && getComputedStyle(banner).display !== 'none');
      const chips = [...grid.querySelectorAll('.color-swatch')];
      const tbdIdx = chips.findIndex((c) => c.classList.contains('tbd-swatch'));
      const tbd = chips[tbdIdx];
      const chip = tbd && tbd.querySelector('.chip');
      const cs = tbd && getComputedStyle(tbd);
      const ccs = chip && getComputedStyle(chip);
      tbd.click();
      return {
        bannerShown,
        tbdIdx,
        total: chips.length,
        name: tbd && tbd.textContent.trim(),
        border: cs && cs.borderTopStyle,
        chipBorder: ccs && ccs.borderTopStyle,
      };
    });
    if (tbdUi.bannerShown) fail('TBD banner still visible');
    if (tbdUi.tbdIdx < 1) fail('TBD chip must not be first: ' + JSON.stringify(tbdUi));
    if (!/Pick on site/i.test(tbdUi.name)) fail('TBD not reworded: ' + tbdUi.name);
    if (tbdUi.border !== 'dotted' && tbdUi.chipBorder !== 'dotted') fail('TBD not dotted: ' + JSON.stringify(tbdUi));
    const tbdSnap = await page.evaluate(() => window.__sssQuoteSnapshot());
    if (!tbdSnap.projects[0].selectedColor || !tbdSnap.projects[0].selectedColor.tbd) {
      fail('TBD did not persist: ' + JSON.stringify(tbdSnap.projects[0].selectedColor));
    }
    await sEval(page, (root) => {
      const tbd = root.querySelector('.tbd-swatch');
      tbd.scrollIntoView({ block: 'center' });
    });
    await sleep(80);
    await page.screenshot({ path: path.join(MEDIA, 'tbd-dotted-chip.png'), fullPage: false });
    console.log('PASS TBD dotted chip', tbdUi);

    // 5. Interior mode buttons
    await loadQuote(page, [interiorProject(1)], 7);
    const clickMode = async (mode) => {
      await sEval(page, (root, m) => {
        const btn = root.querySelector('[data-color-mode="' + m + '"]');
        if (!btn) throw new Error('missing mode ' + m);
        btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
        btn.click();
      }, mode);
      await sleep(220);
      return page.evaluate(() => {
        const snap = window.__sssQuoteSnapshot();
        const p = snap.projects.find((x) => x.type === 'interior') || snap.projects[0];
        const root = document.querySelector('sss-calculator').shadowRoot;
        const titles = [...root.querySelectorAll('.int-color-picker summary strong, .int-sec-title')].map((el) => el.textContent.trim());
        const on = [...root.querySelectorAll('.int-mode-card')].map((b) => ({
          mode: b.getAttribute('data-color-mode'),
          on: b.classList.contains('on'),
        }));
        return { mode: p.colorPlan && p.colorPlan.mode, titles, on, payload: p.colorPlan };
      });
    };
    const single = await clickMode('single');
    if (single.mode !== 'single') fail('single mode did not stick: ' + JSON.stringify(single));
    if (!single.titles.some((t) => /walls & ceilings|One color for walls/i.test(t))) {
      fail('single pickers missing: ' + JSON.stringify(single.titles));
    }
    const split = await clickMode('split');
    if (split.mode !== 'split') fail('split mode did not stick: ' + JSON.stringify(split));
    if (!split.titles.some((t) => /Wall color/i.test(t)) || !split.titles.some((t) => /Ceiling color/i.test(t))) {
      fail('split pickers missing: ' + JSON.stringify(split.titles));
    }
    const perRoom = await clickMode('perRoom');
    if (perRoom.mode !== 'perRoom') fail('perRoom mode did not stick: ' + JSON.stringify(perRoom));
    if (!perRoom.titles.some((t) => /room by room/i.test(t))) fail('perRoom pickers missing: ' + JSON.stringify(perRoom.titles));
    await sEval(page, (root) => {
      const planner = root.querySelector('.int-color-planner');
      planner.scrollIntoView({ block: 'start' });
    });
    await sleep(80);
    const plannerBox = await sEval(page, (root) => {
      const planner = root.querySelector('.int-color-planner');
      const r = planner.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, 1100), hostW: root.host ? root.host.getBoundingClientRect().width : 768 };
    });
    if (plannerBox.width < 500) fail('planner not full width: ' + JSON.stringify(plannerBox));
    await page.screenshot({
      path: path.join(MEDIA, 'interior-modes-working.png'),
      clip: {
        x: Math.max(0, plannerBox.x - 8),
        y: Math.max(0, plannerBox.y - 8),
        width: Math.min(768, plannerBox.width + 16),
        height: Math.min(1200, plannerBox.height + 16),
      },
    });
    console.log('PASS interior modes', { single: single.mode, split: split.mode, perRoom: perRoom.mode, titles: perRoom.titles });

    // Regression: Fence + Deck tier isolation + apply-all copy
    await loadQuote(page, [blankStain('fence', 1), blankStain('deck', 2)], 6);
    await sEval(page, (root) => {
      const fence = root.querySelector('.finish-block[data-uid="p_fence"]');
      fence.querySelector('.tier-card[data-tier="essential"]').click();
    });
    await sleep(200);
    let snap = await page.evaluate(() => window.__sssQuoteSnapshot());
    if (snap.projects.find((p) => p.type === 'fence').tier !== 'essential') fail('Fence tier');
    if (snap.projects.find((p) => p.type === 'deck').tier !== 'performance') fail('Deck leaked');
    await sEval(page, (root) => {
      const cb = root.querySelector('#applyAllProjectsCb');
      cb.checked = true;
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await sleep(200);
    snap = await page.evaluate(() => window.__sssQuoteSnapshot());
    if (snap.projects.find((p) => p.type === 'deck').tier !== 'essential') fail('apply-all copy failed');
    console.log('PASS apply-to-all still copies');

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
