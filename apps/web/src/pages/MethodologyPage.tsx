import React from 'react';
import { useMethodologyQuery } from '../lib/hooks.js';
import { StatusBadge } from '../components/ui/Badge.js';
import { AppNavbar } from '../components/layout/AppNavbar.js';
import { AppFooter } from '../components/layout/AppFooter.js';
import type { PredictionStatus } from '@dengueahead/contracts';

export const MethodologyPage: React.FC = () => {
  const { data } = useMethodologyQuery();

  const statuses: { status: PredictionStatus; desc: string }[] = [
    {
      status: 'EMERGING',
      desc: 'District was below threshold in previous week (or cooling) and forecast is predicted to cross the district-specific 75th percentile threshold next week.'
    },
    {
      status: 'PERSISTENT',
      desc: 'District was already at or above threshold and forecast remains at or above threshold next week.'
    },
    {
      status: 'COOLING',
      desc: 'District was at or above threshold and forecast predicts cases falling back below the seasonal threshold.'
    },
    {
      status: 'STABLE',
      desc: 'District was below threshold and forecast remains safely below the threshold.'
    },
    {
      status: 'WITHHELD',
      desc: 'Data quality checks flagged issues (e.g., stale surveillance reports, missing climate inputs, or anomalous reporting gap). Numeric forecast is withheld to prevent false alarms.'
    }
  ];

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
      <AppNavbar currentPath="/methodology" />

      {/* Main Content */}
      <main
        id="main-content"
        style={{
          flex: 1,
          maxWidth: '960px',
          margin: '0 auto',
          width: '100%',
          padding: '40px 24px'
        }}
      >
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#f8fafc', marginBottom: '12px' }}>
          Methodology &amp; Modeling Framework
        </h1>
        <p style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '32px', lineHeight: 1.6 }}>
          DengueAhead formulates dengue risk forecasting as an evidence-driven, multi-task problem:
          predicting 1-week ahead case volume while simultaneously classifying the risk of crossing
          a district-specific seasonal threshold.
        </p>

        {/* Section 1: Non-Clinical Advisory */}
        <section
          style={{
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px'
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
            Non-Clinical Decision-Support Scope
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>
            {data?.nonClinicalDisclaimer ||
              'DengueAhead is designed strictly for municipal public health planning, vector control logistics (e.g. larvicide and fogging allocation), and epidemiological surveillance. It does not diagnose individual patients, prescribe medical therapies, or replace clinical diagnosis.'}
          </p>
        </section>

        {/* Visual Epidemiological Analytics Hero Banner */}
        <div
          style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '36px',
            border: '1px solid #1e293b',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)'
          }}
        >
          <img
            src="/images/epidemiology-methodology.jpg"
            alt="Epidemiological Research & Analytics Lab"
            style={{ width: '100%', height: '260px', objectFit: 'cover', display: 'block' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(6, 11, 24, 0.2) 0%, rgba(6, 11, 24, 0.92) 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Algorithmic Pipeline &bull; NDCU &bull; Reanalysis
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#e2e8f0', margin: 0, maxWidth: '640px' }}>
              Multi-scale temporal models combining historical case lag autoregression with biological monsoon vector response thresholds.
            </p>
          </div>
        </div>

        {/* Section 2: Target Formulation */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#f8fafc', marginBottom: '12px' }}>
            1. Target Formulation
          </h2>
          <div
            style={{
              backgroundColor: '#0b1329',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '20px'
            }}
          >
            <h3
              style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}
            >
              Primary Regression Target: Continuous Caseload Forecast
            </h3>
            <p
              style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '16px' }}
            >
              {'y_{i, t+1}'}: Total confirmed dengue cases reported in district <em>i</em> during target week <em>t+1</em>. Evaluated using Mean Absolute Error (MAE) and Root Mean Squared Error (RMSE).
            </p>
            <h3
              style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}
            >
              Secondary Classification Target: Emerging Hotspot Binary Risk
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>
              A district enters <strong>EMERGING</strong> status when its predicted caseload crosses
              the district-specific 75th percentile historical seasonal baseline ({'τ_{i, w}'}) for
              epidemiological week <em>w</em>.
            </p>
          </div>

          <h3
            style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '12px' }}
          >
            Taxonomy State Definitions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {statuses.map(({ status, desc }) => (
              <div
                key={status}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  backgroundColor: '#0b1329',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '16px'
                }}
              >
                <div style={{ minWidth: '100px' }}>
                  <StatusBadge status={status} size="md" />
                </div>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Visual Epidemiological Drivers Multi-Photo Strip */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#f8fafc', marginBottom: '12px' }}>
            2. Scientific Drivers &amp; Input Telemetry
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '18px',
              marginBottom: '16px'
            }}
          >
            {/* Photo Card 1: NDCU Surveillance Analysis */}
            <div
              style={{
                backgroundColor: '#0b1329',
                borderRadius: '12px',
                border: '1px solid #1e293b',
                overflow: 'hidden'
              }}
            >
              <img
                src="/images/ndcu-bulletin-analysis.jpg"
                alt="NDCU Weekly Bulletin Surveillance Analytics"
                style={{ width: '100%', height: '160px', objectFit: 'cover' }}
              />
              <div style={{ padding: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', margin: '0 0 6px 0' }}>
                  NDCU Weekly Surveillance
                </h4>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                  Weekly district case tables ingested and verified under ISO bounds, tracking incubation waves.
                </p>
              </div>
            </div>

            {/* Photo Card 2: Climate Satellite */}
            <div
              style={{
                backgroundColor: '#0b1329',
                borderRadius: '12px',
                border: '1px solid #1e293b',
                overflow: 'hidden'
              }}
            >
              <img
                src="/images/satellite-monsoon.jpg"
                alt="Monsoon Precipitation Satellite"
                style={{ width: '100%', height: '160px', objectFit: 'cover' }}
              />
              <div style={{ padding: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', margin: '0 0 6px 0' }}>
                  ERA5 Climate Telemetry
                </h4>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                  Daily rainfall accumulation, peak temperature, and relative humidity aggregated across district centroids.
                </p>
              </div>
            </div>

            {/* Photo Card 3: Field Inspection */}
            <div
              style={{
                backgroundColor: '#0b1329',
                borderRadius: '12px',
                border: '1px solid #1e293b',
                overflow: 'hidden'
              }}
            >
              <img
                src="/images/phi-inspection.jpg"
                alt="Public Health Inspector Ground Surveillance"
                style={{ width: '100%', height: '160px', objectFit: 'cover' }}
              />
              <div style={{ padding: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', margin: '0 0 6px 0' }}>
                  PHI Surveillance Ground Truth
                </h4>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                  Weekly district health office bulletin filings with cryptographic SHA-256 tamper-proof provenance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Uncertainty Estimation & Calibration */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#f8fafc', marginBottom: '12px' }}>
            3. Uncertainty Estimation &amp; Calibration
          </h2>
          <div
            style={{
              backgroundColor: '#0b1329',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '24px'
            }}
          >
            <h3
              style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}
            >
              Conformal Prediction Intervals
            </h3>
            <p
              style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '16px' }}
            >
              Intervals $[L, U]$ are constructed using split conformal prediction with guaranteed
              finite-sample coverage (nominal $1 - \alpha = 0.80$). If data quality issues or
              insufficient observations exist, the interval is suppressed as "Interval not
              available" rather than outputting false certainty.
            </p>
            <h3
              style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}
            >
              Platt Scaling Probability Calibration
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>
              Hotspot probabilities are calibrated via univariate Platt sigmoid scaling on
              out-of-fold predictions. Uncalibrated models report relative risk rank rather than
              pseudo-percentages.
            </p>
          </div>
        </section>

        {/* Section 4: Feature Attribution Non-Causality */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#f8fafc', marginBottom: '12px' }}>
            4. Feature Attribution &amp; Statistical Interpretation
          </h2>
          <div
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '12px',
              padding: '20px'
            }}
          >
            <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '6px' }}>
              Important Statistical Notice:
            </strong>
            <p style={{ fontSize: '14px', color: '#fde68a', margin: 0, lineHeight: 1.5 }}>
              Feature importance scores and local attributions reflect historical statistical
              association within epidemiological surveillance and weather reanalysis time series.
              They do <em>not</em> establish clinical, biological, or epidemiological causation.
            </p>
          </div>
        </section>
      </main>

      {/* Enterprise Multi-Column Footer */}
      <AppFooter />
    </div>
  );
};
