import React from 'react';
import { navigate } from '../lib/router.js';
import { Button } from '../components/ui/Button.js';

export const AboutPage: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F8FAFC'
      }}
    >
      {/* Top Banner */}
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
        <span aria-hidden="true">⚠</span>
        <span>
          <strong>DengueAhead Research &amp; Public Health Intelligence:</strong> Non-clinical
          decision-support system.
        </span>
      </div>

      {/* Header */}
      <header
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '12px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              padding: '4px 12px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '18px'
            }}
          >
            DengueAhead
          </button>
          <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>
            About &amp; Attribution
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            Home
          </Button>
          <Button size="sm" onClick={() => navigate('/app/overview')}>
            Open Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main
        id="main-content"
        style={{
          flex: 1,
          maxWidth: '840px',
          margin: '0 auto',
          width: '100%',
          padding: '40px 24px'
        }}
      >
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0B1730', marginBottom: '12px' }}>
          About DengueAhead
        </h1>
        <p style={{ fontSize: '16px', color: '#475569', marginBottom: '32px', lineHeight: 1.6 }}>
          DengueAhead is developed by team <strong>EchoBinary</strong> for the{' '}
          <strong>ModelX 2.0 Competition</strong> (Health &amp; Wellbeing Domain). Our objective is
          to deliver early, reproducible, and verifiable operational warnings of emerging dengue
          surges across Sri Lanka.
        </p>

        {/* Mission */}
        <section
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0B1730', marginBottom: '8px' }}>
            Mission &amp; Operational Value
          </h2>
          <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
            Rather than passive historical reporting, municipal public health officers need lead
            time to deploy targeted fogging, community inspections, and larvicidal interventions.
            DengueAhead provides one-week-ahead predictive risk signals across 25 administrative
            districts with strictly guarded historical as-of semantics.
          </p>
        </section>

        {/* Data Attribution */}
        <section
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0B1730', marginBottom: '8px' }}>
            Data Attribution &amp; Sources
          </h2>
          <ul style={{ paddingLeft: '20px', color: '#475569', fontSize: '14px', lineHeight: 1.8 }}>
            <li>
              <strong>Epidemiological Surveillance:</strong> National Dengue Control Unit (NDCU),
              Ministry of Health, Sri Lanka. Weekly epidemiological reports.
            </li>
            <li>
              <strong>Weather Reanalysis:</strong> Open-Meteo Historical Weather API (ERA5
              reanalysis) — licensed under CC BY 4.0.
            </li>
            <li>
              <strong>Geographical Boundaries:</strong> Centroids and canonical district mappings
              derived from official survey data without proprietary tile dependencies.
            </li>
          </ul>
        </section>

        {/* AI-Assisted Disclosure */}
        <section
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0B1730', marginBottom: '8px' }}>
            AI-Assisted Development Disclosure
          </h2>
          <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
            In accordance with ModelX 2.0 evaluation guidelines, this project utilized agentic AI
            assistance for code synthesis, unit test creation, and continuous integration
            scaffolding under strict human architectural supervision, test-driven validation, and
            phase gate verification.
          </p>
        </section>

        {/* Team & Contact */}
        <section
          style={{
            backgroundColor: '#F1F5F9',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '24px'
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0B1730', marginBottom: '8px' }}>
            Team EchoBinary
          </h2>
          <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
            ModelX 2.0 Participant · Sri Lanka · Repository:{' '}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}
            >
              GitHub Repository
            </a>
          </p>
        </section>
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
        <div>DengueAhead · EchoBinary · ModelX 2.0</div>
        <div>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#2563EB',
              fontSize: '13px'
            }}
          >
            ← Return to Home
          </button>
        </div>
      </footer>
    </div>
  );
};
