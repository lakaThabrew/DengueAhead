import React, { useState } from 'react';
import {
  Home,
  BarChart3,
  Compass,
  Layers,
  TrendingUp,
  Cpu,
  ShieldCheck,
  FileText,
  Users,
  Activity,
  ArrowRight,
  Menu,
  X,
  ExternalLink
} from 'lucide-react';
import { navigate, useRouter } from '../../lib/router.js';
import { HealthBadge } from '../../features/health/HealthBadge.js';
import { LiquidNavbar, LiquidNavItem } from '../ui/liquid-glass-navbar.js';

const API_BASE: string =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.[
    'VITE_API_BASE_URL'
  ] ?? 'http://localhost:4000/api/v1';

export const APP_NAV_ITEMS: (LiquidNavItem & { path: string })[] = [
  { label: 'Home', path: '/', icon: <Home style={{ width: 17, height: 17 }} />, fx: 'glow' },
  {
    label: 'Overview',
    path: '/app/overview',
    icon: <BarChart3 style={{ width: 17, height: 17 }} />,
    fx: 'pop'
  },
  {
    label: 'Risk Map',
    path: '/app/map',
    icon: <Compass style={{ width: 17, height: 17 }} />,
    fx: 'spin'
  },
  {
    label: 'Compare',
    path: '/app/compare',
    icon: <Layers style={{ width: 17, height: 17 }} />,
    fx: 'wave'
  },
  {
    label: 'History',
    path: '/app/history',
    icon: <TrendingUp style={{ width: 17, height: 17 }} />,
    fx: 'plane'
  },
  {
    label: 'Model Card',
    path: '/app/model',
    icon: <Cpu style={{ width: 17, height: 17 }} />,
    fx: 'glow'
  },
  {
    label: 'Data & Trust',
    path: '/app/data-quality',
    icon: <ShieldCheck style={{ width: 17, height: 17 }} />,
    fx: 'drop'
  },
  {
    label: 'Methodology',
    path: '/methodology',
    icon: <FileText style={{ width: 17, height: 17 }} />,
    fx: 'wave'
  },
  {
    label: 'About Team',
    path: '/about',
    icon: <Users style={{ width: 17, height: 17 }} />,
    fx: 'pop'
  }
];

