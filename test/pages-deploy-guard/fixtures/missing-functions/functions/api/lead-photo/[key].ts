export async function onRequest() {
  return new Response("not found", { status: 404 });
}
