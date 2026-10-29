import React, { useEffect, useState } from 'react';
import { HealthResponseSchema } from '@dengueahead/contracts';
import { apiFetch } from '../../lib/api.js';

/** All possible health check states — icon + text, never colour alone */
export type HealthState =
  'loading' | 'ok' | 'degraded' | 'error' | 'unreachable' | 'invalid' | 'not-configured';

const STATE_LABELS: Record<HealthState, string> = {
  loading: 'Checking…',
  ok: 'API Connected',
  degraded: 'API Degraded',
  error: 'API Error',
  unreachable: 'API Unreachable',
  invalid: 'API Response Invalid',
  'not-configured': 'API Not Configured'
};

const STATE_COLORS: Record<HealthState, string> = {
  loading: '#94a3b8',
  ok: '#0D9488',
  degraded: '#D97706',
  error: '#DC4754',
  unreachable: '#DC4754',
  invalid: '#7c3aed',
  'not-configured': '#94a3b8'
};

interface HealthBadgeProps {
  apiBaseUrl: string | undefined;
}

export const HealthBadge: React.FC<HealthBadgeProps> = ({ apiBaseUrl }) => {
  const [state, setState] = useState<HealthState>('loading');

  useEffect(() => {
    if (!apiBaseUrl) {
      setState('not-configured');
      return;
    }

    let cancelled = false;

    async function check() {
      setState('loading');
      const result = await apiFetch(`${apiBaseUrl}/health`, HealthResponseSchema);
      if (cancelled) return;

      if (!result.ok) {
        if (result.kind === 'network') setState('unreachable');
        else if (result.kind === 'http') setState(result.status === 503 ? 'error' : 'error');
        else setState('invalid');
        return;
      }

      const { status } = result.data;
      if (status === 'ok') setState('ok');
      else if (status === 'degraded') setState('degraded');
      else setState('error');
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl]);

  const color = STATE_COLORS[state];
  const label = STATE_LABELS[state];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`API status: ${label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '13px',
        padding: '4px 10px',
        borderRadius: '20px',
        backgroundColor: `${color}22`,
        color,
        fontWeight: 600,
        border: `1px solid ${color}44`
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: color,
          display: 'inline-block'
        }}
      />
      <span>{label}</span>
    </div>
  );
};
