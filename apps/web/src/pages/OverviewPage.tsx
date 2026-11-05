import React, { useState } from 'react';
import { navigate } from '../lib/router.js';
import { useMetaQuery, useOverviewQuery } from '../lib/hooks.js';
import { MetricCard } from '../components/ui/MetricCard.js';
import { StatusBadge } from '../components/ui/Badge.js';
import { Select } from '../components/ui/Select.js';
import { CardSkeleton } from '../components/ui/LoadingSkeleton.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { ErrorState } from '../components/ui/ErrorState.js';
import { OfflineBanner } from '../components/ui/OfflineBanner.js';

export const OverviewPage: React.FC = () => {
  const {
    data: meta,
    isLoading: metaLoading,
    error: metaError,
    refetch: refetchMeta
  } = useMetaQuery();
  const [selectedIssueDate, setSelectedIssueDate] = useState<string>('');

  const activeIssueDate = selectedIssueDate || meta?.latestIssueDate || undefined;
  const {
    data: overview,
    isLoading: overviewLoading,
    error: overviewError,
    refetch: refetchOverview
  } = useOverviewQuery(activeIssueDate);

  const isLoading = metaLoading || overviewLoading;
  const isStale = meta?.sourceFreshnessStatus === 'STALE';
  const isUnavailable = meta?.sourceFreshnessStatus === 'UNAVAILABLE';

  return (
    <div>
      {/* Offline / Stale banners */}
      {isStale && (
        <div style={{ marginBottom: '16px' }}>
          <OfflineBanner message="Warning: Source surveillance data is STALE (>14 days since last report). Forecast reliability may be reduced." />
        </div>
      )}
      {isUnavailable && (
        <div style={{ marginBottom: '16px' }}>
          <OfflineBanner message="Alert: Surveillance data UNAVAILABLE. Operating in fallback mode." />
        </div>
      )}

      {/* Console National Overview Banner */}
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
          src="/images/overview-command-center.jpg"
          alt="National Epidemiological Surveillance Command Center"
          style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(6, 11, 24, 0.2) 0%, rgba(6, 11, 24, 0.88) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '20px 24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8'
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#38bdf8',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}
            >
              Sri Lanka MoH &bull; National Surveillance Console
            </span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Active Transmission Indicators &bull; 7-Day Early Warning
          </h2>
        </div>
      </div>

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-navy)', margin: 0 }}>
            Surveillance Overview
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
            National summary of dengue transmission and 1-week ahead risk indicators.
          </p>
        </div>

        {/* Global Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#0c152d',
              border: '1px solid #1e293b',
              color: '#94a3b8'
            }}
          >
            Level: <strong style={{ color: '#38bdf8' }}>District</strong>
          </div>

          {meta?.latestIssueDate && (
            <Select
              id="overview-issue-date"
              aria-label="Forecast Issue Date"
              value={activeIssueDate ?? ''}
              onChange={(e) => setSelectedIssueDate(e.target.value)}
              options={[{ value: meta.latestIssueDate, label: `Latest (${meta.latestIssueDate})` }]}
            />
          )}

          {meta?.sourceFreshnessStatus && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: isStale ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: isStale ? '#f59e0b' : '#34d399',
                border: isStale
                  ? '1px solid rgba(245, 158, 11, 0.3)'
                  : '1px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              {meta.sourceFreshnessStatus}
            </span>
          )}
        </div>
      </div>

      {/* Error state */}
      {(metaError || overviewError) && !overview && (
        <div style={{ marginBottom: '24px' }}>
          <ErrorState
            message={metaError || overviewError || 'Failed to load overview data.'}
            onRetry={() => {
              refetchMeta();
              refetchOverview();
            }}
          />
        </div>
      )}

      {/* KPI Cards Grid */}
      {isLoading && !overview ? (
        <div className="metrics-grid">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : overview ? (
        <div className="metrics-grid">
          <MetricCard
            label="Monitored Districts"
            value={overview.monitoredAreasCount}
            color="var(--color-primary)"
            subtitle="National coverage"
          />
          <MetricCard
            label="Emerging Hotspots"
            value={overview.emergingHotspotsCount}
            color="var(--color-emerging)"
            trend={overview.emergingHotspotsCount > 0 ? 'up' : 'neutral'}
            subtitle="Crosses seasonal 75th %"
          />
          <MetricCard
            label="Persistent Hotspots"
            value={overview.persistentHotspotsCount}
            color="var(--color-persistent)"
            subtitle="Consistently high incidence"
          />
          <MetricCard
            label="Cooling Districts"
            value={overview.coolingAreasCount}
            color="var(--color-cooling)"
            subtitle="Dropping below threshold"
          />
          <MetricCard
            label="Stable Districts"
            value={overview.stableAreasCount}
            color="var(--color-stable)"
            subtitle="Within historical baseline"
          />
          <MetricCard
            label="Withheld Forecasts"
            value={overview.withheldCount}
            color="var(--color-withheld)"
            subtitle="Data quality guarded"
          />
        </div>
      ) : null}

      {/* Top Emerging Hotspots Section */}
      <div
        style={{
          backgroundColor: 'var(--color-surface-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '24px'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}
        >
          <div>
            <h2
              style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-navy)', margin: 0 }}
            >
              Top Emerging Hotspots
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
              Districts prioritized by predicted risk increase for next week (
              {overview?.targetWeek ?? 'Next Target Week'}).
            </p>
          </div>
          <button
            onClick={() => navigate('/app/map')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            View Map →
          </button>
        </div>

        {overview?.topEmergingAreas && overview.topEmergingAreas.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '14px'
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)'
                  }}
                >
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>District</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Area ID</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Point Forecast ($t+1$)</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Hotspot Probability</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Target Week</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {overview.topEmergingAreas.map(({ area, prediction }) => (
                  <tr
                    key={area.areaId}
                    style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                    onClick={() => navigate(`/app/areas/${area.areaId}`)}
                  >
                    <td
                      style={{ padding: '12px', fontWeight: 600, color: 'var(--color-text-main)' }}
                    >
                      {area.name}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        color: 'var(--color-text-muted)',
                        fontFamily: 'monospace'
                      }}
                    >
                      {area.areaId}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <StatusBadge status={prediction.status} size="sm" />
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>
                      {prediction.pointForecast !== null
                        ? `${prediction.pointForecast} cases`
                        : 'Withheld'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {prediction.confidenceStatus === 'CALIBRATED' &&
                      prediction.riskProbability !== null
                        ? `${Math.round(prediction.riskProbability * 100)}%`
                        : prediction.confidenceStatus === 'UNCALIBRATED'
                          ? 'Uncalibrated'
                          : '—'}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--color-text-muted)' }}>
                      {prediction.targetWeek}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/app/areas/${area.areaId}`);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-primary)',
                          fontWeight: 600,
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        Deep-Dive →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !isLoading ? (
          <EmptyState
            title="No Emerging Hotspots"
            message="No monitored districts are currently projected to cross their seasonal epidemic thresholds next week."
          />
        ) : null}
      </div>

      {/* Surveillance Summary Footer Note */}
      <div
        style={{
          fontSize: '12px',
          color: 'var(--color-text-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <span>
          Data issue date:{' '}
          <strong>{overview?.issueDate ?? meta?.latestIssueDate ?? 'Pending'}</strong> | Active
          Model: <code>{meta?.activeModelVersion ?? 'dengueahead-hgb-v1'}</code>
        </span>
        <span>
          Surveillance data supplied by National Dengue Control Unit (NDCU). Non-clinical
          decision-support.
        </span>
      </div>
    </div>
  );
};
