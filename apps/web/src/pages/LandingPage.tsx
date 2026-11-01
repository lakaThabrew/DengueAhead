import React from 'react';
import { navigate } from '../lib/router.js';
import { Button } from '../components/ui/Button.js';

export const LandingPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Skip link */}
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

      {/* Non-clinical safety banner */}
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
          decision-support system. Does not diagnose, prescribe, or autonomously direct medical
          interventions.
        </span>
      </div>

      {/* Nav */}
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
        <div
          style={{
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
            padding: '4px 12px',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '18px'
          }}
        >
          DengueAhead
        </div>
        <nav
          aria-label="Site navigation"
          style={{ display: 'flex', gap: '24px', alignItems: 'center' }}
        >
          <button
            onClick={() => navigate('/methodology')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#475569',
              fontWeight: 500
            }}
          >
            How It Works
          </button>
          <button
            onClick={() => navigate('/app/data-quality')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#475569',
              fontWeight: 500
            }}
          >
            Data &amp; Trust
          </button>
          <button
            onClick={() => navigate('/about')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#475569',
              fontWeight: 500
            }}
          >
            About
          </button>
          <Button size="sm" onClick={() => navigate('/app/overview')}>
            Open Dashboard
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <main id="main-content" style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <section
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            padding: '80px 32px 60px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              display: 'inline-block',
              backgroundColor: '#EFF6FF',
              color: '#1D4ED8',
              fontSize: '13px',
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: '9999px',
              marginBottom: '20px'
            }}
          >
            ModelX 2.0 · EchoBinary · Sri Lanka
          </div>
          <h1
            style={{
              fontSize: 'clamp(28px, 5vw, 52px)',
              fontWeight: 900,
              color: '#0B1730',
              lineHeight: 1.15,
              marginBottom: '20px',
              letterSpacing: '-0.5px'
            }}
          >
            Early Warning for
            <br />
            <span style={{ color: '#2563EB' }}>Emerging Dengue Hotspots</span>
            <br />
            in Sri Lanka
          </h1>
          <p
            style={{
              fontSize: '18px',
              color: '#475569',
              maxWidth: '640px',
              margin: '0 auto 36px',
              lineHeight: 1.6
            }}
          >
            A research-grade public health intelligence system that forecasts dengue case
            trajectories one week ahead across 25 Sri Lanka districts using national NDCU data and
            open climate indicators.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button size="lg" onClick={() => navigate('/app/map')}>
              Explore Risk Map
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/methodology')}>
              See How It Works
            </Button>
          </div>
        </section>

        {/* Illustrative Preview — explicitly labeled, no real data */}
        <section
          aria-label="Illustrative system preview"
          style={{
            maxWidth: '800px',
            margin: '0 auto 60px',
            padding: '0 32px'
          }}
        >
          <div
            style={{
              border: '2px dashed #CBD5E1',
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center',
              backgroundColor: '#FFFFFF'
            }}
          >
            <div
              style={{
                display: 'inline-block',
                backgroundColor: '#FEF3C7',
                color: '#92400E',
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: '4px',
                marginBottom: '16px',
                border: '1px solid #FCD34D'
              }}
            >
              ⚠ Illustrative Preview (Sample Visual Only — Not Real Forecast Data)
            </div>
            <div
              style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}
            >
              {[
                { label: 'Districts Monitored', value: '25', color: '#2563EB' },
                { label: 'Emerging Hotspots', value: '—', color: '#D97706' },
                { label: 'Stable Districts', value: '—', color: '#0D9488' },
                { label: 'Forecast Horizon', value: '+1 wk', color: '#7C3AED' }
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    flex: '1 1 120px',
                    padding: '16px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    backgroundColor: '#F8FAFC'
                  }}
                >
                  <div style={{ fontSize: '28px', fontWeight: 800, color: item.color }}>
                    {item.value}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '16px' }}>
              Connect to the API to see live forecasts. Values shown above are placeholders only.
            </p>
          </div>
        </section>

        {/* Pipeline explainer */}
        <section
          style={{
            maxWidth: '860px',
            margin: '0 auto 80px',
            padding: '0 32px'
          }}
        >
          <h2
            style={{
              textAlign: 'center',
              fontSize: '24px',
              fontWeight: 800,
              color: '#0B1730',
              marginBottom: '32px'
            }}
          >
            How It Works
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px'
            }}
          >
            {[
              {
                step: '1',
                title: 'NDCU Dengue Data',
                desc: 'Weekly dengue case counts ingested from the National Dengue Control Unit (NDCU) for all 25 Sri Lanka districts.',
                color: '#2563EB'
              },
              {
                step: '2',
                title: 'Feature Engineering',
                desc: '21 features including lagged case counts, seasonal indicators, and Open-Meteo climate variables (temperature, rainfall, humidity).',
                color: '#7C3AED'
              },
              {
                step: '3',
                title: 'HGB Forecast + Calibration',
                desc: 'Histogram Gradient Boosting model with conformal prediction intervals and Platt-calibrated hotspot probability.',
                color: '#0D9488'
              }
            ].map((item) => (
              <div
                key={item.step}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '24px'
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: item.color,
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    marginBottom: '12px'
                  }}
                >
                  {item.step}
                </div>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#0B1730',
                    marginBottom: '8px'
                  }}
                >
                  {item.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Attribution */}
        <section
          style={{
            backgroundColor: '#F1F5F9',
            borderTop: '1px solid #E2E8F0',
            padding: '32px',
            textAlign: 'center'
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0B1730', marginBottom: '12px' }}>
            Data Sources
          </h2>
          <p style={{ fontSize: '14px', color: '#475569' }}>
            Dengue surveillance data: <strong>National Dengue Control Unit (NDCU)</strong>, Ministry
            of Health, Sri Lanka.
            <br />
            Climate data: <strong>Open-Meteo</strong> (open-meteo.com) — CC BY 4.0.
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
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div>
          <strong>DengueAhead</strong> — EchoBinary · ModelX 2.0 Competition
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={() => navigate('/methodology')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#64748B'
            }}
          >
            Methodology
          </button>
          <button
            onClick={() => navigate('/about')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#64748B'
            }}
          >
            About
          </button>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#64748B' }}
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
};
