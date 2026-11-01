import React from 'react';
import { Button } from './Button.js';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  isOffline?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry, isOffline }) => (
  <div
    role="alert"
    aria-live="assertive"
    style={{
      backgroundColor: '#FFF1F2',
      border: '1px solid #FECDD3',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      alignItems: 'flex-start'
    }}
  >
    <strong style={{ fontSize: '15px', color: '#9F1239' }}>
      {isOffline ? '⚠ Service Unavailable' : '⚠ Error Loading Data'}
    </strong>
    <p style={{ fontSize: '14px', color: '#BE123C', margin: 0 }}>{message}</p>
    {onRetry && (
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Retry
      </Button>
    )}
  </div>
);
