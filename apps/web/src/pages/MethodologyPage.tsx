import React from 'react';
import { navigate } from '../lib/router.js';
import { useMethodologyQuery } from '../lib/hooks.js';
import { Button } from '../components/ui/Button.js';
import { StatusBadge } from '../components/ui/Badge.js';
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
            Methodology &amp; Scientific Protocol
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
          maxWidth: '960px',
          margin: '0 auto',
          width: '100%',
          padding: '40px 24px'
        }}
      >
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0B1730', marginBottom: '12px' }}>
          Methodology &amp; Modeling Framework
        </h1>
        <p style={{ fontSize: '16px', color: '#475569', marginBottom: '32px', lineHeight: 1.6 }}>
          DengueAhead formulates dengue risk forecasting as an evidence-driven, multi-task problem:
          predicting 1-week ahead case volume while simultaneously classifying the risk of crossing
          a district-specific seasonal threshold.
        </p>

        {/* Section 1: Non-Clinical Advisory */}
        <section
          style={{
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px'
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1E40AF', marginBottom: '8px' }}>
            Non-Clinical Decision-Support Scope
          </h2>
          <p style={{ fontSize: '14px', color: '#1E3A8A', lineHeight: 1.6 }}>
            {data?.nonClinicalDisclaimer ||
              'DengueAhead is designed strictly for municipal public health planning, vector control logistics (e.g. larvicide and fogging allocation), and epidemiological surveillance. It does not diagnose individual patients, prescribe medical therapies, or replace clinical diagnosis.'}
          </p>
        </section>

        {/* Section 2: Target Formulation */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0B1730', marginBottom: '12px' }}>
            1. Target Formulation
          </h2>
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '24px'
            }}
          >
            <p
              style={{ fontSize: '15px', color: '#334155', lineHeight: 1.6, marginBottom: '16px' }}
            >
              For district $a$ at issue week $t$, the system predicts:
            </p>
            <ul
              style={{ paddingLeft: '24px', color: '#334155', fontSize: '14px', lineHeight: 1.8 }}
            >
              <li>
                <strong>Continuous Point Forecast:</strong> <code>y_hat(a, t+1)</code> — Expected
                weekly case count for next epidemiological week.
              </li>
              <li>
                <strong>Seasonal Threshold:</strong> <code>τ(a, w)</code> — 75th percentile of
                historical dengue cases in district a for calendar week w, computed strictly on
                training data prior to 2024.
              </li>
              <li>
                <strong>Binary Hotspot Indicator:</strong>{' '}
                <code>H(a, t+1) = [ y_hat(a, t+1) ≥ τ(a, w) ]</code>.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 3: Status Taxonomy */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0B1730', marginBottom: '12px' }}>
            2. District Risk Taxonomy
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {statuses.map((item) => (
              <div
                key={item.status}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px'
                }}
              >
                <div style={{ minWidth: '110px', paddingTop: '2px' }}>
                  <StatusBadge status={item.status} />
                </div>
                <p style={{ fontSize: '14px', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                  {data?.statusTaxonomy?.[item.status] || item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Uncertainty & Calibration */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0B1730', marginBottom: '12px' }}>
            3. Uncertainty Estimation &amp; Calibration
          </h2>
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '24px'
            }}
          >
            <h3
              style={{ fontSize: '16px', fontWeight: 700, color: '#0B1730', marginBottom: '8px' }}
            >
              Conformal Prediction Intervals
            </h3>
            <p
              style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '16px' }}
            >
              Intervals $[L, U]$ are constructed using split conformal prediction with guaranteed
              finite-sample coverage (nominal $1 - \alpha = 0.90$). If data quality issues or
              insufficient observations exist, the interval is suppressed as "Interval not
              available" rather than outputting false certainty.
            </p>
            <h3
              style={{ fontSize: '16px', fontWeight: 700, color: '#0B1730', marginBottom: '8px' }}
            >
              Platt Scaling Probability Calibration
            </h3>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
              Hotspot probabilities are calibrated via univariate Platt sigmoid scaling on
              out-of-fold predictions. Uncalibrated models report relative risk rank rather than
              pseudo-percentages.
            </p>
          </div>
        </section>

        {/* Section 5: Feature Attribution Non-Causality */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0B1730', marginBottom: '12px' }}>
            4. Feature Attribution &amp; Statistical Interpretation
          </h2>
          <div
            style={{
              backgroundColor: '#FEF3C7',
              border: '1px solid #FCD34D',
              borderRadius: '12px',
              padding: '20px'
            }}
          >
            <strong style={{ color: '#78350F', display: 'block', marginBottom: '6px' }}>
              Important Statistical Notice:
            </strong>
            <p style={{ fontSize: '14px', color: '#92400E', margin: 0, lineHeight: 1.5 }}>
              Feature importance scores and local attributions reflect historical statistical
              association within epidemiological surveillance and weather reanalysis time series.
              They do <em>not</em> establish clinical, biological, or epidemiological causation.
            </p>
          </div>
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
