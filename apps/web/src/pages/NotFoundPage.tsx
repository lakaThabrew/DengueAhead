import React from 'react';
import { navigate } from '../lib/router.js';
import { Button } from '../components/ui/Button.js';

export const NotFoundPage: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        textAlign: 'center',
        backgroundColor: '#F8FAFC'
      }}
    >
      <div
        style={{
          backgroundColor: '#EFF6FF',
          color: '#2563EB',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          fontWeight: 800,
          marginBottom: '24px'
        }}
      >
        404
      </div>
      <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0B1730', marginBottom: '12px' }}>
        Page Not Found
      </h1>
      <p
        style={{
          fontSize: '15px',
          color: '#64748B',
          maxWidth: '440px',
          marginBottom: '32px',
          lineHeight: 1.6
        }}
      >
        The requested URL or district resource does not exist. Check the URL path or return to the
        overview dashboard.
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <Button onClick={() => navigate('/app/overview')}>Go to Dashboard</Button>
        <Button variant="ghost" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </div>
    </div>
  );
};
