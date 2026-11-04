import React from 'react';
import { navigate } from '../lib/router.js';
import { Button } from '../components/ui/Button.js';
import { AppNavbar } from '../components/layout/AppNavbar.js';
import { AppFooter } from '../components/layout/AppFooter.js';

export const NotFoundPage: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#060b18'
      }}
    >
      <AppNavbar currentPath="/404" />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 32px',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(37,99,235,0.15)',
            border: '1px solid rgba(37,99,235,0.4)',
            color: '#38BDF8',
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
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#F8FAFC', marginBottom: '12px' }}>
          Page Not Found
        </h1>
        <p
          style={{
            fontSize: '15px',
            color: '#94a3b8',
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
      <AppFooter />
    </div>
  );
};
