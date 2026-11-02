import React from 'react';
import type { PredictionStatus } from '@dengueahead/contracts';

// ── StatusBadge ───────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: PredictionStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<
  PredictionStatus,
  { label: string; bg: string; color: string; border: string }
> = {
  EMERGING: {
    label: 'Emerging',
    bg: 'var(--color-emerging-bg)',
    color: 'var(--color-emerging)',
    border: '#F59E0B'
  },
  PERSISTENT: {
    label: 'Persistent',
    bg: 'var(--color-persistent-bg)',
    color: 'var(--color-persistent)',
    border: '#EF4444'
  },
  COOLING: {
    label: 'Cooling',
    bg: 'var(--color-cooling-bg)',
    color: 'var(--color-cooling)',
    border: '#0EA5E9'
  },
  STABLE: {
    label: 'Stable',
    bg: 'var(--color-stable-bg)',
    color: 'var(--color-stable)',
    border: '#14B8A6'
  },
  WITHHELD: {
    label: 'Withheld',
    bg: 'var(--color-withheld-bg)',
    color: 'var(--color-withheld)',
    border: '#94A3B8'
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const cfg = STATUS_CONFIG[status];
  const fontSize = size === 'sm' ? '11px' : '12px';
  const padding = size === 'sm' ? '2px 6px' : '3px 8px';
  return (
    <span
      role="status"
      aria-label={`Status: ${cfg.label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize,
        fontWeight: 600,
        padding,
        borderRadius: '9999px',
        backgroundColor: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        whiteSpace: 'nowrap'
      }}
    >
      {cfg.label}
    </span>
  );
};

// ── QualityBadge ─────────────────────────────────────────────────────────────

interface QualityBadgeProps {
  flag: string;
}

export const QualityBadge: React.FC<QualityBadgeProps> = ({ flag }) => (
  <span
    style={{
      display: 'inline-block',
      fontSize: '11px',
      fontWeight: 500,
      padding: '2px 6px',
      borderRadius: '4px',
      backgroundColor: '#FEF3C7',
      color: '#92400E',
      border: '1px solid #FCD34D'
    }}
  >
    {flag}
  </span>
);
