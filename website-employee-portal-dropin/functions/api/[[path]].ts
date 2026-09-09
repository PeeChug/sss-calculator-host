/**
 * Preserve existing Pages APIs after a functions-directory deploy that
 * does not include the original lead.ts / google-rating.ts sources
 * (those live in the Origin websites repo).
 *
 * Old hashed deployments stay live. This forwards /api/* to the
 * snapshot this drop-in was applied on top of.
 *
 * Do not send customer test leads through this proxy.
 */
const UPSTREAM = 'https://39d00fb0.superior-stain-solutions.pages.dev';
const PROXY_FLAG = 'x-sss-api-proxy';

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

export const onRequest: PagesFunction = async (context) => {
  if (context.request.headers.get(PROXY_FLAG)) {
    return new Response(JSON.stringify({ ok: false, error: 'proxy_loop' }), {
      status: 508,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  const incoming = new URL(context.request.url);
  if (!incoming.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ ok: false, error: 'not_found' }), {
      status: 404,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  const headers = new Headers();
  context.request.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    headers.set(key, value);
  });
  headers.set(PROXY_FLAG, '1');
  headers.delete('accept-encoding');

  const init: RequestInit = {
    method: context.request.method,
    headers,
    redirect: 'manual',
  };

  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    init.body = context.request.body;
    (init as { duplex?: string }).duplex = 'half';
  }

  let upstream: Response;
  try {
    upstream = await fetch(UPSTREAM + incoming.pathname + incoming.search, init);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'proxy_fetch_failed';
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 502,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  const out = new Headers(upstream.headers);
  out.delete('content-encoding');
  out.delete('content-length');
  out.delete('transfer-encoding');
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: out,
  });
};
