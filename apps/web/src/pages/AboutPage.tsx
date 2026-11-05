import React from 'react';
import { AppNavbar } from '../components/layout/AppNavbar.js';
import { AppFooter } from '../components/layout/AppFooter.js';

export const AboutPage: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#060b18',
        color: '#f8fafc'
      }}
    >
      {/* ── Unified Navbar (Safety Banner + Header + Compact LiquidNavbar) ── */}
      <AppNavbar currentPath="/about" />

      {/* Main Content */}
      <main
        id="main-content"
        style={{
          flex: 1,
          maxWidth: '860px',
          margin: '0 auto',
          width: '100%',
          padding: '40px 24px'
        }}
      >
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#f8fafc', marginBottom: '12px' }}>
          About DengueAhead
        </h1>
        <p style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '32px', lineHeight: 1.6 }}>
          DengueAhead is developed by team <strong style={{ color: '#f8fafc' }}>EchoBinary</strong>{' '}
          for the <strong style={{ color: '#38bdf8' }}>ModelX 2.0 Competition</strong> (Health &amp;
          Wellbeing Domain). Our objective is to deliver early, reproducible, and verifiable
          operational warnings of emerging dengue surges across Sri Lanka.
        </p>

        {/* Visual Field Operation Hero Banner */}
        <div
          style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '32px',
            border: '1px solid #1e293b',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)'
          }}
        >
          <img
            src="/images/health-ai-collaboration.jpg"
            alt="Public Health &amp; AI Epidemiology Collaboration"
            style={{ width: '100%', height: '280px', objectFit: 'cover', display: 'block' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(6, 11, 24, 0.2) 0%, rgba(6, 11, 24, 0.92) 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981'
                }}
              />
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#10b981',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em'
                }}
              >
                Field Intelligence &bull; Ministry of Health &bull; PHI Network
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#e2e8f0', margin: 0, maxWidth: '640px' }}>
              Bridging macro climate satellite reanalysis with active ground vector inspections by
              Public Health Inspectors across Sri Lanka.
            </p>
          </div>
        </div>

        {/* Project Pillars with Side-by-Side Photos */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '18px',
            marginBottom: '32px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0b1329',
              borderRadius: '12px',
              border: '1px solid #1e293b',
              overflow: 'hidden'
            }}
          >
            <img
              src="/images/lab-analytics.jpg"
              alt="Predictive ML Analytics"
              style={{ width: '100%', height: '170px', objectFit: 'cover' }}
            />
            <div style={{ padding: '18px' }}>
              <h3
                style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', margin: '0 0 6px 0' }}
              >
                Conformal ML &amp; Safety
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Engineered with HistGradientBoosting (HGB) models, non-parametric 80% conformal
                coverage, and automated data delay quarantines.
              </p>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#0b1329',
              borderRadius: '12px',
              border: '1px solid #1e293b',
              overflow: 'hidden'
            }}
          >
            <img
              src="/images/hero-fogging.jpg"
              alt="Targeted Vector Control"
              style={{ width: '100%', height: '170px', objectFit: 'cover' }}
            />
            <div style={{ padding: '18px' }}>
              <h3
                style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', margin: '0 0 6px 0' }}
              >
                Logistical Public Health Impact
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Equipping regional Medical Officers of Health (MOH) with 7-day advance warnings to
                dispatch thermal fogging and larvicide preemptively.
              </p>
            </div>
          </div>
        </div>

        {/* Institutional Attribution */}
        <section
          style={{
            backgroundColor: '#0b1329',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '12px' }}>
            Data Attribution &amp; Acknowledgments
          </h2>
          <ul
            style={{
              fontSize: '14px',
              color: '#94a3b8',
              lineHeight: 1.8,
              paddingLeft: '20px',
              margin: 0
            }}
          >
            <li>
              <strong style={{ color: '#f8fafc' }}>Epidemiological Surveillance:</strong> National
              Dengue Control Unit (NDCU), Ministry of Health, Sri Lanka. Weekly epidemiological
              bulletins.
            </li>
            <li>
              <strong style={{ color: '#f8fafc' }}>Weather Reanalysis:</strong> Open-Meteo
              Historical Weather API (ERA5 reanalysis) — licensed under CC BY 4.0.
            </li>
            <li>
              <strong style={{ color: '#f8fafc' }}>Geographical Boundaries:</strong> Centroids and
              canonical district mappings derived from official survey data without external tile
              dependencies.
            </li>
          </ul>
        </section>

        {/* AI-Assisted Disclosure */}
        <section
          style={{
            backgroundColor: '#0b1329',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
            AI-Assisted Development Disclosure
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
            In accordance with ModelX 2.0 evaluation guidelines, this project utilized agentic AI
            assistance for code synthesis, unit test creation, and continuous integration
            scaffolding under strict human architectural supervision, test-driven validation, and
            phase gate verification.
          </p>
        </section>

        {/* Team & Contact */}
        <section
          style={{
            backgroundColor: '#0c152d',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '24px'
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
            Team EchoBinary
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
            ModelX 2.0 Participant &bull; Sri Lanka &bull; Open Science Initiative
          </p>
        </section>
      </main>

      {/* Enterprise Multi-Column Footer */}
      <AppFooter />
    </div>
  );
};
