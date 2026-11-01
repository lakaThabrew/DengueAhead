import React from 'react';
import { navigate } from '../../lib/router.js';
import { HealthBadge } from '../../features/health/HealthBadge.js';

const API_BASE: string =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.[
    'VITE_API_BASE_URL'
  ] ?? 'http://localhost:4000/api/v1';

const NAV_ITEMS = [
  { path: '/app/overview', label: 'Overview' },
  { path: '/app/map', label: 'Risk Map' },
  { path: '/app/compare', label: 'Compare' },
  { path: '/app/history', label: 'History' },
  { path: '/app/model', label: 'Model' },
  { path: '/app/data-quality', label: 'Data Quality' }
];

interface AppShellProps {
  children: React.ReactNode;
  currentPath: string;
}

export const AppShell: React.FC<AppShellProps> = ({ children, currentPath }) => {
  return (
    <div className="app-layout">
      {/* Safety Banner */}
      <div
        role="banner"
        style={{
          backgroundColor: '#0B1730',
          color: '#E2E8F0',
          padding: '6px 24px',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <span>⚠</span>
        <span>
          <strong>Non-clinical decision-support system.</strong> Does not diagnose, prescribe, or
          autonomously direct medical interventions.{' '}
          <button
            onClick={() => navigate('/methodology')}
            style={{
              background: 'none',
              border: 'none',
              color: '#93C5FD',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '12px',
              padding: 0
            }}
          >
            Methodology
          </button>
        </span>
      </div>

      {/* Top Header */}
      <header
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid var(--color-border)',
          padding: '0 24px',
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}
      >
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: 0
          }}
          aria-label="DengueAhead home"
        >
          <div
            style={{
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '16px'
            }}
          >
            DengueAhead
          </div>
          <span
            style={{ fontSize: '13px', color: 'var(--color-text-muted)', display: 'none' }}
            className="header-subtitle"
          >
            Early Warning · Sri Lanka
          </span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <HealthBadge apiBaseUrl={API_BASE} />
        </div>
      </header>

      {/* Body: sidebar + main */}
      <div className="app-layout-body">
        {/* Sidebar */}
        <nav aria-label="App navigation" className="app-sidebar">
          <div style={{ padding: '20px 0' }}>
            {NAV_ITEMS.map((item) => {
              const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 20px',
                    background: isActive ? 'rgba(255,255,255,0.1)' : 'none',
                    border: 'none',
                    color: isActive ? '#FFFFFF' : '#94A3B8',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    borderLeft: isActive ? '3px solid #2563EB' : '3px solid transparent',
                    transition: 'all 0.15s'
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div
            style={{
              padding: '16px 20px',
              marginTop: 'auto',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              fontSize: '11px',
              color: '#475569'
            }}
          >
            <div>EchoBinary</div>
            <div>ModelX 2.0</div>
          </div>
        </nav>

        {/* Main content */}
        <main id="main-content" className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
};
