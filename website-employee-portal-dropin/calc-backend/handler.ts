/**
 * Native Cloudflare backend for the Pages employee calc. Does not call live Wix
 * or Jobber: quotes are pushed over HTTP to ChalkCRM (`CHALK_API_BASE`) as custom
 * line items only — name, description, quantity, unit, and calc prices in
 * `unit_price_cents`. Never send a price-book `product_id`.
 */
export interface CalcEnv {
  CALC_DB: D1Database;
  CALC_PHOTOS: R2Bucket;
  CHALK_API_KEY?: string;
  AUTH_SECRET?: string;
  CHALK_API_BASE?: string;
}

type Json = Record<string, unknown>;

const CHALK_DEFAULT = 'https://app.chalkcrm.com';

function json(data: unknown, status = 200, extra?: HeadersInit): Response {
  const headers = new Headers(extra);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', 'private, no-store');
  return new Response(JSON.stringify(data), { status, headers });
}

function nowIso(): string {
  return new Date().toISOString();
}

function id(prefix: string): string {
  return prefix + '_' + crypto.randomUUID().replace(/-/g, '');
}

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashPin(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    // Workers WebCrypto caps PBKDF2 at 100_000 iterations.
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
    key,
    256,
  );
  return hex(bits);
}

async function hmacSign(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
}

function cookieToken(request: Request): string | null {
  const raw = request.headers.get('Cookie') || '';
  for (const part of raw.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith('sss_auth_token=')) {
      try {
        return decodeURIComponent(trimmed.slice('sss_auth_token='.length));
      } catch {
        return trimmed.slice('sss_auth_token='.length);
      }
    }
  }
  return null;
}

function bearerToken(request: Request): string | null {
  const h = request.headers.get('Authorization') || '';
  if (h.toLowerCase().startsWith('bearer ')) return h.slice(7).trim();
  return cookieToken(request);
}

function setTokenCookie(token: string): string {
  return `sss_auth_token=${encodeURIComponent(token)}; Path=/; Max-Age=604800; SameSite=Lax; Secure`;
}

function clearTokenCookie(): string {
  return 'sss_auth_token=; Path=/; Max-Age=0; SameSite=Lax; Secure';
}

async function readBody(request: Request): Promise<Json> {
  if (request.method === 'GET' || request.method === 'HEAD') return {};
  const text = await request.text();
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function publicOrigin(request: Request): string {
  const url = new URL(request.url);
  return url.origin;
}

function splitName(name: string): { first: string; last: string } {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { first: 'Customer', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

function dollarsToCents(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.round(v * 100);
}

/** Accept `{id}` or `{quote|client|property:{id}}` (and the same for other keys). */
export function unwrap(data: unknown, keys: string[] = ['id']): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;
  const root = data as Record<string, unknown>;
  const candidates: Record<string, unknown>[] = [root];
  for (const nest of ['quote', 'client', 'property'] as const) {
    const nested = root[nest];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      candidates.push(nested as Record<string, unknown>);
    }
  }
  const primary = keys[0];
  for (const obj of candidates) {
    if (obj[primary] == null || obj[primary] === '') continue;
    const out: Record<string, unknown> = {};
    for (const k of keys) {
      if (obj[k] != null && obj[k] !== '') out[k] = obj[k];
    }
    return out;
  }
  return null;
}

function chalkList(data: unknown): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data !== 'object') return [];
  const obj = data as Record<string, unknown>;
  for (const k of ['matches', 'clients', 'nodes', 'items', 'data', 'hits', 'results']) {
    if (Array.isArray(obj[k])) return obj[k] as any[];
  }
  return [];
}

function chalkAdminQuoteUrl(env: CalcEnv, chalkId: string): string {
  const base = (env.CHALK_API_BASE || CHALK_DEFAULT).replace(/\/$/, '');
  return base + '/quotes/' + encodeURIComponent(chalkId);
}

