import React from 'react';

interface OfflineBannerProps {
  message?: string;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  message = 'Database unavailable — displaying cached data or system may be degraded.'
}) => (
  <div
    role="alert"
    aria-live="polite"
    style={{
      backgroundColor: '#1c1200',
      borderBottom: '1px solid #854d0e',
      padding: '8px 24px',
      fontSize: '13px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#fde68a'
    }}
  >
    <span aria-hidden="true">⚠</span>
    <span>{message}</span>
  </div>
);
