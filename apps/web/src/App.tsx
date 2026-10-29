import React from 'react';
import { ShieldAlert, CheckCircle2, Server, Database, BrainCircuit } from 'lucide-react';
import { HealthBadge } from './features/health/HealthBadge.js';

const API_BASE_URL: string | undefined = (
  import.meta as unknown as { env?: Record<string, string | undefined> }
).env?.['VITE_API_BASE_URL'];

export const App: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Skip navigation link for keyboard users */}
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
        onFocus={(e) => {
          e.currentTarget.style.left = '8px';
          e.currentTarget.style.top = '8px';
          e.currentTarget.style.width = 'auto';
          e.currentTarget.style.height = 'auto';
          e.currentTarget.style.zIndex = '9999';
        }}
        onBlur={(e) => {
          e.currentTarget.style.left = '-9999px';
          e.currentTarget.style.width = '1px';
          e.currentTarget.style.height = '1px';
        }}
      >
        Skip to main content
      </a>

      {/* Non-clinical safety advisory banner */}
      <div
        role="banner"
        style={{
          backgroundColor: '#0B1730',
          color: '#E2E8F0',
          padding: '8px 24px',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <ShieldAlert size={16} color="#D97706" aria-hidden="true" />
        <span>
          <strong>DengueAhead Research &amp; Public Health Intelligence:</strong> Non-clinical
          decision-support system. Does not diagnose, prescribe, or autonomously direct medical
          interventions.
        </span>
      </div>

      {/* Main Header */}
      <header
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              padding: '6px 12px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '18px',
              letterSpacing: '-0.5px'
            }}
          >
            DengueAhead
          </div>
          <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>
            Early Warning for Emerging Dengue Hotspots in Sri Lanka
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <HealthBadge apiBaseUrl={API_BASE_URL ?? 'http://localhost:4000/api/v1'} />
          <span
            style={{
              fontSize: '12px',
              backgroundColor: '#F1F5F9',
              color: '#475569',
              padding: '4px 8px',
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}
          >
            Phase 0 Scaffolding
          </span>
        </div>
      </header>

      {/* Main content */}
      <main
        id="main-content"
        style={{
          flex: 1,
          padding: '40px 32px',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%'
        }}
      >
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', color: '#0B1730', fontWeight: 800, marginBottom: '8px' }}>
            System Foundation &amp; Monorepo Readiness
          </h1>
          <p style={{ color: '#475569', fontSize: '16px', maxWidth: '800px' }}>
            Phase 0 sets up the foundational contracts, Express API, Vite frontend, and Python ML
            CLI. All components communicate through strictly typed contracts with real-time
            provenance tracking.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}
        >
          <PillarCard
            icon={<CheckCircle2 color="#0D9488" size={20} aria-hidden="true" />}
            title="@dengueahead/contracts"
            description="Runtime Zod validation and strict TypeScript schemas for Areas, Observations, Predictions, and Evaluation Metrics."
            status="Tested & Verified"
          />
          <PillarCard
            icon={<Server color="#2563EB" size={20} aria-hidden="true" />}
            title="@dengueahead/api"
            description="Node.js Express backend with correlation IDs, error handlers, and /api/v1/health route."
            status="Ready on port 4000"
          />
          <PillarCard
            icon={<Database color="#D97706" size={20} aria-hidden="true" />}
            title="@dengueahead/web"
            description="Vite + React frontend with high-contrast public health design system and responsive layout."
            status="Active (Vite)"
          />
          <PillarCard
            icon={<BrainCircuit color="#9333EA" size={20} aria-hidden="true" />}
            title="services/ml"
            description="Python 3.12 ML package featuring the dengueahead CLI for source ingestion, baselines, and model training."
            status="CLI Scaffolding Complete"
          />
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid #E2E8F0',
          padding: '20px 32px',
          backgroundColor: '#FFFFFF',
          fontSize: '13px',
          color: '#64748B',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <strong>DengueAhead</strong> — EchoBinary (ModelX 2.0 Competition)
        </div>
        <div>Phase 0 Implementation Complete</div>
      </footer>
    </div>
  );
};

interface PillarCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: string;
}

const PillarCard: React.FC<PillarCardProps> = ({ icon, title, description, status }) => (
  <div
    style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
      {icon}
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0B1730', margin: 0 }}>{title}</h3>
    </div>
    <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '16px' }}>{description}</p>
    <div style={{ fontSize: '12px', color: '#2563EB', fontWeight: 600 }}>Status: {status}</div>
  </div>
);
