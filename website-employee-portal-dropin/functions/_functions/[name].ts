/**
 * Pages Function: proxy /_functions/:name to the live Wix Velo HTTP functions.
 *
 * Why this exists: <sss-calculator> is unchanged. Every API call in
 * sss-calculator.js is relative (`fetch('/_functions/...')`). On Wix that
 * hits Velo. On this Astro/Pages host it would 404 unless we forward it.
 *
 * This does not change www.superiorstainsolutions.com, the Wix employee
 * page, or sss-calculator.js. Employees using
 * /employee-estimator-v2 today keep the same JS and the same backend.
 *
 * Special case: GET jobberStartAuth is 302'd to Wix so Jobber OAuth
 * redirect_uri stays on the domain Jobber already has allowlisted.
 */
const WIX_ORIGIN = 'https://www.superiorstainsolutions.com';

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'cf-connecting-ip',
  'cf-ipcountry',
  'cf-ray',
  'cf-visitor',
  'cdn-loop',
  'x-forwarded-for',
  'x-forwarded-proto',
  'x-real-ip',
]);

function tokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith('sss_auth_token=')) {
      const raw = trimmed.slice('sss_auth_token='.length);
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }
  return null;
}

function outboundHeaders(request: Request): Headers {
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    headers.set(key, value);
  });

  if (!headers.get('Authorization')) {
    const fromCookie = tokenFromCookie(request.headers.get('Cookie'));
    if (fromCookie) headers.set('Authorization', 'Bearer ' + fromCookie);
  }

  headers.set('Accept', headers.get('Accept') || 'application/json, */*');
  headers.delete('accept-encoding');
  return headers;
}

export const onRequest: PagesFunction = async (context) => {
  const name = String(context.params.name || '').replace(/[^A-Za-z0-9_-]/g, '');
  if (!name) {
    return new Response(JSON.stringify({ ok: false, error: 'missing_function' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  const incoming = new URL(context.request.url);
  const wixUrl = `${WIX_ORIGIN}/_functions/${name}${incoming.search}`;

  // OAuth consent must run on Wix so Jobber's registered redirect_uri matches.
  // Browser follows this 302 onto www (not a proxied Location: Jobber) so any
  // Wix Set-Cookie on jobberStartAuth is stored on www before Jobber redirects.
  if (name === 'jobberStartAuth' && context.request.method === 'GET') {
    return Response.redirect(wixUrl, 302);
  }

  const init: RequestInit = {
    method: context.request.method,
    headers: outboundHeaders(context.request),
    redirect: 'manual',
  };

  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    init.body = context.request.body;
    // Required when forwarding a ReadableStream in Workers/Pages.
    (init as { duplex?: string }).duplex = 'half';
  }

  let upstream: Response;
  try {
    upstream = await fetch(wixUrl, init);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'proxy_fetch_failed';
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 502,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  const headers = new Headers(upstream.headers);
  headers.delete('content-encoding');
  headers.delete('content-length');
  headers.delete('transfer-encoding');
  // Wix Set-Cookie uses Domain=www.superiorstainsolutions.com; the browser
  // on pages.dev will ignore it. Auth already uses Bearer from the JSON body.
  headers.delete('set-cookie');
  headers.set('cache-control', 'private, no-store');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
};
