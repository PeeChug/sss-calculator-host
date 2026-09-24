export async function onRequest() {
  return Response.json({ rating: 5, count: 33, live: false });
}
