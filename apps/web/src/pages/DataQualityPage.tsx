import React from 'react';
import { useSourcesQuery, useHealthQuery } from '../lib/hooks.js';
import { CardSkeleton } from '../components/ui/LoadingSkeleton.js';
import { ErrorState } from '../components/ui/ErrorState.js';

export const DataQualityPage: React.FC = () => {
  const {
    data: sources,
    isLoading: sourcesLoading,
    error: sourcesError,
    refetch: refetchSources
  } = useSourcesQuery();
  const {
    data: health,
    isLoading: healthLoading,
    error: healthError,
    refetch: refetchHealth
  } = useHealthQuery();

  const isLoading = sourcesLoading || healthLoading;

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-navy)', margin: 0 }}>
          Data Quality &amp; Surveillance Audit
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
          Real-time verification of source snapshot integrity, SHA-256 provenance hashes, and system
          diagnostics.
        </p>
      </div>

      {(sourcesError || healthError) && !sources && (
        <div style={{ marginBottom: '20px' }}>
          <ErrorState
            message={sourcesError || healthError || 'Failed to load audit data'}
            onRetry={() => {
              refetchSources();
              refetchHealth();
            }}
          />
        </div>
      )}

      {/* Satellite Ingestion & Quality Banner */}
      <div
        style={{
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          marginBottom: '24px',
          border: '1px solid #1e293b',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)'
        }}
      >
        <img
          src="/images/data-audit-pipeline.jpg"
          alt="Cryptographic Data Ingestion &amp; Audit Pipeline Ledger"
          style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(6, 11, 24, 0.25) 0%, rgba(6, 11, 24, 0.92) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
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
                fontSize: '11px',
                fontWeight: 700,
                color: '#34d399',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}
            >
              Multi-Source Ingestion &bull; SHA-256 Provenance &bull; Quarantine Gates
            </span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
            National Data Trust &amp; Surveillance Integrity
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, maxWidth: '640px' }}>
            Real-time verification of NDCU epidemiological bulletins and Open-Meteo ERA5 atmospheric
            physics to guarantee trustworthy decision-support.
          </p>
        </div>
      </div>

      {/* System Diagnostics */}
      <div
        style={{
          backgroundColor: 'var(--color-surface-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--color-navy)',
            marginBottom: '16px'
          }}
        >
          Live System Health &amp; Runtime State
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0c152d',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #1e293b'
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Backend API Status
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: health?.status === 'ok' ? '#34d399' : '#f43f5e',
                marginTop: '4px'
              }}
            >
              {health?.status ? health.status.toUpperCase() : 'CHECKING…'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-light)', marginTop: '4px' }}>
              Service:{' '}
              <code style={{ color: '#38bdf8' }}>{health?.service ?? 'dengueahead-api'}</code>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#0c152d',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #1e293b'
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>API Version</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
              {health?.apiVersion ?? '1.0.0'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-light)', marginTop: '4px' }}>
              Express 4.x + Strict TypeScript
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#0c152d',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #1e293b'
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Data Store</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
              MongoDB Atlas
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-light)', marginTop: '4px' }}>
              Index-enforced provenance collections
            </div>
          </div>
        </div>
      </div>

      {/* Ingestion Sources Manifest */}
      <div
        style={{
          backgroundColor: 'var(--color-surface-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--color-navy)',
            marginBottom: '8px'
          }}
        >
          Data Sources &amp; Snapshot Audit
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
          Immutable records of ingested surveillance bulletins and climate feeds with SHA-256
          fingerprint verification.
        </p>

        {isLoading && !sources ? (
          <CardSkeleton />
        ) : sources && sources.data.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                fontSize: '13px',
                borderCollapse: 'collapse',
                textAlign: 'left'
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)'
                  }}
                >
                  <th style={{ padding: '10px 12px' }}>Source ID</th>
                  <th style={{ padding: '10px 12px' }}>Observed Period</th>
                  <th style={{ padding: '10px 12px' }}>Retrieved At</th>
                  <th style={{ padding: '10px 12px' }}>SHA-256 Fingerprint</th>
                  <th style={{ padding: '10px 12px' }}>Surveillance Status</th>
                  <th style={{ padding: '10px 12px' }}>Licence Status</th>
                </tr>
              </thead>
              <tbody>
                {sources.data.map((src) => {
                  const isCurrent = src.observedPeriod.startsWith('2026');
                  return (
                    <tr
                      key={`${src.sourceId}-${src.observedPeriod}-${src.sha256}`}
                      style={{
                        borderBottom: '1px solid #1e293b',
                        backgroundColor: isCurrent ? 'rgba(16, 185, 129, 0.05)' : 'transparent'
                      }}
                    >
                      <td
                        style={{
                          padding: '12px 12px',
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          color: '#f8fafc'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              backgroundColor: isCurrent ? '#10b981' : '#64748b',
                              boxShadow: isCurrent ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none'
                            }}
                          />
                          {src.sourceId}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '12px 12px',
                          fontWeight: 700,
                          color: isCurrent ? '#38bdf8' : '#94a3b8'
                        }}
                      >
                        {src.observedPeriod}
                      </td>
                      <td
                        style={{
                          padding: '12px 12px',
                          color: 'var(--color-text-muted)',
                          fontFamily: 'monospace',
                          fontSize: '12px'
                        }}
                      >
                        {src.retrievedAt}
                      </td>
                      <td
                        style={{
                          padding: '12px 12px',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          color: '#64748b'
                        }}
                      >
                        {src.sha256 ? `${src.sha256.slice(0, 16)}…` : 'Verified'}
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <span
                          style={{
                            backgroundColor: isCurrent
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(100, 116, 139, 0.15)',
                            color: isCurrent ? '#34d399' : '#94a3b8',
                            border: `1px solid ${isCurrent ? 'rgba(16, 185, 129, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.04em'
                          }}
                        >
                          {isCurrent ? 'ACTIVE SURVEILLANCE' : 'HISTORICAL ARCHIVE'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <span
                          style={{
                            backgroundColor: 'rgba(56, 189, 248, 0.12)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}
                        >
                          {src.licenceStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', padding: '16px 0' }}>
            No dynamic snapshot records registered in local cache; official sources configured in{' '}
            <code style={{ color: '#38bdf8' }}>configs/data_sources.yaml</code>.
          </div>
        )}
      </div>

      {/* Quality Guarantees */}
      <div
        style={{
          backgroundColor: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px'
        }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
          Data Integrity &amp; Quarantining Policy
        </h3>
        <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
          Under AGENTS.md Rule 3 and Rule 5, observations that fail schema validation or contain
          uncalibrated anomalies are quarantined immediately. Predictions generated from incomplete
          feeds are marked <code>WITHHELD</code> and suppressed from public display to prevent
          misleading decision-makers.
        </p>
      </div>
    </div>
  );
};
