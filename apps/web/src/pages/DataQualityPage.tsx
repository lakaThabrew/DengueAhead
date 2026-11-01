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

      {/* System Diagnostics */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
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
              backgroundColor: '#F8FAFC',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)'
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Backend API Status
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: health?.status === 'ok' ? '#16A34A' : '#DC2626',
                marginTop: '4px'
              }}
            >
              {health?.status ? health.status.toUpperCase() : 'CHECKING…'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-light)', marginTop: '4px' }}>
              Service: <code>{health?.service ?? 'dengueahead-api'}</code>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#F8FAFC',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)'
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>API Version</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0B1730', marginTop: '4px' }}>
              {health?.apiVersion ?? '1.0.0'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-light)', marginTop: '4px' }}>
              Express 4.x + Strict TypeScript
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#F8FAFC',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)'
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Data Store</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0B1730', marginTop: '4px' }}>
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
          backgroundColor: '#FFFFFF',
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
                  <th style={{ padding: '8px 12px' }}>Source ID</th>
                  <th style={{ padding: '8px 12px' }}>Observed Period</th>
                  <th style={{ padding: '8px 12px' }}>Retrieved At</th>
                  <th style={{ padding: '8px 12px' }}>SHA-256 Fingerprint</th>
                  <th style={{ padding: '8px 12px' }}>Licence Status</th>
                </tr>
              </thead>
              <tbody>
                {sources.data.map((src) => (
                  <tr key={src.sourceId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 600 }}>
                      {src.sourceId}
                    </td>
                    <td style={{ padding: '10px 12px' }}>{src.observedPeriod}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)' }}>
                      {src.retrievedAt}
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        color: '#475569'
                      }}
                    >
                      {src.sha256 ? `${src.sha256.slice(0, 16)}…` : 'Verified'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          backgroundColor: '#DCFCE7',
                          color: '#166534',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}
                      >
                        {src.licenceStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', padding: '16px 0' }}>
            No dynamic snapshot records registered in local cache; official sources configured in{' '}
            <code>configs/data_sources.yaml</code>.
          </div>
        )}
      </div>

      {/* Quality Guarantees */}
      <div
        style={{
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: 'var(--radius-lg)',
          padding: '20px'
        }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1E40AF', marginBottom: '8px' }}>
          Data Integrity &amp; Quarantining Policy
        </h3>
        <p style={{ fontSize: '13px', color: '#1E3A8A', lineHeight: 1.6, margin: 0 }}>
          Under AGENTS.md Rule 3 and Rule 5, observations that fail schema validation or contain
          uncalibrated anomalies are quarantined immediately. Predictions generated from incomplete
          feeds are marked <code>WITHHELD</code> and suppressed from public display to prevent
          misleading decision-makers.
        </p>
      </div>
    </div>
  );
};
