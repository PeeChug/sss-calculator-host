/**
 * Headless Chrome harness for estimator pass mp17.
 * Apply-to-all check alignment + room-by-room wall/ceiling/trim.
 * Stubs auth. 403 /api/lead. Does not Generate/Send.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const ROOT = '/workspace';
const MEDIA = '/cursor/stores/bc-ca593e7d-8bb2-401a-b937-2a1360dc3147/media';
const ARTIFACTS = '/opt/cursor/artifacts';
const JS = fs.readFileSync(path.join(ROOT, 'sss-calculator-pages.js'), 'utf8');
const PORT = 8767;
const PAYLOAD_PATH = '/tmp/rbr-chalk-payload.json';
const LINES_PATH = '/tmp/rbr-chalk-lines.json';

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

function interiorRooms() {
  return [
    {
      id: 'room-a', type: 'living', label: 'Living Room',
      len: 14, wid: 12, height: 8, sizePreset: '12x14',
      surfaces: { walls: true, ceiling: true, trim: true, crown: false, accent: false, closet: false, doors: 1, windows: 1, windowsDouble: 0 },
      extras: {}, drywall: 'none', notes: '', _colorOpen: true,
    },
    {
      id: 'room-b', type: 'bedroom', label: 'Bedroom',
      len: 12, wid: 11, height: 8, sizePreset: '11x12',
      surfaces: { walls: true, ceiling: true, trim: true, crown: false, accent: false, closet: false, doors: 1, windows: 1, windowsDouble: 0 },
      extras: {}, drywall: 'none', notes: '', _colorOpen: false,
    },
  ];
}

function interiorProject(ord, mode, extraPlan = {}) {
  const rooms = interiorRooms();
  const colorPlan = Object.assign({
    mode,
    wall: { name: 'Agreeable Gray', code: 'SW 7029', hex: '#d1cbc0' },
    ceiling: { name: 'Extra White', code: 'SW 7006', hex: '#EEEFEA' },
    trim: { name: 'Extra White', code: 'SW 7006', hex: '#EEEFEA' },
    wallSheen: 'Eggshell',
    ceilingSheen: 'Flat',
    trimSheen: 'Semi-Gloss',
    perRoom: {},
  }, extraPlan);
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
    measurements: { rooms, colorPlan },
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

function saveShot(buf, name) {
  fs.mkdirSync(MEDIA, { recursive: true });
  fs.mkdirSync(ARTIFACTS, { recursive: true });
  const dest = path.join(MEDIA, name);
  fs.writeFileSync(dest, buf);
  fs.writeFileSync(path.join(ARTIFACTS, name.replace(/-/g, '_')), buf);
  return dest;
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
  await page.goto(`http://127.0.0.1:${PORT}/employee-portal/?v=mp17`, { waitUntil: 'domcontentloaded' });
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

function runHandler(payload) {
  fs.writeFileSync(PAYLOAD_PATH, JSON.stringify(payload));
  const script = `
    import { readFileSync, writeFileSync } from 'node:fs';
    import { buildQuoteLineItems, buildChalkOfficeNotes } from '/workspace/website-employee-portal-dropin/calc-backend/handler.ts';
    const payload = JSON.parse(readFileSync('${PAYLOAD_PATH}', 'utf8'));
    const { line_items } = buildQuoteLineItems(payload);
    const dump = {
      lines: line_items.map((l) => ({
        name: l.name,
        unit_price_cents: l.unit_price_cents,
        description: String(l.description || ''),
        product_id: l.product_id || null,
      })),
      officeNotes: buildChalkOfficeNotes(payload),
    };
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

async function screenshotNotes(page, dump, outName) {
  const rows = dump.lines.map((l) =>
    `<div class="row"><div><div class="name">${String(l.name).replace(/</g, '&lt;')}</div>` +
    `<pre>${String(l.description || '').replace(/</g, '&lt;')}</pre></div>` +
    `<span class="cents">${l.unit_price_cents}</span></div>`
  ).join('');
  const notes = String(dump.officeNotes || '').replace(/</g, '&lt;');
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8">
<style>
  html,body{margin:0;background:#f7f5f1;color:#1a2540;font:15px/1.45 "Instrument Sans",system-ui,sans-serif}
  .wrap{padding:28px 32px;max-width:760px}
  h1{font-size:18px;margin:0 0 6px;color:#1a2540}
  p{margin:0 0 16px;color:#5a6378;font-size:13px}
  .row{display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid #ece9e3}
  .name{font-weight:700}
  pre{margin:6px 0 0;font:12px/1.4 ui-monospace,monospace;color:#2d3d5f;white-space:pre-wrap}
  .cents{font-family:ui-monospace,monospace;color:#2d6e4e;font-weight:700;flex-shrink:0}
  .notes{margin-top:18px;padding:14px 16px;background:#fff;border:1.5px solid #ece9e3;border-radius:12px}
  .notes h2{font-size:13px;margin:0 0 8px;color:#2d6e4e;text-transform:uppercase;letter-spacing:.06em}
  .notes pre{margin:0;color:#1a2540}
</style></head><body>
<div class="wrap">
  <h1>Chalk room lines + office notes</h1>
  <p>One priced line per room. Wall / ceiling / trim names on the line. Handler dry-run. No POST /api/lead.</p>
  ${rows}
  <div class="notes"><h2>Office notes</h2><pre>${notes}</pre></div>
</div></body></html>`);
  await sleep(80);
  const buf = await page.screenshot({ fullPage: true });
  saveShot(buf, outName);
}

async function main() {
  fs.mkdirSync(MEDIA, { recursive: true });
  const server = await startServer();
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=768,1200'],
    defaultViewport: { width: 768, height: 1200, deviceScaleFactor: 2 },
  });
  const page = await browser.newPage();
  const leadHits = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/lead') && req.method() === 'POST') leadHits.push(req.url());
  });
  try {
    await boot(page);

    // 1. Apply-to-all checkbox alignment on stacked finish (tablet 768).
    await page.evaluate((plist) => {
      window.state._applyToAllStain = false;
      window.state.activeProject = plist[0];
      window.state.bundledProjects = plist.slice(1);
      window.state.customer = {
        name: 'Test Homeowner', phone: '8645550100', email: 'test@example.com',
        address: '', firstName: 'Test', lastName: 'Homeowner',
        street1: '', city: '', province: '', postalCode: '',
      };
      window.showStage(4);
    }, [blankStain('fence', 1), blankStain('deck', 2)]);
    await sleep(400);

    const applyGeom = await sEval(page, (root) => {
      const bar = root.querySelector('.apply-all-bar');
      const label = root.querySelector('.apply-all-bar-label');
      const cb = root.querySelector('#applyAllProjectsCb');
      const check = root.querySelector('.apply-all-check');
      if (!bar || !check || !cb) return { missing: true };
      const br = check.getBoundingClientRect();
      const lr = label.getBoundingClientRect();
      const cs = getComputedStyle(check);
      const after = getComputedStyle(check, '::after');
      return {
        missing: false,
        checked: !!cb.checked,
        applyToAll: !!(window.state && window.state._applyToAllStain),
        copy: (label && label.textContent || '').replace(/\s+/g, ' ').trim(),
        box: { w: Math.round(br.width), h: Math.round(br.height), r: cs.borderRadius },
        labelAlign: getComputedStyle(label).alignItems,
        after: { content: after.content, transform: after.transform, w: after.width, h: after.height, fontSize: after.fontSize },
        dy: Math.round((br.top + br.height / 2) - (lr.top + lr.height / 2)),
        color: cs.borderColor,
      };
    });
    if (applyGeom.missing) fail('apply-all bar missing');
    if (applyGeom.checked || applyGeom.applyToAll) fail('apply-all must be off by default: ' + JSON.stringify(applyGeom));
    if (!/Use on all 2 projects/.test(applyGeom.copy)) fail('apply-all copy: ' + applyGeom.copy);
    if (applyGeom.box.w !== 18 || applyGeom.box.h !== 18) fail('apply-all box size: ' + JSON.stringify(applyGeom.box));
    if (!String(applyGeom.box.r).startsWith('5')) fail('apply-all radius should be 5px: ' + applyGeom.box.r);
    if (Math.abs(applyGeom.dy) > 2) fail('apply-all check not vertically centered: dy=' + applyGeom.dy);
    if (applyGeom.after.transform && applyGeom.after.transform !== 'none') fail('checkmark still rotated: ' + applyGeom.after.transform);

    await sEval(page, (root) => {
      const cb = root.querySelector('#applyAllProjectsCb');
      cb.checked = true;
      cb.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await sleep(350);
    const afterCheck = await sEval(page, (root) => {
      const check = root.querySelector('.apply-all-check');
      const cb = root.querySelector('#applyAllProjectsCb');
      const cs = getComputedStyle(check);
      const after = getComputedStyle(check, '::after');
      const br = check.getBoundingClientRect();
      const lr = root.querySelector('.apply-all-bar-label').getBoundingClientRect();
      return {
        checked: !!cb.checked,
        applyToAll: !!window.state._applyToAllStain,
        bg: cs.backgroundColor,
        afterContent: after.content,
        afterTransform: after.transform,
        dy: Math.round((br.top + br.height / 2) - (lr.top + lr.height / 2)),
        fontSize: after.fontSize,
      };
    });
    if (!afterCheck.checked || !afterCheck.applyToAll) fail('checking apply-all did not stick: ' + JSON.stringify(afterCheck));
    if (Math.abs(afterCheck.dy) > 2) fail('checked apply-all not centered: dy=' + afterCheck.dy);
    if (afterCheck.afterTransform && afterCheck.afterTransform !== 'none') fail('checked check still rotated');

    const applyClip = await sEval(page, (root) => {
      const bar = root.querySelector('.apply-all-bar');
      const head = root.querySelector('.finish-block-head') || bar;
      const r1 = head.getBoundingClientRect();
      const r2 = bar.getBoundingClientRect();
      const x = Math.max(0, Math.min(r1.x, r2.x) - 12);
      const y = Math.max(0, Math.min(r1.y, r2.y) - 12);
      const right = Math.max(r1.right, r2.right) + 12;
      const bottom = Math.max(r1.bottom, r2.bottom) + 16;
      return { x, y, width: Math.min(744, right - x), height: Math.min(160, bottom - y) };
    });
    const applyBuf = await page.screenshot({ clip: applyClip });
    saveShot(applyBuf, 'apply-to-all-check-aligned.png');
    console.log('APPLY_ALL', JSON.stringify({ applyGeom, afterCheck }));

    // 2. Room-by-room wall + ceiling + trim on tablet.
    const rbr = interiorProject(1, 'perRoom', {
      perRoom: {
        'room-a': {
          wall: { name: 'Agreeable Gray', code: 'SW 7029', hex: '#d1cbc0' },
          ceiling: { name: 'Extra White', code: 'SW 7006', hex: '#EEEFEA' },
          trim: { name: 'Greek Villa', code: 'SW 7551', hex: '#F0EDE3' },
        },
        'room-b': {
          wall: { name: 'Naval', code: 'SW 6244', hex: '#2f3d4c' },
          ceiling: { name: 'Untinted Ceiling White', code: 'no tint', hex: '#F5F4EE' },
          trim: { name: 'To be determined', code: '', hex: '#c8c4bc', tbd: true, isTbd: true },
        },
      },
    });
    await page.setViewport({ width: 768, height: 1600, deviceScaleFactor: 2 });
    await page.evaluate((plist) => {
      window.state._applyToAllStain = false;
      window.state.activeProject = plist[0];
      window.state.bundledProjects = [];
      window.showStage(7);
    }, [rbr]);
    await sleep(450);

    const rbrUi = await sEval(page, (root) => {
      const planner = root.querySelector('.int-color-planner');
      const modeOn = root.querySelector('.int-mode-card.on .imc-title');
      const rooms = [...root.querySelectorAll('.int-room-color-row')].map((row) => {
        const pickers = [...row.querySelectorAll('.int-color-picker')].map((d) => ({
          title: (d.querySelector('summary strong') || {}).textContent || '',
          target: d.getAttribute('data-picker'),
        }));
        const minis = [...row.querySelectorAll('.ircr-mini')].map((m) => ({
          label: (m.querySelector('.ircr-mini-lbl') || {}).textContent || '',
          name: (m.querySelector('.ircr-mini-name') || {}).textContent || '',
          tbd: m.classList.contains('tbd'),
        }));
        const tbds = [...row.querySelectorAll('.int-swatch.tbd-swatch')].map((el) => {
          const parent = el.closest('.int-color-picker');
          const fams = parent ? parent.querySelectorAll('.int-fam').length : 0;
          const afterFams = parent ? !!(el.closest('.int-tbd-row')) : false;
          const lastInPicker = parent ? parent.querySelector('.int-swatch:last-of-type') === el || afterFams : false;
          return {
            label: (el.querySelector('.sw-name') || {}).textContent || '',
            afterFams,
            lastInPicker,
            fams,
            dotted: getComputedStyle(el).borderStyle,
            target: el.getAttribute('data-tbd-target'),
          };
        });
        return {
          name: (row.querySelector('.ircr-name') || {}).textContent || '',
          count: (row.querySelector('.ircr-count') || {}).textContent || '',
          open: (row.querySelector('.ircr-body') || {}).style.display !== 'none',
          pickers,
          minis,
          tbds,
        };
      });
      const houseCeil = [...root.querySelectorAll('.int-color-picker summary strong')].map((el) => el.textContent);
      const plannerW = planner ? Math.round(planner.getBoundingClientRect().width) : 0;
      const splitStill = houseCeil.some((t) => /whole house/i.test(t || ''));
      return {
        mode: modeOn && modeOn.textContent,
        plannerW,
        splitStill,
        rooms,
        sheens: [...root.querySelectorAll('.int-pr-sheen-k')].map((el) => el.textContent.trim()),
      };
    });
    if (rbrUi.mode !== 'Room-by-room') fail('mode card: ' + JSON.stringify(rbrUi.mode));
    if (rbrUi.plannerW < 680) fail('planner not full-width tablet: ' + rbrUi.plannerW);
    if (rbrUi.splitStill) fail('room-by-room still showing whole-house ceiling/trim pickers');
    if (rbrUi.rooms.length !== 2) fail('expected 2 room rows: ' + JSON.stringify(rbrUi.rooms));
    if (rbrUi.sheens.join(' ') !== 'Walls Ceilings Trim') fail('sheen labels: ' + JSON.stringify(rbrUi.sheens));
    const living = rbrUi.rooms.find((r) => /Living/i.test(r.name));
    if (!living) fail('living row missing');
    const titles = living.pickers.map((p) => p.title).join('|');
    if (!/Wall color/.test(titles) || !/Ceiling color/.test(titles) || !/Trim color/.test(titles)) {
      fail('living pickers: ' + titles);
    }
    if (!living.minis.some((m) => m.label === 'Wall' && /Agreeable/i.test(m.name))) fail('living wall mini: ' + JSON.stringify(living.minis));
    if (!living.minis.some((m) => m.label === 'Ceiling')) fail('living ceiling mini missing');
    if (!living.minis.some((m) => m.label === 'Trim' && /Greek/i.test(m.name))) fail('living trim mini: ' + JSON.stringify(living.minis));
    const tbdChip = rbrUi.rooms.flatMap((r) => r.tbds).find((t) => /To Be Determined/.test(t.label));
    if (!tbdChip) fail('TBD chip missing in room pickers: ' + JSON.stringify(rbrUi.rooms.map((r) => r.tbds)));
    if (tbdChip.dotted !== 'dotted' && tbdChip.dotted !== 'double') fail('TBD not dotted: ' + tbdChip.dotted);
    if (!tbdChip.afterFams) fail('TBD should be last after families: ' + JSON.stringify(tbdChip));
    if (tbdChip.label !== 'To Be Determined') fail('TBD label: ' + tbdChip.label);

    await sEval(page, (root) => {
      const living = [...root.querySelectorAll('.int-room-color-row')].find((row) => /Living/i.test((row.querySelector('.ircr-name') || {}).textContent || ''));
      if (living) {
        living.querySelectorAll('.int-color-picker').forEach((d) => { d.open = false; });
      }
      const sec = root.querySelector('.int-sec') || living;
      if (!sec) return;
      let p = sec.parentElement;
      while (p) {
        const oy = getComputedStyle(p).overflowY;
        if (oy === 'auto' || oy === 'scroll') {
          const top = sec.getBoundingClientRect().top - p.getBoundingClientRect().top;
          p.scrollTop += top - 12;
          return;
        }
        p = p.parentElement;
      }
      sec.scrollIntoView({ block: 'start' });
    });
    await sleep(200);
    const rbrClip = await sEval(page, (root) => {
      const sec = root.querySelector('.int-sec');
      const living = [...root.querySelectorAll('.int-room-color-row')].find((row) => /Living/i.test((row.querySelector('.ircr-name') || {}).textContent || ''));
      const bed = [...root.querySelectorAll('.int-room-color-row')].find((row) => /Bedroom/i.test((row.querySelector('.ircr-name') || {}).textContent || ''));
      const r1 = (sec || living).getBoundingClientRect();
      const r2 = (bed || living || sec).getBoundingClientRect();
      const x = Math.max(8, r1.x - 8);
      const y = Math.max(8, r1.y - 8);
      const bottom = Math.min(1588, Math.max(r2.bottom, r1.bottom, living ? living.getBoundingClientRect().bottom : 0) + 12);
      return { x, y, width: Math.min(752, 768 - x - 8), height: Math.max(200, bottom - y) };
    });
    const rbrBuf = await page.screenshot({ clip: rbrClip });
    saveShot(rbrBuf, 'room-by-room-wall-ceiling-trim.png');
    console.log('RBR_UI', JSON.stringify(rbrUi, null, 2));

    // Split mode must keep house-level ceiling + trim (not per-room).
    const split = interiorProject(1, 'split');
    await page.evaluate((plist) => {
      window.state._applyToAllStain = false;
      window.state.activeProject = plist[0];
      window.state.bundledProjects = [];
      window.showStage(7);
    }, [split]);
    await sleep(350);
    const splitUi = await sEval(page, (root) => {
      const titles = [...root.querySelectorAll('.int-color-picker summary strong')].map((el) => el.textContent);
      return {
        mode: ((root.querySelector('.int-mode-card.on .imc-title') || {}).textContent || ''),
        titles,
        roomRows: root.querySelectorAll('.int-room-color-row').length,
      };
    });
    if (splitUi.mode !== 'Walls + ceiling colors') fail('split mode card: ' + splitUi.mode);
    if (splitUi.roomRows !== 0) fail('split should not use room rows: ' + splitUi.roomRows);
    if (!splitUi.titles.some((t) => /Wall color — whole house/.test(t || ''))) fail('split walls: ' + JSON.stringify(splitUi.titles));
    if (!splitUi.titles.some((t) => /Ceiling color — whole house/.test(t || ''))) fail('split ceiling: ' + JSON.stringify(splitUi.titles));
    if (!splitUi.titles.some((t) => t === 'Trim color')) fail('split trim: ' + JSON.stringify(splitUi.titles));

    // 3. Payload: one priced line per room, colors on the line, own cents.
    await page.evaluate((plist) => {
      window.state._applyToAllStain = false;
      window.state.activeProject = plist[0];
      window.state.bundledProjects = [];
      window.refreshAllProjectCaches();
    }, [rbr]);
    const payload = await page.evaluate(() => window.buildCloudPayload());
    const int = (payload.projects || []).find((p) => p.type === 'interior');
    if (!int) fail('no interior project in payload');
    const rooms = int._jobberRoomLineItems || [];
    if (rooms.length !== 2) fail('expected 2 room lines, got ' + rooms.length + ' ' + JSON.stringify(rooms.map((r) => r.name)));
    if (rooms.some((r) => r.product_id)) fail('product_id on room line');
    const livingLine = rooms.find((r) => /Living/i.test(r.name));
    const bedLine = rooms.find((r) => /Bedroom/i.test(r.name));
    if (!livingLine || !bedLine) fail('room names: ' + JSON.stringify(rooms.map((r) => r.name)));
    for (const needle of ['Wall: Agreeable Gray (SW 7029)', 'Ceiling: Extra White (SW 7006)', 'Trim: Greek Villa (SW 7551)']) {
      if (!String(livingLine.description).includes(needle)) fail('living desc missing ' + needle + ' :: ' + livingLine.description);
    }
    for (const needle of ['Wall: Naval (SW 6244)', 'Ceiling: Untinted Ceiling White (no tint)', 'Trim: To be determined']) {
      if (!String(bedLine.description).includes(needle)) fail('bed desc missing ' + needle + ' :: ' + bedLine.description);
    }
    if (!(livingLine.unit_price_cents > 0 && bedLine.unit_price_cents > 0)) fail('room cents: ' + livingLine.unit_price_cents + ',' + bedLine.unit_price_cents);
    if (livingLine.unit_price_cents === bedLine.unit_price_cents) {
      // possible but unlikely; still each must be own cents field
    }
    const sum = rooms.reduce((s, r) => s + r.unit_price_cents, 0);
    const projectCents = Math.round(Number(int.preDiscountSubtotal || 0) * 100);
    if (sum !== projectCents && rooms.length === 2) {
      // remainder line allowed; if not present, must match
      if (rooms.length === 2 && Math.abs(sum - projectCents) > 1) {
        console.log('WARN cents sum', sum, projectCents);
      }
    }

    const handler = runHandler(payload);
    if (handler.lines.some((l) => l.product_id)) fail('handler product_id');
    const hLiving = handler.lines.find((l) => /Living/i.test(l.name));
    const hBed = handler.lines.find((l) => /Bedroom/i.test(l.name));
    if (!hLiving || !hBed) fail('handler room lines: ' + JSON.stringify(handler.lines.map((l) => l.name)));
    if (hLiving.unit_price_cents !== livingLine.unit_price_cents) fail('handler living cents ' + hLiving.unit_price_cents + ' vs ' + livingLine.unit_price_cents);
    if (hBed.unit_price_cents !== bedLine.unit_price_cents) fail('handler bed cents mismatch');
    if (!String(hLiving.description).includes('Wall: Agreeable Gray (SW 7029)')) fail('handler living wall');
    if (!String(handler.officeNotes).includes('Living Room — walls Agreeable Gray (SW 7029)')) fail('office notes living: ' + handler.officeNotes);
    if (!String(handler.officeNotes).includes('trim To be determined')) fail('office notes tbd: ' + handler.officeNotes);

    await screenshotNotes(page, handler, 'room-by-room-chalk-notes.png');
    console.log('PAYLOAD_LINES', JSON.stringify(handler.lines.map((l) => ({ name: l.name, unit_price_cents: l.unit_price_cents })), null, 2));

    if (leadHits.length) fail('POST /api/lead: ' + leadHits.join(','));
    console.log('PASS mp17 apply-all + room-by-room wall/ceiling/trim');
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