function officeQuoteUrlFromStored(row: { chalk_quote_id?: string | null; chalk_web_uri?: string | null }): string {
  const id = String(row.chalk_quote_id || '').trim();
  if (!id) return String(row.chalk_web_uri || '');
  const stored = String(row.chalk_web_uri || '');
  if (stored && !stored.includes('hub.chalkcrm.com') && /\/quotes\//.test(stored)) return stored;
  return 'https://app.chalkcrm.com/quotes/' + id;
}

async function resolveChalkOfficeQuoteUrl(env: CalcEnv, chalkId: string): Promise<string> {
  const fallback = chalkAdminQuoteUrl(env, chalkId);
  const linked = await chalkJson(env, '/api/quotes/' + encodeURIComponent(chalkId) + '/link', {
    method: 'POST',
    body: '{}',
  });
  const app = String(linked.data?.app_url || '').trim();
  if (linked.status < 400 && app && !app.includes('hub.chalkcrm.com')) return app;
  return fallback;
}

function projectDisplayName(p: any): string {
  return String(p?._jobberName || p?.type || 'Work').trim() || 'Work';
}

const FENCE_GAL_PER_10FT: Record<string, number> = {
  privacy: 1.0,
  charleston: 1.0,
  farm: 0.6,
  shadowbox: 1.3,
  bob: 1.3,
  charleston_bob: 1.3,
};

const FENCE_STYLE_LABELS: Record<string, string> = {
  privacy: 'Privacy',
  shadowbox: 'Shadowbox',
  charleston: 'Charleston',
  bob: 'Board-on-board',
  charleston_bob: 'Charleston board-on-board',
  farm: 'Farm-style',
};

function stainProductName(p: any, swReferral: boolean): string {
  if (String(p?.productType) === 'hoa') {
    const h = p?.hoa || {};
    return [h.brand, h.productName].filter(Boolean).join(' ') || 'HOA-specified product';
  }
  const map: Record<string, string> = {
    'essential-oil': 'Exotic Timber Oil (tri-oil)',
    'essential-water': 'SW Woodscapes Solid Color Exterior Stain',
    'performance-oil': 'EXPERT Stain & Seal (semi-transparent)',
    'performance-water': 'SW Woodscapes Rain Refresh',
    'showcase-oil': 'EXPERT Log & Timber Oil (semi-transparent)',
    'showcase-water': 'SW Acrylic Alkyd Stain',
  };
  if (p?.type === 'deck' && p?.productType === 'water') {
    Object.assign(map, {
      'essential-water': 'SW SuperDeck Exterior Waterborne Semi-Transparent Stain',
      'performance-water': 'SW SuperDeck Exterior Waterborne Semi-Solid Color Stain',
      'showcase-water': 'SW SuperDeck Exterior Waterborne Solid Color Deck Stain',
    });
  }
  if (swReferral) {
    Object.assign(map, {
      'essential-oil': 'SuperDeck Exotic Timber Oil',
      'performance-oil': 'SuperDeck Oil-Based Semi-Solid Wood Stain',
      'showcase-oil': 'SuperDeck Solid Color Stain (Acrylic-Alkyd)',
    });
  }
  return map[`${p?.tier || 'performance'}-${p?.productType || 'oil'}`] || 'Stain';
}

function colorLabel(p: any): string {
  const sc = p?.selectedColor;
  if (!sc) return '';
  if (typeof sc === 'string') return sc.trim();
  const name = String(sc.name || sc.label || '').trim();
  const brand = sc.brand ? ` (${sc.brand})` : '';
  return name ? name + brand : '';
}

function pailPhrase(pails: number): string {
  return pails === 1 ? '1 five-gallon pail' : pails + ' five-gallon pails';
}

function stainGallonsFor(p: any): { gallons: number; pails: number; basedOn: string } | null {
  const type = String(p?.type || '');
  if (type === 'interior' || type === 'exterior' || type === 'cabinet') return null;
  const m = p?.measurements || {};
  const isOneCoat = p?.productType === 'water' && p?.tier === 'essential';
  if (type === 'fence') {
    const linearft = Number(m.linearft) || 0;
    if (!linearft) return null;
    const style = String(m.style || 'privacy');
    const per10 = FENCE_GAL_PER_10FT[style] ?? 1;
    const gallons = Math.max(1, Math.ceil((linearft * per10) / 10));
    let pails = Math.max(1, Math.ceil(gallons / 5));
    let extra = 0;
    if (p?.addons && p.addons.two_tone) {
      extra = Math.max(1, Math.ceil(pails * 0.5));
      pails += extra;
    }
    const styleLabel = FENCE_STYLE_LABELS[style] || style;
    return {
      gallons: gallons + extra * 5,
      pails,
      basedOn: linearft + ' ln ft of ' + styleLabel + ' fence',
    };
  }
  if (type === 'deck') {
    const flatSq = (Number(m.flat) || 0) * (m.underneath ? 2 : 1) + (Number(m.lattice) || 0);
    if (!flatSq) return null;
    const pails = Math.max(1, isOneCoat ? Math.ceil(flatSq / 750) : Math.ceil(flatSq / 375));
    return {
      gallons: pails * 5,
      pails,
      basedOn: flatSq + ' sq ft decking' + (m.underneath ? ' (underside included)' : ''),
    };
  }
  const sq = Number(m.sqft) || 0;
  if (!sq) return null;
  const pails = Math.max(1, isOneCoat ? Math.ceil(sq / 750) : Math.ceil(sq / 375));
  return { gallons: pails * 5, pails, basedOn: sq + ' sq ft' };
}

function paintOrderFromDescription(desc: unknown): string[] {
  const text = String(desc || '');
  const idx = text.indexOf('PAINT (ESTIMATED ORDER)');
  if (idx < 0) return [];
  const stop = /^(ROOM-BY-ROOM SCOPE|EXTERIOR SCOPE|AREA-BY-AREA SCOPE|ADD-ONS|CUSTOM ITEMS|DISCOUNTS APPLIED|Warranty:)/;
  const out: string[] = [];
  for (const line of text.slice(idx).split('\n')) {
    if (out.length && stop.test(line)) break;
    out.push(line);
  }
  while (out.length && !out[out.length - 1].trim()) out.pop();
  return out;
}

/** Product + gallons, matching live Jobber notes / DIY math. */
function buildMaterialsLines(payload: any): string[] {
  const sw = !!payload?.totals?._swReferral;
  const lines: string[] = [];
  for (const p of Array.isArray(payload?.projects) ? payload.projects : []) {
    const name = projectDisplayName(p);
    const type = String(p?.type || '');
    if (type === 'interior' || type === 'exterior' || type === 'cabinet') {
      const extracted = paintOrderFromDescription(p?._jobberDescription);
      if (extracted.length) {
        if (lines.length) lines.push('');
        lines.push(name);
        for (const l of extracted) lines.push(l);
      }
      continue;
    }
    const stain = stainGallonsFor(p);
    if (!stain) continue;
    if (lines.length) lines.push('');
    lines.push(name);
    lines.push('Stain: ' + stainProductName(p, sw));
    const color = colorLabel(p);
    if (color) lines.push('Color: ' + color);
    lines.push('Estimated stain needed: ' + stain.gallons + ' gallons (' + pailPhrase(stain.pails) + ')');
    if (stain.basedOn) lines.push('Based on ' + stain.basedOn);
    if (p?.productType === 'oil' && p?.addons && p.addons.citronella) {
      lines.push(
        'Additive: EXPERT Natural Defense (citronella) x ' +
          stain.pails +
          (stain.pails === 1 ? ' pail' : ' pails'),
      );
    }
  }
  return lines;
}

/** Office / crew notes. Photos, materials, and rep notes live here. */
function buildChalkOfficeNotes(payload: any): string {
  const lines: string[] = [];
  lines.push('INTERNAL - crew / office');
  const employee = String(payload?.repName || payload?.employee || '').trim();
  if (employee) lines.push('Quoted by: ' + employee);
  const pay = String(payload?.paymentMethod || '');
  lines.push('Payment: ' + (pay === 'wisetack' ? 'Wisetack financing' : '25% deposit + balance'));
  const quoteId = String(payload?.quoteId || '').trim();
  if (quoteId) lines.push('Calc quote ID: ' + quoteId);
  const jobNum = String(payload?.jobberJobNum || '').trim();
  if (jobNum) lines.push('Chalk job #: ' + jobNum);
  const typed = String(payload?.notes || '').trim();
  if (typed) {
    lines.push('');
    lines.push('Rep notes:');
    lines.push(typed);
  }
  const materials = buildMaterialsLines(payload);
  if (materials.length) {
    lines.push('');
    lines.push('MATERIALS');
    for (const l of materials) lines.push(l);
  }
  const photos = collectPhotoRefs(payload);
  if (photos.length) {
    lines.push('');
    lines.push('Reference photos (' + photos.length + '):');
    for (const ph of photos) {
      lines.push('- ' + (ph.name || 'photo') + (ph.url ? '\n  ' + ph.url : ''));
    }
  }
  const projects = Array.isArray(payload?.projects) ? payload.projects : [];
  if (projects.length) {
    lines.push('');
    lines.push('Projects on this quote:');
    for (const p of projects) {
      const bits = [projectDisplayName(p)];
      const m = p?.measurements || {};
      if (p?.type === 'fence' && m.linearft) bits.push(m.linearft + ' ln ft x ' + (m.height || '') + ' ft');
      if (p?.type === 'deck' && m.flat) bits.push(m.flat + ' sq ft');
      if (p?.selectedColor) {
        const sc = p.selectedColor;
        bits.push(typeof sc === 'string' ? sc : sc.name || sc.label || '');
      }
      lines.push('- ' + bits.filter(Boolean).join(' · '));
    }
  }
  return lines.join('\n').trim();
}

function collectPhotoRefs(payload: any): { url: string; name: string }[] {
  const out: { url: string; name: string }[] = [];
  const seen = new Set<string>();
  const push = (url: unknown, name?: unknown) => {
    const u = String(url || '').trim();
    if (!u || seen.has(u)) return;
    seen.add(u);
    const rawName = String(name || '').trim() || u.split('/').pop() || 'photo.jpg';
    out.push({ url: u, name: rawName.replace(/[^\w.\-]+/g, '_') });
  };
  for (const p of Array.isArray(payload?.projects) ? payload.projects : []) {
    for (const ph of p?.referencePhotos || []) {
      if (typeof ph === 'string') push(ph);
      else if (ph && typeof ph === 'object') push(ph.url, ph.name);
    }
    for (const url of p?._jobberReferencePhotoUrls || []) push(url);
  }
  return out;
}

function mapChalkClientNode(raw: any, fallback?: any): Json {
  const data = raw && typeof raw === 'object' ? raw : {};
  const nested = data.client && typeof data.client === 'object' ? data.client : {};
  const client = { ...(fallback && typeof fallback === 'object' ? fallback : {}), ...data, ...nested };
  const emails = Array.isArray(data.emails) ? data.emails : Array.isArray(client.emails) ? client.emails : [];
  const phones = Array.isArray(data.phones) ? data.phones : Array.isArray(client.phones) ? client.phones : [];
  const properties = Array.isArray(data.properties)
    ? data.properties
    : Array.isArray(client.properties)
      ? client.properties
      : [];
  const primaryEmail =
    client.primary_email ||
    client.email ||
    emails.find((e: any) => e && (e.is_primary || e.primary))?.address ||
    emails[0]?.address ||
    '';
  const primaryPhone =
    client.primary_phone ||
    client.phone ||
    phones.find((p: any) => p && (p.is_primary || p.primary))?.number ||
    phones[0]?.number ||
    '';
  const prop =
    properties.find((p: any) => p && (p.is_billing || p.is_primary)) || properties[0] || {};
  const id = String(client.id || fallback?.id || '').trim();
  let firstName = String(client.first_name || client.firstName || '').trim();
  let lastName = String(client.last_name || client.lastName || '').trim();
  if (!firstName && !lastName) {
    const split = splitName(String(client.name || client.display_name || fallback?.name || ''));
    firstName = split.first === 'Customer' && !client.name ? '' : split.first;
    lastName = split.last;
  }
  return {
    id,
    propertyId: String(prop.id || client.primary_property_id || client.property_id || '').trim(),
    companyName: client.company_name || client.companyName || '',
    firstName,
    lastName,
    displayName: client.display_name || client.name || fallback?.title || fallback?.name || '',
    email: primaryEmail,
    phone: primaryPhone,
    street1: prop.street1 || client.street1 || client.street || '',
    street2: prop.street2 || client.street2 || '',
    city: prop.city || client.city || '',
    province: prop.province || client.province || '',
    postalCode: prop.postal_code || client.postal_code || client.postalCode || '',
  };
}

type RepRow = {
  id: string;
  initials: string;
  display_name: string;
  email: string | null;
  role: string;
  pin_hash: string;
  pin_salt: string;
  last_sign_in_at: string | null;
};

function toRep(row: RepRow) {
  return {
    _id: row.id,
    initials: row.initials,
    displayName: row.display_name,
    email: row.email || '',
    role: row.role,
    lastSignInAt: row.last_sign_in_at,
  };
}

async function getRep(env: CalcEnv, token: string | null): Promise<RepRow | null> {
  if (!token || !env.AUTH_SECRET) return null;
  const dot = token.indexOf('.');
  if (dot < 1) return null;
  const deviceId = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const device = await env.CALC_DB.prepare(
    'SELECT * FROM devices WHERE id = ?',
  )
    .bind(deviceId)
    .first<{
      id: string;
      rep_id: string;
      token_sig: string;
      revoked: number;
      expires_at: string | null;
    }>();
  if (!device || device.revoked) return null;
  if (device.expires_at && Date.parse(device.expires_at) < Date.now()) return null;
  const expected = await hmacSign(env.AUTH_SECRET, deviceId + '.' + device.rep_id);
  if (expected !== sig || expected !== device.token_sig) return null;
  const rep = await env.CALC_DB.prepare('SELECT * FROM reps WHERE id = ?')
    .bind(device.rep_id)
    .first<RepRow>();
  if (!rep) return null;
  await env.CALC_DB.prepare('UPDATE devices SET last_used_at = ? WHERE id = ?')
    .bind(nowIso(), deviceId)
    .run();
  return rep;
}

async function mintToken(env: CalcEnv, rep: RepRow, label: string): Promise<string> {
  if (!env.AUTH_SECRET) throw new Error('auth_secret_unbound');
  const secret = env.AUTH_SECRET;
  const deviceId = id('dev');
  const sig = await hmacSign(secret, deviceId + '.' + rep.id);
  const expires = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  await env.CALC_DB.prepare(
    `INSERT INTO devices (id, rep_id, label, token_sig, revoked, expires_at, last_used_at, created_at)
     VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
  )
    .bind(deviceId, rep.id, label, sig, expires, nowIso(), nowIso())
    .run();
  await env.CALC_DB.prepare('UPDATE reps SET last_sign_in_at = ? WHERE id = ?')
    .bind(nowIso(), rep.id)
    .run();
  return deviceId + '.' + sig;
}

async function chalkFetch(env: CalcEnv, path: string, init: RequestInit = {}): Promise<Response> {
  const base = (env.CHALK_API_BASE || CHALK_DEFAULT).replace(/\/$/, '');
  const headers = new Headers(init.headers);
  headers.set('Authorization', 'Bearer ' + (env.CHALK_API_KEY || ''));
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  return fetch(base + path, { ...init, headers });
}

async function chalkJson(env: CalcEnv, path: string, init: RequestInit = {}): Promise<{ status: number; data: any }> {
  const res = await chalkFetch(env, path, init);
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

function dashboardItem(row: {
  id: string;
  quote_id: string | null;
  status: string;
  payload: string;
  updated_at: string;
  chalk_quote_id: string | null;
  chalk_quote_number: number | null;
  chalk_web_uri: string | null;
  date_finished: string | null;
  date_archived: string | null;
  date_trashed: string | null;
}) {
  let payload: any = {};
  try {
    payload = JSON.parse(row.payload);
  } catch {
    payload = {};
  }
  const customer = payload.customer || {};
  const projects = Array.isArray(payload.projects) ? payload.projects : [];
  const totals = payload.totals || {};
  return {
    _id: row.id,
    quoteId: row.quote_id || payload.quoteId || '',
    status: row.status,
    customer: {
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      companyName: customer.companyName || '',
      street1: customer.street1 || '',
      street2: customer.street2 || '',
      city: customer.city || '',
      province: customer.province || '',
      postalCode: customer.postalCode || '',
      jobberClientId: customer.jobberClientId || '',
      jobberPropertyId: customer.jobberPropertyId || '',
    },
    employeeName: payload.employee || payload.repName || '',
    repName: payload.repName || '',
    repInitials: payload.repInitials || '',
    lastEditedBy: payload.repName || '',
    notes: payload.notes || '',
    paymentMethod: payload.paymentMethod || '',
    jobberRequestId: payload.jobberRequestId || '',
    jobberJobNum: payload.jobberJobNum || '',
    jobberQuoteId: row.chalk_quote_id || '',
    jobberQuoteNumber: row.chalk_quote_number || '',
    jobberWebUri: officeQuoteUrlFromStored(row),
    jobberStatus: row.chalk_quote_id ? 'pushed' : '',
    projects,
    totals,
    finalTotal: totals.final ?? payload.finalTotal ?? 0,
    dateModified: row.updated_at,
    dateFinished: row.date_finished,
    dateArchived: row.date_archived,
    dateTrashed: row.date_trashed,
  };
}

async function handleAuth(name: string, env: CalcEnv, body: Json, request: Request, rep: RepRow | null) {
  if (name === 'authStatus') {
    const count = await env.CALC_DB.prepare('SELECT COUNT(*) AS n FROM reps').first<{ n: number }>();
    if (!count || Number(count.n) === 0) return json({ ok: false, bootstrap: true });
    if (!rep) return json({ ok: false });
    return json({ ok: true, rep: toRep(rep) });
  }

  if (name === 'authSignIn') {
    if (!env.AUTH_SECRET) return json({ ok: false, error: 'auth_secret_unbound' }, 500);
    const initials = String(body.initials || '').trim().toUpperCase();
    const pin = String(body.pin || '');
    if (!initials || !pin) return json({ ok: false, error: 'missing_credentials' });
    const row = await env.CALC_DB.prepare('SELECT * FROM reps WHERE initials = ?').bind(initials).first<RepRow>();
    if (!row) return json({ ok: false, error: 'invalid_credentials' });
    const hashed = await hashPin(pin, row.pin_salt);
    if (hashed !== row.pin_hash) return json({ ok: false, error: 'invalid_credentials' });
    const token = await mintToken(env, row, 'pages-draft');
    const headers = { 'set-cookie': setTokenCookie(token) };
    return json({ ok: true, token, rep: toRep(row) }, 200, headers);
  }

  if (name === 'authCreateRep') {
    const initials = String(body.initials || '').trim().toUpperCase();
    const displayName = String(body.displayName || '').trim();
    const email = String(body.email || '').trim();
    const pin = String(body.pin || '');
    if (pin.length < 4 || pin.length > 8) return json({ ok: false, error: 'pin_length' });
    if (!initials || !displayName) return json({ ok: false, error: 'missing_fields' });
    const count = await env.CALC_DB.prepare('SELECT COUNT(*) AS n FROM reps').first<{ n: number }>();
    const n = Number(count?.n || 0);
    if (n === 0 && !env.AUTH_SECRET) return json({ ok: false, error: 'auth_secret_unbound' }, 500);
    if (n > 0 && !rep) return json({ ok: false, error: 'admin_signin_required_to_add_rep' });
    if (n > 0 && rep?.role !== 'admin') return json({ ok: false, error: 'admin_only' });
    const taken = await env.CALC_DB.prepare('SELECT id FROM reps WHERE initials = ?').bind(initials).first();
    if (taken) return json({ ok: false, error: 'initials_taken' });
    const salt = crypto.randomUUID();
    const pin_hash = await hashPin(pin, salt);
    const role = n === 0 ? 'admin' : String(body.role || 'rep');
    const newId = id('rep');
    await env.CALC_DB.prepare(
      `INSERT INTO reps (id, initials, display_name, email, role, pin_hash, pin_salt, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(newId, initials, displayName, email || null, role, pin_hash, salt, nowIso())
      .run();
    const created = (await env.CALC_DB.prepare('SELECT * FROM reps WHERE id = ?').bind(newId).first<RepRow>())!;
    if (n === 0) {
      const token = await mintToken(env, created, 'pages-draft');
      return json({ ok: true, token, rep: toRep(created) }, 200, { 'set-cookie': setTokenCookie(token) });
    }
    return json({ ok: true, rep: toRep(created) });
  }

  if (name === 'authSignOut') {
    return json({ ok: true }, 200, { 'set-cookie': clearTokenCookie() });
  }

  if (name === 'authUpdateRepPin') {
    if (!rep) return json({ ok: false, error: 'not_signed_in' });
    const repId = String(body.repId || '');
    const pin = String(body.pin || '');
    if (pin.length < 4 || pin.length > 8) return json({ ok: false, error: 'pin_length' });
    if (repId !== rep.id && rep.role !== 'admin') return json({ ok: false, error: 'admin_only' });
    const salt = crypto.randomUUID();
    const pin_hash = await hashPin(pin, salt);
    await env.CALC_DB.prepare('UPDATE reps SET pin_hash = ?, pin_salt = ? WHERE id = ?')
      .bind(pin_hash, salt, repId)
      .run();
    return json({ ok: true });
  }

  if (name === 'authListReps') {
    if (!rep) return json({ ok: false, error: 'not_signed_in' });
    const { results } = await env.CALC_DB.prepare('SELECT * FROM reps ORDER BY created_at').all<RepRow>();
    return json({ ok: true, reps: (results || []).map(toRep) });
  }

  if (name === 'authDeleteRep') {
    if (!rep || rep.role !== 'admin') return json({ ok: false, error: 'admin_only' });
    const repId = String(body.repId || '');
    if (repId === rep.id) return json({ ok: false, error: 'cannot_delete_self' });
    await env.CALC_DB.prepare('UPDATE devices SET revoked = 1, revoked_at = ? WHERE rep_id = ?')
      .bind(nowIso(), repId)
      .run();
    await env.CALC_DB.prepare('DELETE FROM reps WHERE id = ?').bind(repId).run();
    return json({ ok: true });
  }

  if (name === 'authListDevices') {
    if (!rep) return json({ ok: false, error: 'not_signed_in' });
    const { results } = await env.CALC_DB.prepare(
      `SELECT d.*, r.initials AS rep_initials FROM devices d JOIN reps r ON r.id = d.rep_id ORDER BY d.created_at DESC`,
    ).all<any>();
    const devices = (results || []).map((d: any) => ({
      _id: d.id,
      label: d.label,
      repInitials: d.rep_initials,
      revoked: !!d.revoked,
      revokedAt: d.revoked_at,
      expiresAt: d.expires_at,
      lastUsedAt: d.last_used_at,
    }));
    return json({ ok: true, devices });
  }

  if (name === 'authRevokeDevice') {
    if (!rep) return json({ ok: false, error: 'not_signed_in' });
    await env.CALC_DB.prepare('UPDATE devices SET revoked = 1, revoked_at = ? WHERE id = ?')
      .bind(nowIso(), String(body.deviceId || ''))
      .run();
    return json({ ok: true });
  }

  return null;
}

async function handleQuotes(name: string, env: CalcEnv, body: Json, rep: RepRow | null) {
  if (name === 'createQuote') {
    if (!rep) return json({ ok: false, error: 'not_signed_in' });
    const payload = (body.payload || {}) as Json;
    const rowId = id('q');
    const quoteId = String((payload as any).quoteId || '');
    await env.CALC_DB.prepare(
      `INSERT INTO quotes (id, quote_id, status, payload, rep_id, created_at, updated_at)
       VALUES (?, ?, 'draft', ?, ?, ?, ?)`,
    )
      .bind(rowId, quoteId, JSON.stringify(payload), rep.id, nowIso(), nowIso())
      .run();
    return json({ ok: true, quote: { _id: rowId, quoteId } });
  }

  if (name === 'updateQuote') {
    if (!rep) return json({ ok: false, error: 'not_signed_in' });
    const quoteRowId = String(body.quoteRowId || '');
    const patch = body.patch || {};
    await env.CALC_DB.prepare('UPDATE quotes SET payload = ?, updated_at = ? WHERE id = ?')
      .bind(JSON.stringify(patch), nowIso(), quoteRowId)
      .run();
    return json({ ok: true });
  }

  if (name === 'getQuote') {
    if (!rep) return json({ ok: false, error: 'not_signed_in' });
    const row = await env.CALC_DB.prepare('SELECT * FROM quotes WHERE id = ?')
      .bind(String(body.quoteRowId || ''))
      .first<any>();
    if (!row) return json({ ok: false, error: 'not_found' });
    return json({ ok: true, quote: dashboardItem(row) });
  }

  if (name === 'listQuotes') {
    if (!rep) return json({ ok: false, error: 'not_signed_in' });
    const status = String(body.status || 'draft');
    const limit = Math.min(Number(body.limit) || 200, 500);
    const { results } = await env.CALC_DB.prepare(
      'SELECT * FROM quotes WHERE status = ? ORDER BY updated_at DESC LIMIT ?',
    )
      .bind(status, limit)
      .all<any>();
    return json({ ok: true, items: (results || []).map(dashboardItem) });
  }

  if (name === 'setQuoteStatus') {
    if (!rep) return json({ ok: false, error: 'not_signed_in' });
    const status = String(body.status || '');
    const extra: string[] = ['status = ?', 'updated_at = ?'];
    const binds: unknown[] = [status, nowIso()];
    if (status === 'finished') {
      extra.push('date_finished = ?');
      binds.push(nowIso());
    }
    if (status === 'archived') {
      extra.push('date_archived = ?');
      binds.push(nowIso());
    }
    if (status === 'trashed') {
      extra.push('date_trashed = ?');
      binds.push(nowIso());
    }
    binds.push(String(body.quoteRowId || ''));
    await env.CALC_DB.prepare(`UPDATE quotes SET ${extra.join(', ')} WHERE id = ?`)
      .bind(...binds)
      .run();
    return json({ ok: true });
  }

  if (name === 'duplicateQuote') {
    if (!rep) return json({ ok: false, error: 'not_signed_in' });
    const src = await env.CALC_DB.prepare('SELECT * FROM quotes WHERE id = ?')
      .bind(String(body.quoteRowId || ''))
      .first<any>();
    if (!src) return json({ ok: false, error: 'not_found' });
    const newId = id('q');
    await env.CALC_DB.prepare(
      `INSERT INTO quotes (id, quote_id, status, payload, rep_id, created_at, updated_at)
       VALUES (?, ?, 'draft', ?, ?, ?, ?)`,
    )
      .bind(newId, src.quote_id, src.payload, rep.id, nowIso(), nowIso())
      .run();
    return json({ ok: true, quote: { _id: newId, quoteId: src.quote_id } });
  }

  if (name === 'permanentlyDelete') {
    if (!rep) return json({ ok: false, error: 'not_signed_in' });
    await env.CALC_DB.prepare('DELETE FROM quotes WHERE id = ?').bind(String(body.quoteRowId || '')).run();
    return json({ ok: true });
  }

  return null;
}

async function handlePricing(name: string, env: CalcEnv, body: Json, rep: RepRow | null) {
  if (name === 'getPricingRules') {
    const row = await env.CALC_DB.prepare('SELECT * FROM pricing WHERE id = 1').first<any>();
    return json({
      ok: true,
      rules: JSON.parse(row?.rules || '{}'),
      rulesSw: JSON.parse(row?.rules_sw || '{}'),
      discounts: JSON.parse(row?.discounts || '[]'),
      lastEditedBy: row?.last_edited_by || '',
      lastEditedAt: row?.last_edited_at || '',
    });
  }
  if (name === 'savePricingRules') {
    if (!rep) return json({ ok: false, error: 'not_signed_in' });
    const at = nowIso();
    await env.CALC_DB.prepare(
      `UPDATE pricing SET rules = ?, rules_sw = ?, discounts = ?, last_edited_by = ?, last_edited_at = ? WHERE id = 1`,
    )
      .bind(
        JSON.stringify(body.rules || {}),
        JSON.stringify(body.rulesSw || {}),
        JSON.stringify(body.discounts || []),
        rep.display_name,
        at,
      )
      .run();
    return json({ ok: true, lastEditedBy: rep.display_name, lastEditedAt: at });
  }
  if (name === 'resetPricingRules') {
    if (!rep) return json({ ok: false, error: 'not_signed_in' });
    const at = nowIso();
    await env.CALC_DB.prepare(
      `UPDATE pricing SET rules = '{}', rules_sw = '{}', discounts = '[]', last_edited_by = ?, last_edited_at = ? WHERE id = 1`,
    )
      .bind(rep.display_name, at)
      .run();
    return json({ ok: true });
  }
  return null;
}

async function handlePhoto(env: CalcEnv, body: Json, request: Request, rep: RepRow | null) {
  if (!rep) return json({ ok: false, error: 'not_signed_in' }, 401);
  const dataUrl = String(body.dataUrl || '');
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return json({ ok: false, error: 'invalid_body' }, 400);
  const contentType = m[1] || 'image/jpeg';
  const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
  const photoId = id('ph');
  const ext = contentType.includes('png') ? 'png' : 'jpg';
  const key = photoId + '.' + ext;
  await env.CALC_PHOTOS.put(key, bytes, { httpMetadata: { contentType } });
  const url = publicOrigin(request) + '/calc-photos/' + key;
  return json({ ok: true, url });
}

async function hydrateChalkClient(env: CalcEnv, id: string, fallback?: any): Promise<Json | null> {
  if (!id) return null;
  const { status, data } = await chalkJson(env, '/api/clients/' + encodeURIComponent(id));
  if (status >= 400 || !data) return fallback ? mapChalkClientNode(fallback) : null;
  return mapChalkClientNode(data, fallback);
}

async function ingestClientHits(env: CalcEnv, data: unknown, take: (node: Json | null) => void) {
  for (const row of chalkList(data).slice(0, 8)) {
    if ((row?.kind || row?.type) && row.kind !== 'client' && row.type !== 'client') continue;
    const inner = row?.client && typeof row.client === 'object' ? { ...row, ...row.client } : row;
    const id = String(inner?.id || '').trim();
    if (id) take(await hydrateChalkClient(env, id, inner));
    else take(mapChalkClientNode(inner));
  }
}

async function lookupChalkClients(env: CalcEnv, q: string): Promise<Json[]> {
  const encoded = encodeURIComponent(q);
  const found = new Map<string, Json>();

  const take = (node: Json | null) => {
    if (!node || !node.id) return;
    const id = String(node.id);
    if (!found.has(id)) found.set(id, node);
  };

  // Documented find: name, company, email, digit-stripped phone (4+), street/city/zip.
  const lookup = await chalkJson(env, '/api/clients/lookup?q=' + encoded);
  if (lookup.status < 400) await ingestClientHits(env, lookup.data, take);

  if (!found.size) {
    const list = await chalkJson(env, '/api/clients?q=' + encoded);
    if (list.status < 400) await ingestClientHits(env, list.data, take);
  }

  if (!found.size) {
    const search = await chalkJson(env, '/api/search?q=' + encoded + '&kind=client');
    if (search.status < 400) await ingestClientHits(env, search.data, take);
  }

  return Array.from(found.values()).slice(0, 8);
}

async function attachQuotePhotos(
  env: CalcEnv,
  request: Request,
  chalkId: string,
  payload: any,
): Promise<{ ok: boolean; attempted: number; attached: number; errors: string[] }> {
  const refs = collectPhotoRefs(payload);
  const errors: string[] = [];
  let attached = 0;
  const origin = publicOrigin(request);
  for (const ref of refs) {
    try {
      let bytes: ArrayBuffer | null = null;
      let contentType = 'image/jpeg';
      const marker = '/calc-photos/';
      const idx = ref.url.indexOf(marker);
      if (idx >= 0) {
        const key = decodeURIComponent(ref.url.slice(idx + marker.length).split('?')[0]);
        const obj = await env.CALC_PHOTOS.get(key);
        if (obj) {
          bytes = await obj.arrayBuffer();
          contentType = obj.httpMetadata?.contentType || contentType;
        }
      }
      if (!bytes) {
        const abs = ref.url.startsWith('http') ? ref.url : origin + (ref.url.startsWith('/') ? '' : '/') + ref.url;
        const fetched = await fetch(abs);
        if (!fetched.ok) {
          errors.push(ref.name + ': fetch ' + fetched.status);
          continue;
        }
        bytes = await fetched.arrayBuffer();
        contentType = fetched.headers.get('content-type') || contentType;
      }
      // PUT /api/files: entity_type + entity_id + optional filename in the
      // query string. Body is raw bytes (not JSON). Needs the files scope.
      const params = new URLSearchParams({
        entity_type: 'quote',
        entity_id: chalkId,
        filename: ref.name || 'photo.jpg',
      });
      const put = await chalkJson(env, '/api/files?' + params.toString(), {
        method: 'PUT',
        headers: { 'content-type': contentType },
        body: bytes,
      });
      if (put.status >= 400) {
        errors.push(ref.name + ': ' + (put.data?.error || put.status));
      } else {
        attached += 1;
      }
    } catch (e) {
      errors.push(ref.name + ': ' + (e instanceof Error ? e.message : 'upload_failed'));
    }
  }
  return { ok: errors.length === 0, attempted: refs.length, attached, errors };
}

async function upsertQuoteNote(env: CalcEnv, chalkId: string, body: string): Promise<void> {
  const text = String(body || '').trim();
  if (!text) return;
  const sliced = text.slice(0, 8000);
  const existing = await chalkJson(env, '/api/quotes/' + encodeURIComponent(chalkId));
  const notes = Array.isArray(existing.data?.notes) ? existing.data.notes : [];
  const pinned = notes.find((n: any) => Number(n?.pinned) === 1) || notes[0];
  if (pinned?.id) {
    await chalkJson(env, '/api/notes/' + encodeURIComponent(String(pinned.id)), {
      method: 'PATCH',
      body: JSON.stringify({ body: sliced, pinned: 1 }),
    });
    return;
  }
  await chalkJson(env, '/api/notes', {
    method: 'POST',
    body: JSON.stringify({
      entity_type: 'quote',
      entity_id: chalkId,
      body: sliced,
      pinned: 1,
    }),
  });
}

async function syncChalkQuoteCopy(env: CalcEnv, chalkId: string, payload: any): Promise<void> {
  // Leave quote.message empty so Chalk uses the shop default intro.
  await upsertQuoteNote(env, chalkId, buildChalkOfficeNotes(payload));
}

async function postQuoteNote(env: CalcEnv, chalkId: string, body: string): Promise<void> {
  await upsertQuoteNote(env, chalkId, body);
}

export function buildQuoteLineItems(payload: any): { line_items: Json[]; sentLineItems: Json[]; bundle: number } {
  // Custom lines only: calc dollars in unit_price_cents. Never set product_id.
  const projects = Array.isArray(payload?.projects) ? payload.projects : [];
  const bundle = Number(payload?.totals?.bundleDiscount || 0);
  const hasProjectLines = projects.some(
    (p: any) => String(p?._jobberName || '').trim() || p?.preDiscountSubtotal != null || p?.subtotal != null,
  );

  const line_items: Json[] = [];
  const sentLineItems: Json[] = [];

  if (hasProjectLines) {
    for (const p of projects) {
      const dollars = Number(p.preDiscountSubtotal ?? p.subtotal ?? 0);
      const name = String(p._jobberName || p.type || 'Work');
      const description = String(p._jobberDescription || '');
      line_items.push({
        name,
        description,
        quantity: 1,
        unit: 'each',
        unit_price_cents: dollarsToCents(dollars),
      });
      sentLineItems.push({ name, unitPrice: dollars, totalPrice: dollars });
    }
    if (bundle > 0) {
      line_items.push({
        name: 'Bundle discount',
        description: 'Calc-generated bundle discount',
        quantity: 1,
        unit: 'each',
        unit_price_cents: -dollarsToCents(bundle),
      });
    }
  }

  if (!line_items.length) {
    const final = Number(payload?.totals?.final || 0);
    const name = 'Estimate';
    const description = String(payload?.notes || '');
    line_items.push({
      name,
      description,
      quantity: 1,
      unit: 'each',
      unit_price_cents: dollarsToCents(final),
    });
    sentLineItems.push({ name, unitPrice: final, totalPrice: final });
  }

  return { line_items, sentLineItems, bundle };
}

async function handleChalk(
  name: string,
  env: CalcEnv,
  body: Json,
  _request: Request,
  rep: RepRow | null,
) {
  const connected = Boolean(env.CHALK_API_KEY);

  if (name === 'jobberStatus') {
    if (!connected) return json({ connected: false, reason: 'missing_key' });
    const ping = await chalkFetch(env, '/api/dashboard');
    if (!ping.ok) return json({ connected: false, reason: 'refresh_failed' });
    return json({ connected: true, accessExpiresAt: '2099-01-01T00:00:00.000Z' });
  }

  if (name === 'jobberStartAuth') {
    return new Response(
      `<!doctype html><meta charset="utf-8"><title>Chalk CRM</title>
       <body style="font-family:system-ui;padding:2rem;background:#1a2540;color:#f6eee0">
       <p>Chalk is connected with an API key. You can close this tab.</p>
       </body>`,
      { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } },
    );
  }

  if (name === 'jobberRefresh' || name === 'jobberDisconnect') {
    return json({ ok: true });
  }

  if (name === 'jobberTest') {
    if (!connected) return json({ ok: false, error: 'missing_key' });
    const ping = await chalkJson(env, '/api/dashboard');
    if (ping.status >= 400) return json({ ok: false, error: 'chalk_' + ping.status });
    return json({ ok: true, account: { name: 'Chalk CRM', id: 'chalk' } });
  }

  if (name === 'searchJobberClients') {
    const q = String(body.q || '').trim();
    if (q.length < 2) return json({ ok: true, nodes: [] });
    if (!connected) return json({ ok: true, nodes: [], error: 'chalk_disconnected' });
    const nodes = await lookupChalkClients(env, q);
    return json({ ok: true, nodes: nodes.slice(0, Number(body.limit) || 8) });
  }

  if (name === 'jobberRequests') {
    if (!connected) return json({ ok: true, nodes: [] });
    const { status, data } = await chalkJson(env, '/api/requests');
    if (status >= 400) return json({ ok: true, nodes: [] });
    const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
    const nodes = list.slice(0, 50).map((r: any) => ({
      id: r.id,
      clientId: r.client_id || '',
      propertyId: r.property_id || '',
      customerName: r.client_name || r.name || '',
      firstName: r.first_name || '',
      lastName: r.last_name || '',
      companyName: r.company_name || '',
      email: r.email || '',
      phone: r.phone || '',
      title: r.title || '',
      street1: r.street1 || '',
      city: r.city || '',
      province: r.province || '',
      postalCode: r.postal_code || '',
      address: r.address || '',
      requestStatus: r.status || r.stage || '',
      createdAt: r.created_at || '',
    }));
    return json({ ok: true, nodes });
  }

  if (name === 'pushToJobber') {
    if (!rep) return json({ ok: false, error: 'not_signed_in' }, 401);
    if (!connected) return json({ ok: false, error: 'Chalk API key is not set on this draft.' });
    const quoteRowId = String(body.quoteRowId || '');
    const row = await env.CALC_DB.prepare('SELECT * FROM quotes WHERE id = ?').bind(quoteRowId).first<any>();
    if (!row) return json({ ok: false, error: 'quote_not_found' });
    if (row.chalk_quote_id && !body.force) {
      let existingPayload: any = {};
      try {
        existingPayload = JSON.parse(row.payload);
      } catch {
        existingPayload = {};
      }
      await syncChalkQuoteCopy(env, String(row.chalk_quote_id), existingPayload);
      const attachments = await attachQuotePhotos(env, _request, String(row.chalk_quote_id), existingPayload);
      const adminUrl = await resolveChalkOfficeQuoteUrl(env, String(row.chalk_quote_id));
      return json({
        ok: true,
        alreadyPushed: true,
        jobberQuoteId: row.chalk_quote_id,
        jobberQuoteNumber: row.chalk_quote_number,
        jobberWebUri: adminUrl,
        referencePhotoCount: attachments.attached,
        attachments,
      });
    }
    let payload: any = {};
    try {
      payload = JSON.parse(row.payload);
    } catch {
      payload = {};
    }
    const customer = payload.customer || {};
    let first = String(customer.firstName || '').trim();
    let last = String(customer.lastName || '').trim();
    if (!first) {
      const split = splitName(customer.name || customer.companyName || 'Customer');
      first = split.first;
      last = last || split.last;
    }
    const clientBody: Json = customer.companyName
      ? { company_name: customer.companyName, first_name: first, last_name: last, lead_source: 'Employee calc (Pages draft)' }
      : { first_name: first, last_name: last, lead_source: 'Employee calc (Pages draft)' };
    let clientId = String(customer.jobberClientId || '').trim();
    if (!clientId) {
      const created = await chalkJson(env, '/api/clients', { method: 'POST', body: JSON.stringify(clientBody) });
      const createdClient = unwrap(created.data, ['id']);
      if (created.status >= 400 || !createdClient?.id) {
        return json({ ok: false, error: 'chalk_client_failed', detail: created.data, input: clientBody }, 502);
      }
      clientId = String(createdClient.id);
      if (customer.phone) {
        await chalkJson(env, '/api/clients/' + clientId + '/phones', {
          method: 'POST',
          body: JSON.stringify({ number: String(customer.phone), label: 'Mobile', sms_ok: 1, is_primary: 1 }),
        });
      }
      if (customer.email) {
        await chalkJson(env, '/api/clients/' + clientId + '/emails', {
          method: 'POST',
          body: JSON.stringify({ address: String(customer.email), label: 'Main', is_primary: 1 }),
        });
      }
    }
    let propertyId = String(customer.jobberPropertyId || '').trim();
    if (!propertyId) {
      const prop = await chalkJson(env, '/api/properties', {
        method: 'POST',
        body: JSON.stringify({
          client_id: clientId,
          street1: customer.street1 || customer.address || '',
          street2: customer.street2 || '',
          city: customer.city || '',
          province: customer.province || 'SC',
          postal_code: customer.postalCode || '',
          country: 'United States',
        }),
      });
      const createdProp = unwrap(prop.data, ['id']);
      if (prop.status >= 400 || !createdProp?.id) {
        return json({ ok: false, error: 'chalk_property_failed', detail: prop.data }, 502);
      }
      propertyId = String(createdProp.id);
    }

    const projects = Array.isArray(payload.projects) ? payload.projects : [];
    const { line_items, sentLineItems, bundle } = buildQuoteLineItems(payload);

    const title =
      (projects[0] && (projects[0]._jobberName || projects[0].type)) ||
      customer.name ||
      'Estimate';
    const officeNotes = buildChalkOfficeNotes(payload);
    const createdQuote = await chalkJson(env, '/api/quotes', {
      method: 'POST',
      body: JSON.stringify({
        client_id: clientId,
        property_id: propertyId,
        title,
        line_items,
      }),
    });
    const createdQ = unwrap(createdQuote.data, ['id', 'number', 'total_cents']);
    if (createdQuote.status >= 400 || !createdQ?.id) {
      return json(
        { ok: false, error: 'chalk_quote_failed', detail: createdQuote.data, input: { title, line_items } },
        502,
      );
    }
    const chalkId = String(createdQ.id);
    const chalkNumber = createdQ.number;
    await postQuoteNote(env, chalkId, officeNotes);
    const attachments = await attachQuotePhotos(env, _request, chalkId, payload);
    const web = await resolveChalkOfficeQuoteUrl(env, chalkId);
    await env.CALC_DB.prepare(
      'UPDATE quotes SET chalk_quote_id = ?, chalk_quote_number = ?, chalk_web_uri = ?, updated_at = ? WHERE id = ?',
    )
      .bind(chalkId, chalkNumber || null, web, nowIso(), quoteRowId)
      .run();

    const sentFinal = Number(payload.totals?.final || Number(createdQ.total_cents || 0) / 100);
    return json({
      ok: true,
      jobberQuoteId: chalkId,
      jobberQuoteNumber: chalkNumber,
      jobberWebUri: web,
      sentLineItems,
      sentSubtotal: payload.totals?.sumBeforeBundle || sentFinal,
      sentDiscount: bundle,
      sentFinalTotal: sentFinal,
      referencePhotoCount: attachments.attached,
      attachments,
    });
  }

  if (name === 'sendQuoteToCustomer') {
    if (!rep) return json({ ok: false, error: 'not_signed_in' }, 401);
    if (!connected) return json({ ok: false, error: 'Chalk API key is not set on this draft.' });
    const quoteRowId = String(body.quoteRowId || '');
    const row = await env.CALC_DB.prepare('SELECT * FROM quotes WHERE id = ?').bind(quoteRowId).first<any>();
    if (!row) return json({ ok: false, error: 'quote_not_found' });
    const chalkId = String(row.chalk_quote_id || '').trim();
    if (!chalkId) return json({ ok: false, error: 'not_pushed', detail: 'Push the quote to Chalk first.' });
    let sendPayload: any = {};
    try {
      sendPayload = JSON.parse(row.payload);
    } catch {
      sendPayload = {};
    }
    await attachQuotePhotos(env, _request, chalkId, sendPayload);
    const sent = await chalkJson(env, '/api/quotes/' + encodeURIComponent(chalkId) + '/send', {
      method: 'POST',
      body: JSON.stringify({ email: true, sms: true }),
    });
    if (sent.status >= 400) {
      const smsOnly = await chalkJson(env, '/api/quotes/' + encodeURIComponent(chalkId) + '/send', {
        method: 'POST',
        body: JSON.stringify({ email: false, sms: true }),
      });
      if (smsOnly.status < 400) {
        return json({
          ok: true,
          email: false,
          sms: true,
          jobberQuoteId: chalkId,
          jobberWebUri: await resolveChalkOfficeQuoteUrl(env, chalkId),
          warning: sent.data?.error || 'Email was skipped.',
        });
      }
      return json(
        {
          ok: false,
          error: (sent.data && sent.data.error) || 'chalk_send_failed',
          detail: sent.data,
        },
        502,
      );
    }
    return json({
      ok: true,
      email: true,
      sms: true,
      jobberQuoteId: chalkId,
      jobberWebUri: await resolveChalkOfficeQuoteUrl(env, chalkId),
    });
  }

  return null;
}

async function handleMisc(name: string, env: CalcEnv, body: Json, rep: RepRow | null) {
  if (name === 'whoami') {
    return json({
      ok: true,
      employee: { id: rep?.id || '', email: rep?.email || '' },
    });
  }
  if (name === 'getStats') {
    const { results } = await env.CALC_DB.prepare(
      `SELECT payload, date_finished, updated_at FROM quotes WHERE status = 'finished'`,
    ).all<any>();
    const weekAgo = Date.now() - 7 * 86400000;
    const monthAgo = Date.now() - 30 * 86400000;
    let weekC = 0,
      weekT = 0,
      monthC = 0,
      monthT = 0;
    for (const row of results || []) {
      const ts = Date.parse(row.date_finished || row.updated_at || '') || 0;
      let payload: any = {};
      try {
        payload = JSON.parse(row.payload);
      } catch {
        payload = {};
      }
      const total = Number(payload.totals?.final || 0);
      if (ts >= monthAgo) {
        monthC += 1;
        monthT += total;
      }
      if (ts >= weekAgo) {
        weekC += 1;
        weekT += total;
      }
    }
    return json({ ok: true, stats: { week: { count: weekC, total: weekT }, month: { count: monthC, total: monthT } } });
  }
  if (name === 'pipelineCards') return json({ ok: true, cards: [] });
  if (name === 'pipelineSnapshot') {
    return json({ connected: Boolean(env.CHALK_API_KEY), requests: [], quotes: [], jobs: [], errors: [], local: false });
  }
  if (name === 'pipelineCardsUpsert') {
    return json({ ok: true, cards: [] });
  }
  if (name === 'pipelineArchiveJobber' || name === 'pipelineNotePush' || name === 'pipelineCardDelete') {
    return json({ ok: true });
  }
  if (name === 'pipelineLeadPush') return json({ ok: true, alreadyLinked: false });
  if (name === 'listCustomerSubmissions' || name === 'listCustomerDrafts') {
    return json({ ok: true, items: [] });
  }
  if (name === 'deleteCustomerSubmission' || name === 'deleteCustomerDraft') return json({ ok: true });
  if (name === 'getCustomerCalcStats') {
    return json({
      ok: true,
      totals: { week: 0, month: 0, allTime: 0, jobberFailed: 0, callbacks: 0, jobberSucceeded: 0 },
      money: { weekTotal: 0, monthTotal: 0, allTimeTotal: 0, avgEstimate: 0 },
    });
  }
  if (name === 'swResetAll') return json({ ok: true });
  if (name === 'techNotesList') {
    const { results } = await env.CALC_DB.prepare('SELECT * FROM tech_notes ORDER BY created_at DESC').all<any>();
    return json({
      ok: true,
      items: (results || []).map((n: any) => ({
        _id: n.id,
        note: n.note,
        rep: n.rep,
        context: n.context,
        createdAt: n.created_at,
        resolvedAt: n.resolved_at,
      })),
    });
  }
  if (name === 'techNoteCreate') {
    const nid = id('tn');
    await env.CALC_DB.prepare(
      'INSERT INTO tech_notes (id, note, rep, context, created_at) VALUES (?, ?, ?, ?, ?)',
    )
      .bind(nid, String(body.note || ''), String(body.rep || ''), String(body.context || ''), nowIso())
      .run();
    return json({ ok: true });
  }
  if (name === 'techNoteResolve') {
    const resolved = body.reopen ? null : nowIso();
    await env.CALC_DB.prepare('UPDATE tech_notes SET resolved_at = ? WHERE id = ?')
      .bind(resolved, String(body.id || ''))
      .run();
    return json({ ok: true });
  }
  return null;
}

export async function handleCalcFunction(name: string, request: Request, env: CalcEnv): Promise<Response> {
  if (!name) return json({ ok: false, error: 'missing_function' }, 400);
  if (!env.CALC_DB) return json({ ok: false, error: 'calc_db_unbound' }, 500);

  const body = await readBody(request);
  const token = bearerToken(request);
  const rep = await getRep(env, token);

  if (name === 'uploadReferencePhoto') return handlePhoto(env, body, request, rep);

  const chalked = await handleChalk(name, env, body, request, rep);
  if (chalked) return chalked;

  return (
    (await handleAuth(name, env, body, request, rep)) ||
    (await handleQuotes(name, env, body, rep)) ||
    (await handlePricing(name, env, body, rep)) ||
    (await handleMisc(name, env, body, rep)) ||
    json({ ok: false, error: 'unknown_function', name }, 404)
  );
}