interface AppNavbarProps {
  currentPath?: string;
  showSafetyBanner?: boolean;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  currentPath: propPath,
  showSafetyBanner = true
}) => {
  const router = useRouter();
  const path = propPath ?? router.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Determine active index in NAV_ITEMS
  let activeIndex = APP_NAV_ITEMS.findIndex((item) => {
    if (item.path === '/') return path === '/' || path === '';
    return path === item.path || path.startsWith(item.path + '/');
  });
  if (activeIndex === -1 && path.startsWith('/app/areas/')) {
    activeIndex = 1; // Map / Area Detail maps to overview
  }
  if (activeIndex === -1) activeIndex = 0;

  const isAppConsole = path.startsWith('/app');

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 50, width: '100%' }}>
      {/* ── 1. Non-Clinical Safety Banner (AGENTS.md Rule 3 & 6) ─────────── */}
      {showSafetyBanner && (
        <div
          role="banner"
          style={{
            backgroundColor: '#050a14',
            color: '#E2E8F0',
            padding: '7px 20px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            borderBottom: '1px solid rgba(30, 41, 59, 0.8)',
            textAlign: 'center'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 8px #10B981',
              flexShrink: 0
            }}
          />
          <span style={{ letterSpacing: '0.01em' }}>
            <strong style={{ color: '#38BDF8', fontWeight: 700 }}>DengueAhead Intelligence:</strong>{' '}
            Non-clinical decision-support system. Does not diagnose, prescribe, or autonomously
            direct medical interventions.{' '}
            <button
              onClick={() => navigate('/methodology')}
              style={{
                background: 'none',
                border: 'none',
                color: '#38BDF8',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '12px',
                padding: 0,
                fontWeight: 600
              }}
            >
              Methodology Protocol
            </button>
          </span>
        </div>
      )}

      {/* ── 2. Floating Glassmorphic Header ───────────────────────────────── */}
      <header
        style={{
          position: 'relative',
          backgroundColor: 'rgba(5, 10, 24, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(30, 41, 59, 0.75)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          padding: '0 24px',
          height: '66px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Subtle luminous top border line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1.5px',
            background:
              'linear-gradient(90deg, transparent 0%, #38BDF8 30%, #818CF8 70%, transparent 100%)',
            opacity: 0.8
          }}
        />

        {/* Left: Brand Identity */}
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'left'
          }}
          aria-label="DengueAhead Home"
        >
          {/* Logo Mark with glowing multi-gradient ring */}
          <div
            style={{
              position: 'relative',
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #38BDF8 0%, #2563EB 50%, #4F46E5 100%)',
              padding: '1.5px',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.35)'
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#050A14',
                borderRadius: '10.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Activity style={{ width: '20px', height: '20px', color: '#38BDF8' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '18px',
                  letterSpacing: '-0.02em'
                }}
              >
                Dengue
                <span
                  style={{
                    background: 'linear-gradient(135deg, #38BDF8 0%, #818CF8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Ahead
                </span>
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  color: '#38BDF8',
                  padding: '1.5px 7px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  letterSpacing: '0.05em'
                }}
              >
                v2.0
              </span>
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#64748B',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981'
                }}
              />
              <span>Sri Lanka Vector EWS</span>
            </div>
          </div>
        </button>

        {/* Center: Nimbus Liquid Glass Waterline Navigation in COMPACT (icons-only) mode */}
        <div className="hidden lg:flex items-center">
          <LiquidNavbar
            tone="dark"
            active={activeIndex}
            compact={true}
            sound={false}
            items={APP_NAV_ITEMS.map((item) => ({
              label: item.label,
              icon: item.icon,
              fx: item.fx,
              href: item.path
            }))}
            onChange={(_i, item) => {
              if (item.href) navigate(item.href);
            }}
          />
        </div>

        {/* Right: API Health Badge & Primary Action CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(11, 19, 43, 0.8)',
              border: '1px solid #1E293B',
              fontSize: '11px'
            }}
          >
            <HealthBadge apiBaseUrl={API_BASE} />
          </div>

          {isAppConsole ? (
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid #334155',
                color: '#CBD5E1',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#FFFFFF';
                e.currentTarget.style.borderColor = '#38BDF8';
                e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#CBD5E1';
                e.currentTarget.style.borderColor = '#334155';
                e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
              }}
            >
              <span>Landing Page</span>
              <ExternalLink style={{ width: '13px', height: '13px', color: '#38BDF8' }} />
            </button>
          ) : (
            <button
              onClick={() => navigate('/app/overview')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 16px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(56, 189, 248, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(37, 99, 235, 0.4)';
              }}
            >
              <BarChart3 style={{ width: '14px', height: '14px', color: '#BAE6FD' }} />
              <span>Open Dashboard</span>
              <ArrowRight style={{ width: '13px', height: '13px', color: '#BAE6FD' }} />
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex lg:hidden items-center justify-center"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#0F172A',
              border: '1px solid #1E293B',
              color: '#94A3B8',
              cursor: 'pointer'
            }}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X style={{ width: 18, height: 18 }} />
            ) : (
              <Menu style={{ width: 18, height: 18 }} />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: 'rgba(5, 10, 24, 0.98)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid #1E293B',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
          }}
          className="lg:hidden"
        >
          {APP_NAV_ITEMS.map((item) => {
            const isActive =
              item.path === '/'
                ? path === '/' || path === ''
                : path === item.path || path.startsWith(item.path + '/');
            return (
              <button
                key={item.path}
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(item.path);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                  color: isActive ? '#38BDF8' : '#CBD5E1',
                  fontSize: '14px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span style={{ color: isActive ? '#38BDF8' : '#94A3B8' }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
