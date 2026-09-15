/**
 * Public website estimate/contact form → ChalkCRM.
 *
 * Matches Origin hash 4906e9f4 / ebafb7d4 (`fileWebsiteLead`):
 * client (no phone/email on create) + nested phones/emails once + property +
 * request source Website / stage new_lead. Local D1 + R2 copy. No quote.
 *
 * Do not fetch Jobber, Web3forms, or any LEAD_WEBHOOK_*. Do not POST test leads.
 */
export interface LeadEnv {
  LEADS_DB?: D1Database;
  LEAD_PHOTOS?: R2Bucket;
  CHALK_API_KEY?: string;
  CHALK_API_BASE?: string;
}

const CHALK_DEFAULT = 'https://app.chalkcrm.com';
const MAX_PHOTOS = 6;
const MAX_PHOTO_BYTES = 12 * 1024 * 1024;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'private, no-store',
      'access-control-allow-origin': '*',
    },
  });
}

function nowStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    d.getUTCFullYear() +
    '-' +
    p(d.getUTCMonth() + 1) +
    '-' +
    p(d.getUTCDate()) +
    ' ' +
    p(d.getUTCHours()) +
    ':' +
    p(d.getUTCMinutes()) +
    ':' +
    p(d.getUTCSeconds())
  );
}

