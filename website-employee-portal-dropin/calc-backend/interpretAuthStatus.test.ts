import { test } from 'node:test';
import assert from 'node:assert/strict';

function interpretAuthStatusPayload(httpOk: boolean, contentType: string | null, rawText: string) {
  const ctype = String(contentType || '').toLowerCase();
  if (!httpOk || !ctype.includes('application/json')) {
    return { kind: 'unreachable', status: null };
  }
  let status: any = null;
  try { status = JSON.parse(rawText); } catch {
    return { kind: 'unreachable', status: null };
  }
  if (!status || typeof status !== 'object') return { kind: 'unreachable', status: null };
  if (status.ok && status.rep) return { kind: 'signed_in', status };
  if (status.bootstrap === true) return { kind: 'bootstrap', status };
  return { kind: 'signed_out', status };
}

test('HTML 404 is unreachable, not bootstrap', () => {
  const r = interpretAuthStatusPayload(false, 'text/html; charset=utf-8', '<!DOCTYPE html><title>404</title>');
  assert.equal(r.kind, 'unreachable');
});

test('JSON parse failure is unreachable, not bootstrap', () => {
  const r = interpretAuthStatusPayload(true, 'application/json', '<!DOCTYPE html>');
  assert.equal(r.kind, 'unreachable');
});

test('empty reps table is bootstrap only when flagged', () => {
  const r = interpretAuthStatusPayload(true, 'application/json; charset=utf-8', '{"ok":false,"bootstrap":true}');
  assert.equal(r.kind, 'bootstrap');
});

test('unsigned with reps is sign-in, not bootstrap', () => {
  const r = interpretAuthStatusPayload(true, 'application/json; charset=utf-8', '{"ok":false}');
  assert.equal(r.kind, 'signed_out');
});

test('signed-in rep reaches dashboard', () => {
  const r = interpretAuthStatusPayload(true, 'application/json', '{"ok":true,"rep":{"initials":"AG"}}');
  assert.equal(r.kind, 'signed_in');
});
