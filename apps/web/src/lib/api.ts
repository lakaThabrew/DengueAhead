/**
 * Typed fetch helper.
 * Validates JSON responses with a Zod schema before returning them.
 * Never throws for network/HTTP errors — returns a typed Result instead.
 */
import type { ZodSchema } from 'zod';

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; kind: 'network' | 'http' | 'invalid'; status?: number; message: string };

export interface ApiFetchOptions {
  retries?: number;
  retryDelayMs?: number;
  signal?: AbortSignal;
}

export async function apiFetch<T>(
  url: string,
  schema: ZodSchema<T>,
  options: ApiFetchOptions = {}
): Promise<ApiResult<T>> {
  const maxRetries = options.retries ?? 2;
  const initialDelay = options.retryDelayMs ?? 200;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (options.signal?.aborted) {
      return { ok: false, kind: 'network', message: 'Request aborted' };
    }

    let response: Response;
    try {
      response = await fetch(url, { signal: options.signal });
    } catch (err) {
      if (options.signal?.aborted) {
        return { ok: false, kind: 'network', message: 'Request aborted' };
      }
      if (attempt < maxRetries) {
        const jitter = Math.random() * 50;
        const delay = initialDelay * Math.pow(2, attempt) + jitter;
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }
      return { ok: false, kind: 'network', message: String(err) };
    }

    // If HTTP 503 Service/Database Unavailable and retries left, back off and retry
    if (response.status === 503 && attempt < maxRetries) {
      const jitter = Math.random() * 50;
      const delay = initialDelay * Math.pow(2, attempt) + jitter;
      await new Promise((res) => setTimeout(res, delay));
      continue;
    }

    if (!response.ok) {
      return {
        ok: false,
        kind: 'http',
        status: response.status,
        message: `HTTP ${response.status}`
      };
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch {
      return { ok: false, kind: 'invalid', message: 'Response is not valid JSON' };
    }

    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return {
        ok: false,
        kind: 'invalid',
        message: `Schema mismatch: ${parsed.error.message}`
      };
    }

    return { ok: true, data: parsed.data };
  }

  return { ok: false, kind: 'network', message: 'Max retries exhausted' };
}
