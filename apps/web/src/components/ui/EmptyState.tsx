import React from 'react';

interface EmptyStateProps {
  title?: string;
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data available',
  message,
  icon,
  action
}) => (
  <div
    role="status"
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      color: 'var(--color-text-muted)',
      gap: '12px'
    }}
  >
    {icon && (
      <span aria-hidden="true" style={{ fontSize: '40px', opacity: 0.5 }}>
        {icon}
      </span>
    )}
    <strong style={{ fontSize: '16px', color: 'var(--color-text-main)' }}>{title}</strong>
    <p style={{ fontSize: '14px', maxWidth: '360px', margin: 0 }}>{message}</p>
    {action && <div style={{ marginTop: '8px' }}>{action}</div>}
  </div>
);
