import React, { useEffect, useState } from 'react';
import { ShieldAlert, Activity, CheckCircle2, Server, Database, BrainCircuit } from 'lucide-react';
import type { HealthResponse } from '@dengueahead/contracts';

export const App: React.FC = () => {
  const [apiHealth, setApiHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

  useEffect(() => {
    let isMounted = true;
    async function checkHealth() {
      try {
        const res = await fetch(`${apiBaseUrl}/health`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data: HealthResponse = await res.json();
        if (isMounted) {
          setApiHealth(data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'API connection failed');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    checkHealth();
    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Non-clinical safety advisory banner */}
      <div
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
        <ShieldAlert size={16} color="#D97706" />
        <span>
          <strong>DengueAhead Research & Public Health Intelligence:</strong> Non-clinical decision-support system.
          Does not diagnose, prescribe, or autonomously direct medical interventions.
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
          <div>
            <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>
              Early Warning for Emerging Dengue Hotspots in Sri Lanka
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              padding: '4px 10px',
              borderRadius: '20px',
              backgroundColor: loading ? '#F1F5F9' : error ? '#FEE2E2' : '#CCFBF1',
              color: loading ? '#64748B' : error ? '#DC4754' : '#0D9488',
              fontWeight: 600
            }}
          >
            <Activity size={14} />
            <span>
              API: {loading ? 'Checking...' : error ? `Offline (${error})` : 'Connected'}
            </span>
          </div>
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

      {/* Hero / Overview Content */}
      <main style={{ flex: 1, padding: '40px 32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', color: '#0B1730', fontWeight: 800, marginBottom: '8px' }}>
            System Foundation & Monorepo Readiness
          </h1>
          <p style={{ color: '#475569', fontSize: '16px', maxWidth: '800px' }}>
            Phase 0 sets up the foundational contracts, Express API, Vite frontend, and Python ML CLI.
            All components communicate through strictly typed contracts with real-time provenance tracking.
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
          {/* Contracts */}
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
              <CheckCircle2 color="#0D9488" size={20} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0B1730' }}>@dengueahead/contracts</h3>
            </div>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '16px' }}>
              Runtime Zod validation and strict TypeScript schemas for Areas, Observations, Predictions, and Evaluation Metrics.
            </p>
            <div style={{ fontSize: '12px', color: '#2563EB', fontWeight: 600 }}>Status: Tested & Verified</div>
          </div>

          {/* Express API */}
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
              <Server color="#2563EB" size={20} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0B1730' }}>@dengueahead/api</h3>
            </div>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '16px' }}>
              Node.js Express backend with correlation IDs, error handlers, and <code>/api/v1/health</code> route.
            </p>
            <div style={{ fontSize: '12px', color: '#2563EB', fontWeight: 600 }}>Status: Ready on port 4000</div>
          </div>

          {/* Web Frontend */}
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
              <Database color="#D97706" size={20} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0B1730' }}>@dengueahead/web</h3>
            </div>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '16px' }}>
              Vite + React frontend with high-contrast public health design system and responsive layout.
            </p>
            <div style={{ fontSize: '12px', color: '#2563EB', fontWeight: 600 }}>Status: Active (Vite)</div>
          </div>

          {/* Python ML */}
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
              <BrainCircuit color="#9333EA" size={20} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0B1730' }}>services/ml</h3>
            </div>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '16px' }}>
              Python 3.12 ML package featuring <code>dengueahead</code> CLI for source ingestion, baselines, and model training.
            </p>
            <div style={{ fontSize: '12px', color: '#2563EB', fontWeight: 600 }}>Status: CLI Scaffolding Complete</div>
          </div>
        </div>

        {/* Live Connectivity Diagnostic */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px'
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#0B1730' }}>
            Live System Health Check
          </h3>
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: '#334155',
              overflowX: 'auto'
            }}
          >
            {loading && <div>Querying backend service at {apiBaseUrl}/health...</div>}
            {!loading && apiHealth && (
              <pre style={{ margin: 0 }}>{JSON.stringify(apiHealth, null, 2)}</pre>
            )}
            {!loading && error && (
              <div style={{ color: '#DC4754' }}>
                Note: Backend not connected at {apiBaseUrl}. Start the API server via <code>npm run dev:api</code>.
              </div>
            )}
          </div>
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
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Phase 0 Implementation Complete</span>
        </div>
      </footer>
    </div>
  );
};

