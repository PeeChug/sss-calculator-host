/**
 * Live Google rating for the marketing site.
 * Origin hashes: 4906e9f4 (fallback live:false) and ebafb7d4 (live scrape).
 * Cache API ~6h. HTTP cache 60s. Fallback 5.0 / 33 when Maps scrape is cold.
 */
export interface RatingEnv {
  CF_BROWSER_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
}

const PLACE_ID = 'ChIJc8FxcY1ajWoRsVu7MacAS8o';
const FALLBACK = { rating: 5, count: 33 };
const CACHE_KEY = 'https://sss.internal/api/google-rating';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=60, s-maxage=60',
      'access-control-allow-origin': '*',
    },
  });
}

function parseRating(html: string): { rating: number; count: number } | null {
  if (!html) return null;
  const ratingMatch =
    html.match(/"ratingValue"\s*:\s*"?([0-9.]+)"?/) ||
    html.match(/aria-label="([0-9.]+)\s*stars?/i) ||
    html.match(/([0-9]\.[0-9])\s*stars?/i);
  const countMatch =
    html.match(/"reviewCount"\s*:\s*"?(\d+)"?/) ||
    html.match(/"ratingCount"\s*:\s*"?(\d+)"?/) ||
    html.match(/([\d,]+)\s*Google reviews/i) ||
    html.match(/([\d,]+)\s*reviews/i);
  if (!ratingMatch || !countMatch) return null;
  const rating = Number(ratingMatch[1]);
  const count = Number(String(countMatch[1]).replace(/,/g, ''));
  if (!Number.isFinite(rating) || rating < 4 || rating > 5) return null;
  if (!Number.isFinite(count) || count < 1) return null;
  return { rating, count };
}

async function scrapeMaps(env: RatingEnv): Promise<{ rating: number; count: number } | null> {
  const token = env.CF_BROWSER_TOKEN;
  const account = env.CF_ACCOUNT_ID;
  if (!token || !account) return null;
  const mapsUrl =
    'https://www.google.com/maps/search/?api=1&query=Superior+Stain+Solutions&query_place_id=' + PLACE_ID;
  try {
    const res = await fetch('https://api.cloudflare.com/client/v4/accounts/' + account + '/browser-rendering/content', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        url: mapsUrl,
        gotoOptions: { waitUntil: 'networkidle0', timeout: 20000 },
        rejectResourceTypes: ['image', 'font', 'media'],
      }),
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as any;
    const html =
      (typeof payload?.result === 'string' && payload.result) ||
      (typeof payload?.result?.content === 'string' && payload.result.content) ||
      '';
    return parseRating(html);
  } catch {
    return null;
  }
}

export const onRequestGet: PagesFunction<RatingEnv> = async (context) => {
  const cache = caches.default;
  const cacheReq = new Request(CACHE_KEY, { method: 'GET' });
  const hit = await cache.match(cacheReq);
  if (hit) {
    const cloned = hit.clone();
    try {
      const data = (await cloned.json()) as any;
      if (data && typeof data.rating === 'number' && typeof data.count === 'number') {
        return json(data);
      }
    } catch {
      /* fall through */
    }
  }

  const live = await scrapeMaps(context.env);
  const body = live
    ? { rating: live.rating, count: live.count, live: true, fetched: new Date().toISOString() }
    : { rating: FALLBACK.rating, count: FALLBACK.count, live: false };

  const response = json(body);
  context.waitUntil(
    cache.put(
      cacheReq,
      new Response(JSON.stringify(body), {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'public, max-age=' + Math.floor(CACHE_TTL_MS / 1000),
        },
      }),
    ),
  );
  return response;
};
