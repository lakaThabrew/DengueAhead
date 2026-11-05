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
  const trendSymbol = trend === 'up' ? '▲' : trend === 'down' ? '▼' : null;
  const trendColor = trend === 'up' ? '#F43F5E' : trend === 'down' ? '#10B981' : '#94A3B8';

  return (
    <div
      style={{
        backgroundColor: '#0B1329',
        border: '1px solid #1E293B',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease, transform 0.2s ease'
      }}
    >
      {/* Top subtle glow line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '20%',
          right: '20%',
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          opacity: 0.6
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {icon && (
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color
              }}
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
          <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>{label}</span>
        </div>

        {trendSymbol && (
          <span
            style={{
              fontSize: '11px',
              color: trendColor,
              fontWeight: 700,
              backgroundColor: `${trendColor}1A`,
              padding: '2px 8px',
              borderRadius: '9999px',
              border: `1px solid ${trendColor}33`,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>{trendSymbol}</span>
            <span>{trend === 'up' ? 'Surge' : 'Decline'}</span>
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
        <span
          style={{
            fontSize: '32px',
            fontWeight: 900,
            color,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          {value}
        </span>
      </div>

      {subtitle && (
        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>{subtitle}</span>
      )}
    </div>
  );
};
