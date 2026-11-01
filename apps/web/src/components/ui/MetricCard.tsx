import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
  subtitle?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  trend,
  color = 'var(--color-primary)',
  subtitle
}) => {
  const trendSymbol = trend === 'up' ? '↑' : trend === 'down' ? '↓' : null;
  const trendColor = trend === 'up' ? '#DC4754' : trend === 'down' ? '#0D9488' : '#64748B';

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon && <span aria-hidden="true">{icon}</span>}
        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
          {label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontSize: '32px', fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
        {trendSymbol && (
          <span style={{ fontSize: '16px', color: trendColor, fontWeight: 700 }}>
            {trendSymbol}
          </span>
        )}
      </div>
      {subtitle && (
        <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>{subtitle}</span>
      )}
    </div>
  );
};
