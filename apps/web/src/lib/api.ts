/**
 * Typed fetch helper.
 * Validates JSON responses with a Zod schema before returning them.
 * Never throws for network/HTTP errors — returns a typed Result instead.
 */
import type { ZodSchema } from 'zod';

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; kind: 'network' | 'http' | 'invalid'; status?: number; message: string };

export async function apiFetch<T>(url: string, schema: ZodSchema<T>): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    return { ok: false, kind: 'network', message: String(err) };
  }

  if (!response.ok) {
    return { ok: false, kind: 'http', status: response.status, message: `HTTP ${response.status}` };
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return { ok: false, kind: 'invalid', message: 'Response is not valid JSON' };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, kind: 'invalid', message: `Schema mismatch: ${parsed.error.message}` };
  }

  return { ok: true, data: parsed.data };
}
