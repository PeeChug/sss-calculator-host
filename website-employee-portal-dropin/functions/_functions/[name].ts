import { handleCalcFunction, type CalcEnv } from '../../calc-backend/handler';

export const onRequest: PagesFunction<CalcEnv> = async (context) => {
  const name = String(context.params.name || '').replace(/[^A-Za-z0-9_-]/g, '');
  try {
    return await handleCalcFunction(name, context.request, context.env);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'calc_handler_failed';
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store' },
    });
  }
};
