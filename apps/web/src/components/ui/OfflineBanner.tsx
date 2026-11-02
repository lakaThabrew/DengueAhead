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
      backgroundColor: '#FEF3C7',
      borderBottom: '1px solid #FCD34D',
      padding: '8px 24px',
      fontSize: '13px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#78350F'
    }}
  >
    <span aria-hidden="true">⚠</span>
    <span>{message}</span>
  </div>
);
