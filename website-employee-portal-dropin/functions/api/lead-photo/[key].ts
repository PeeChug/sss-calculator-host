export interface LeadPhotoEnv {
  LEAD_PHOTOS?: R2Bucket;
}

export const onRequestGet: PagesFunction<LeadPhotoEnv> = async (context) => {
  const key = String(context.params.key || '').replace(/[^A-Za-z0-9._-]/g, '');
  if (!key) return new Response('missing', { status: 400, headers: { 'cache-control': 'no-store' } });
  if (!context.env.LEAD_PHOTOS) {
    return new Response('not found', { status: 404, headers: { 'cache-control': 'no-store' } });
  }
  const obj = await context.env.LEAD_PHOTOS.get(key);
  if (!obj) return new Response('not found', { status: 404, headers: { 'cache-control': 'no-store' } });
  const headers = new Headers();
  headers.set('content-type', obj.httpMetadata?.contentType || 'image/jpeg');
  headers.set('cache-control', 'private, max-age=86400');
  return new Response(obj.body, { headers });
};
