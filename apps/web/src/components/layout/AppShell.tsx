import React from 'react';
import { BarChart3, Compass, Layers, TrendingUp, Cpu, ShieldCheck, Shield } from 'lucide-react';
import { navigate } from '../../lib/router.js';
import { AppNavbar } from './AppNavbar.js';
import { AppFooter } from './AppFooter.js';

const NAV_ITEMS = [
  { path: '/app/overview', label: 'Overview', icon: BarChart3 },
  { path: '/app/map', label: 'Risk Map', icon: Compass },
  { path: '/app/compare', label: 'Compare', icon: Layers },
  { path: '/app/history', label: 'History', icon: TrendingUp },
  { path: '/app/model', label: 'Model Card', icon: Cpu },
  { path: '/app/data-quality', label: 'Data Quality', icon: ShieldCheck }
];

interface AppShellProps {
  children: React.ReactNode;
  currentPath: string;
}

export const AppShell: React.FC<AppShellProps> = ({ children, currentPath }) => {
  return (
    <div className="app-layout">
      {/* ── Unified Navbar (Safety Banner + Header + Compact LiquidNavbar) ── */}
      <AppNavbar currentPath={currentPath} />

      {/* ── Body: Sidebar + Main Content ─────────────────────────────────── */}
      <div className="app-layout-body">
        {/* Sidebar */}
        <nav aria-label="App navigation" className="app-sidebar">
          <div style={{ padding: '16px 12px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#64748B',
                padding: '0 12px 10px 12px'
              }}
            >
              Surveillance Intelligence
            </div>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 14px',
                    marginBottom: '4px',
                    borderRadius: '8px',
                    background: isActive
                      ? 'linear-gradient(90deg, rgba(56, 189, 248, 0.15) 0%, rgba(56, 189, 248, 0.04) 100%)'
                      : 'transparent',
                    border: 'none',
                    borderLeft: isActive ? '3px solid #38BDF8' : '3px solid transparent',
                    color: isActive ? '#38BDF8' : '#94A3B8',
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#FFFFFF';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#94A3B8';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Icon
                    style={{
                      width: '16px',
                      height: '16px',
                      color: isActive ? '#38BDF8' : '#64748B'
                    }}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer Metadata */}
          <div
            style={{
              padding: '16px 20px',
              marginTop: 'auto',
              borderTop: '1px solid #1E293B',
              fontSize: '11px',
              color: '#64748B',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield style={{ width: '12px', height: '12px', color: '#10B981' }} />
              <span style={{ color: '#E2E8F0', fontWeight: 600 }}>NDCU Verified</span>
            </div>
            <div>Team EchoBinary · ModelX 2.0</div>
            <div style={{ color: '#475569', fontSize: '10px' }}>Sri Lanka MoH Surveillance</div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main
          id="main-content"
          className="app-main"
          style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}
        >
          <div style={{ flex: 1, paddingBottom: '32px' }}>{children}</div>
          <div style={{ margin: '0 -32px -32px -32px' }}>
            <AppFooter />
          </div>
        </main>
      </div>
    </div>
  );
};
