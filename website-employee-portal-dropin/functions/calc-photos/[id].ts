import type { CalcEnv } from '../../calc-backend/handler';

export const onRequestGet: PagesFunction<CalcEnv> = async (context) => {
  const id = String(context.params.id || '').replace(/[^A-Za-z0-9._-]/g, '');
  if (!id) return new Response('missing', { status: 400 });
  const obj = await context.env.CALC_PHOTOS.get(id);
  if (!obj) return new Response('not found', { status: 404 });
  const headers = new Headers();
  headers.set('content-type', obj.httpMetadata?.contentType || 'image/jpeg');
  headers.set('cache-control', 'private, max-age=86400');
  return new Response(obj.body, { headers });
};