function splitName(name: string): { first: string; last: string } {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return { first: 'Customer', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

function digits(s: string): string {
  return String(s || '').replace(/\D/g, '');
}

function last10(s: string): string {
  const d = digits(s);
  return d.length >= 10 ? d.slice(-10) : d;
}

function toE164(phone: string): string {
  const d = digits(phone);
  if (d.length === 10) return '+1' + d;
  if (d.length === 11 && d.startsWith('1')) return '+' + d;
  return String(phone || '').trim();
}

function chalkBase(env: LeadEnv): string {
  return (env.CHALK_API_BASE || CHALK_DEFAULT).replace(/\/$/, '');
}

async function chalkFetch(env: LeadEnv, path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', 'Bearer ' + (env.CHALK_API_KEY || ''));
  headers.set('Accept', 'application/json');
  if (!headers.has('user-agent')) headers.set('User-Agent', 'SSS-website-lead/1.0');
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  return fetch(chalkBase(env) + path, { ...init, headers });
}

async function chalkJson(env: LeadEnv, path: string, init: RequestInit = {}): Promise<{ status: number; data: any }> {
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

function unwrapId(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const root = data as Record<string, unknown>;
  for (const nest of [root, root.client, root.property, root.request, root.lead] as unknown[]) {
    if (nest && typeof nest === 'object' && !Array.isArray(nest)) {
      const id = String((nest as Record<string, unknown>).id || '').trim();
      if (id) return id;
    }
  }
  return '';
}

function isArchived(row: any): boolean {
  return Boolean(row?.archived_at || row?.archived || row?.date_archived);
}

async function hydrateClient(env: LeadEnv, id: string, fallback?: any): Promise<any | null> {
  if (!id) return fallback || null;
  const { status, data } = await chalkJson(env, '/api/clients/' + encodeURIComponent(id));
  if (status >= 400 || !data) return fallback || null;
  const nested = data.client && typeof data.client === 'object' ? { ...data, ...data.client } : data;
  return { ...fallback, ...nested, id: String(nested.id || fallback?.id || id) };
}

async function lookupClients(env: LeadEnv, q: string): Promise<any[]> {
  const encoded = encodeURIComponent(q);
  const found = new Map<string, any>();
  const take = async (row: any) => {
    if ((row?.kind || row?.type) && row.kind !== 'client' && row.type !== 'client') return;
    const inner = row?.client && typeof row.client === 'object' ? { ...row, ...row.client } : row;
    const id = String(inner?.id || '').trim();
    if (!id) return;
    const hydrated = await hydrateClient(env, id, inner);
    if (!hydrated || isArchived(hydrated)) return;
    if (!found.has(id)) found.set(id, hydrated);
  };
  const paths = ['/api/clients/lookup?q=' + encoded, '/api/clients?q=' + encoded];
  const results = await Promise.all(paths.map((p) => chalkJson(env, p)));
  for (const res of results) {
    if (res.status >= 400) continue;
    for (const row of chalkList(res.data).slice(0, 8)) await take(row);
  }
  return Array.from(found.values());
}

function phoneMatches(row: any, last: string): boolean {
  if (!last || last.length < 7) return false;
  const blobs = [
    row.phone,
    row.primary_phone,
    ...(Array.isArray(row.phones) ? row.phones.map((p: any) => p?.number || p?.phone || '') : []),
  ];
  return blobs.some((v) => last10(String(v || '')) === last);
}

function emailMatches(row: any, email: string): boolean {
  const want = email.trim().toLowerCase();
  if (!want) return false;
  const blobs = [
    row.email,
    row.primary_email,
    ...(Array.isArray(row.emails) ? row.emails.map((e: any) => e?.address || e?.email || '') : []),
  ];
  return blobs.some((v) => String(v || '').trim().toLowerCase() === want);
}

function propertiesOf(row: any): any[] {
  const list = Array.isArray(row?.properties) ? row.properties : [];
  return list.filter(Boolean);
}

function sameStreet(a: string, b: string): boolean {
  const n = (s: string) =>
    String(s || '')
      .toLowerCase()
      .replace(/[.,#]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  return Boolean(n(a)) && n(a) === n(b);
}

async function parseBody(request: Request): Promise<{
  fields: Record<string, string>;
  photos: File[];
}> {
  const ctype = (request.headers.get('content-type') || '').toLowerCase();
  const fields: Record<string, string> = {};
  const photos: File[] = [];
  if (ctype.includes('multipart/form-data') || ctype.includes('application/x-www-form-urlencoded')) {
    const form = await request.formData();
    for (const [key, value] of form.entries()) {
      if (typeof value === 'string') {
        if (!(key in fields)) fields[key] = value;
        continue;
      }
      if (key === 'photos' && value && typeof value === 'object' && 'arrayBuffer' in value) {
        const file = value as File;
        if (file.size > 0) photos.push(file);
      }
    }
    return { fields, photos };
  }
  if (ctype.includes('application/json')) {
    try {
      const parsed = await request.json();
      if (parsed && typeof parsed === 'object') {
        for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
          if (typeof v === 'string') fields[k] = v;
        }
      }
    } catch {
      /* invalid_body below */
    }
  }
  return { fields, photos };
}

function validate(fields: Record<string, string>): string | null {
  if (String(fields.name || '').trim().length < 2) return 'invalid_body';
  if (last10(fields.phone || '').length < 7) return 'invalid_body';
  if (!String(fields.email || '').includes('@')) return 'invalid_body';
  if (String(fields.address || '').trim().length < 5) return 'invalid_body';
  if (String(fields.town || '').trim().length < 2) return 'invalid_body';
  if (!String(fields.service || '').trim()) return 'invalid_body';
  if (String(fields.message || '').trim().length < 4) return 'invalid_body';
  return null;
}

function photoExt(file: File, index: number): { key: string; contentType: string } {
  const type = (file.type || '').toLowerCase();
  const name = String(file.name || '');
  const id = crypto.randomUUID().replace(/-/g, '');
  if (type.includes('png') || /\.png$/i.test(name)) return { key: id + '-' + index + '.png', contentType: 'image/png' };
  if (type.includes('webp') || /\.webp$/i.test(name)) return { key: id + '-' + index + '.webp', contentType: 'image/webp' };
  return { key: id + '-' + index + '.jpg', contentType: 'image/jpeg' };
}

async function storePhotos(
  env: LeadEnv,
  origin: string,
  photos: File[],
): Promise<{ urls: string[]; buffers: { bytes: ArrayBuffer; contentType: string; name: string }[]; stored: number }> {
  const urls: string[] = [];
  const buffers: { bytes: ArrayBuffer; contentType: string; name: string }[] = [];
  const slice = photos.slice(0, MAX_PHOTOS).filter((f) => f.size > 0 && f.size <= MAX_PHOTO_BYTES);
  if (!env.LEAD_PHOTOS || !slice.length) return { urls, buffers, stored: 0 };
  const puts = slice.map(async (file, i) => {
    const { key, contentType } = photoExt(file, i);
    const bytes = await file.arrayBuffer();
    await env.LEAD_PHOTOS!.put(key, bytes, { httpMetadata: { contentType } });
    const url = origin.replace(/\/$/, '') + '/api/lead-photo/' + key;
    return { url, bytes, contentType, name: file.name || key };
  });
  const saved = await Promise.all(puts);
  for (const item of saved) {
    urls.push(item.url);
    buffers.push({ bytes: item.bytes, contentType: item.contentType, name: item.name });
  }
  return { urls, buffers, stored: saved.length };
}

function requestDetails(fields: Record<string, string>, photoUrls: string[]): string {
  const lines = [
    String(fields.message || '').trim(),
    '',
    'Job address: ' + String(fields.address || '').trim() + ', ' + String(fields.town || '').trim() + ', SC',
    'Service: ' + String(fields.service || '').trim(),
    'Form: ' + (String(fields.path || '').trim() || String(fields.source || '').trim() || '/'),
  ];
  if (photoUrls.length) {
    lines.push('Photos:');
    for (const url of photoUrls) lines.push(url);
  }
  return lines.join('\n').trim();
}

async function attachRequestFiles(
  env: LeadEnv,
  requestId: string,
  buffers: { bytes: ArrayBuffer; contentType: string; name: string }[],
): Promise<void> {
  if (!requestId || !buffers.length) return;
  await Promise.all(
    buffers.map(async (file) => {
      const params = new URLSearchParams({
        entity_type: 'request',
        entity_id: requestId,
        filename: file.name || 'photo.jpg',
      });
      await chalkFetch(env, '/api/files?' + params.toString(), {
        method: 'PUT',
        headers: { 'content-type': file.contentType },
        body: file.bytes,
      });
    }),
  );
}

async function insertLocalLead(env: LeadEnv, fields: Record<string, string>): Promise<void> {
  if (!env.LEADS_DB) return;
  await env.LEADS_DB.prepare(
    `INSERT INTO leads (name, phone, email, address, town, service, message, source, path, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      String(fields.name || '').trim(),
      String(fields.phone || '').trim(),
      String(fields.email || '').trim(),
      String(fields.address || '').trim(),
      String(fields.town || '').trim(),
      String(fields.service || '').trim(),
      String(fields.message || '').trim(),
      String(fields.source || '').trim() || 'website',
      String(fields.path || '').trim() || '/',
      nowStamp(),
    )
    .run();
}

async function fileWebsiteLead(
  env: LeadEnv,
  fields: Record<string, string>,
  photoUrls: string[],
): Promise<{ requestId: string }> {
  const name = splitName(fields.name);
  const phone = toE164(fields.phone);
  const email = String(fields.email || '').trim();
  const last = last10(fields.phone);
  const path = String(fields.path || '').trim() || '/';
  const street1 = String(fields.address || '').trim();
  const city = String(fields.town || '').trim();

  let client: any = null;
  if (last.length >= 7) {
    const hits = await lookupClients(env, last);
    client = hits.find((row) => phoneMatches(row, last)) || null;
  }
  if (!client && email) {
    const hits = await lookupClients(env, email);
    client = hits.find((row) => emailMatches(row, email)) || null;
  }

  let clientId = String(client?.id || '').trim();
  if (!clientId) {
    const created = await chalkJson(env, '/api/clients', {
      method: 'POST',
      body: JSON.stringify({
        first_name: name.first,
        last_name: name.last,
        lead_source: 'Website form',
        campaign_name: 'Website',
        ad_name: path,
        is_lead: 1,
      }),
    });
    clientId = unwrapId(created.data);
    if (created.status >= 400 || !clientId) {
      throw new Error('chalk_client_failed');
    }
    await Promise.all([
      chalkJson(env, '/api/clients/' + clientId + '/phones', {
        method: 'POST',
        body: JSON.stringify({ number: phone, label: 'Mobile', sms_ok: 1, is_primary: 1 }),
      }),
      chalkJson(env, '/api/clients/' + clientId + '/emails', {
        method: 'POST',
        body: JSON.stringify({ address: email, label: 'Main', is_primary: 1 }),
      }),
    ]);
    client = await hydrateClient(env, clientId);
  }

  let propertyId = '';
  const existingProp = propertiesOf(client).find((p) => sameStreet(p.street1 || p.street || '', street1));
  if (existingProp?.id) propertyId = String(existingProp.id);
  if (!propertyId) {
    const prop = await chalkJson(env, '/api/properties', {
      method: 'POST',
      body: JSON.stringify({
        client_id: clientId,
        street1,
        city,
        province: 'SC',
        country: 'United States',
      }),
    });
    propertyId = unwrapId(prop.data);
    if (prop.status >= 400 || !propertyId) {
      throw new Error('chalk_property_failed');
    }
  }

  const createdReq = await chalkJson(env, '/api/requests', {
    method: 'POST',
    body: JSON.stringify({
      client_id: clientId,
      property_id: propertyId,
      title: String(fields.service || '').trim(),
      source: 'Website',
      stage: 'new_lead',
      details: requestDetails(fields, photoUrls),
    }),
  });
  const requestId = unwrapId(createdReq.data);
  if (createdReq.status >= 400 || !requestId) {
    throw new Error('chalk_request_failed');
  }
  return { requestId };
}

export const onRequestPost: PagesFunction<LeadEnv> = async (context) => {
  let parsed: { fields: Record<string, string>; photos: File[] };
  try {
    parsed = await parseBody(context.request);
  } catch {
    return json({ ok: false, error: 'invalid_body' }, 400);
  }
  const { fields, photos } = parsed;
  if (String(fields.fax_line || '').trim() || String(fields.company || '').trim()) {
    return json({ ok: true, trapped: true, notified: true, photos_stored: 0 });
  }
  if (!Object.keys(fields).length) return json({ ok: false, error: 'invalid_body' }, 400);
  const invalid = validate(fields);
  if (invalid) return json({ ok: false, error: invalid }, 400);
  if (!context.env.CHALK_API_KEY) {
    return json({ ok: false, error: 'chalk_unavailable', notified: false }, 502);
  }

  const origin = new URL(context.request.url).origin;
  let stored: { urls: string[]; buffers: { bytes: ArrayBuffer; contentType: string; name: string }[]; stored: number };
  try {
    stored = await storePhotos(context.env, origin, photos);
  } catch {
    stored = { urls: [], buffers: [], stored: 0 };
  }

  try {
    const localCopy = insertLocalLead(context.env, fields).catch(() => undefined);
    const filed = await fileWebsiteLead(context.env, fields, stored.urls);
    await localCopy;
    if (stored.buffers.length) {
      context.waitUntil(attachRequestFiles(context.env, filed.requestId, stored.buffers));
    }
    return json({ ok: true, notified: true, photos_stored: stored.stored });
  } catch {
    return json({ ok: false, error: 'chalk_unavailable', notified: false }, 502);
  }
};
