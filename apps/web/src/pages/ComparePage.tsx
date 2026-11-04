import React, { useState, useEffect } from 'react';
import { useRouter, setSearchParam } from '../lib/router.js';
import { useCompareQuery, useAreasQuery } from '../lib/hooks.js';
import { StatusBadge } from '../components/ui/Badge.js';
import { CardSkeleton } from '../components/ui/LoadingSkeleton.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { ErrorState } from '../components/ui/ErrorState.js';

export const ComparePage: React.FC = () => {
  const router = useRouter();
  const rawAreaIds = router.getParam('areaIds');

  // Initial selection from query param or defaults
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (rawAreaIds) {
      return rawAreaIds.split(',').filter(Boolean).slice(0, 3);
    }
    return ['LK-11', 'LK-12']; // Colombo & Gampaha by default
  });

  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  const { data: areasData } = useAreasQuery();
  const { data: compareData, isLoading, error, refetch } = useCompareQuery(selectedIds);

  // Sync state to URL
  useEffect(() => {
    if (selectedIds.length > 0) {
      setSearchParam('areaIds', selectedIds.join(','));
    }
  }, [selectedIds]);

  const handleAddDistrict = (id: string) => {
    if (!id) return;
    if (selectedIds.includes(id)) return;

    if (selectedIds.length >= 3) {
      setValidationWarning('Maximum 3 areas may be compared simultaneously.');
      return;
    }

    setValidationWarning(null);
    setSelectedIds([...selectedIds, id]);
  };

  const handleRemoveDistrict = (id: string) => {
    setValidationWarning(null);
    setSelectedIds(selectedIds.filter((item) => item !== id));
  };

  const availableDistricts = (areasData?.data || []).filter((d) => !selectedIds.includes(d.areaId));

  return (
    <div>
      {/* Comparative Surveillance Banner */}
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
          src="/images/comparative-analytics.jpg"
          alt="Comparative Epidemiological Multi-District Transmission Analytics"
          style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(6, 11, 24, 0.15) 0%, rgba(6, 11, 24, 0.9) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '20px 24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#818cf8' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Side-by-Side Trajectory &bull; Baseline Comparison &bull; Max 3 Units
            </span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Comparative Epidemiological Trajectories
          </h2>
        </div>
      </div>

      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-navy)', margin: 0 }}>
          Multi-District Comparison
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
          Evaluate transmission trajectories, seasonal baselines, and forecast divergences
          side-by-side (max 3 districts).
        </p>
      </div>

      {/* Selector & Chips */}
      <div
        style={{
          backgroundColor: 'var(--color-surface-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '12px'
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-main)' }}>
            Selected Districts ({selectedIds.length}/3):
          </span>

          {selectedIds.map((id) => {
            const area = (areasData?.data || []).find((a) => a.areaId === id);
            return (
              <span
                key={id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  color: '#38bdf8',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}
              >
                {area?.name ?? id} ({id})
                <button
                  onClick={() => handleRemoveDistrict(id)}
                  aria-label={`Remove ${area?.name ?? id}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#38bdf8',
                    fontWeight: 700,
                    padding: '0 2px'
                  }}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>

        {/* Add District Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            id="compare-district-select"
            aria-label="Add district to comparison"
            onChange={(e) => {
              handleAddDistrict(e.target.value);
              e.target.value = '';
            }}
            defaultValue=""
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-card)'
            }}
          >
            <option value="" disabled>
              + Add a district to compare…
            </option>
            {availableDistricts.map((d) => (
              <option key={d.areaId} value={d.areaId}>
                {d.name} ({d.areaId})
              </option>
            ))}
          </select>

          {selectedIds.length < 2 && (
            <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>
              Select at least 2 districts for comparison.
            </span>
          )}
        </div>

        {/* Validation Warning (UI-06) */}
        {validationWarning && (
          <div
            role="alert"
            style={{
              marginTop: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '13px',
              color: '#f59e0b'
            }}
          >
            {validationWarning}
          </div>
        )}
      </div>

      {/* Error State */}
      {error && !compareData && (
        <div style={{ marginBottom: '24px' }}>
          <ErrorState message={error} onRetry={refetch} />
        </div>
      )}

      {/* Side-by-Side Comparison Matrix */}
      {isLoading && !compareData ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${selectedIds.length || 2}, 1fr)`,
            gap: '16px'
          }}
        >
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : compareData && compareData.comparisons.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${compareData.comparisons.length}, minmax(260px, 1fr))`,
            gap: '20px'
          }}
        >
          {compareData.comparisons.map(({ area, prediction, recentTrend }) => {
            const isWithheld = prediction.status === 'WITHHELD';
            return (
              <div
                key={area.areaId}
                style={{
                  backgroundColor: 'var(--color-surface-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  padding: '24px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: 'var(--color-navy)',
                        margin: 0
                      }}
                    >
                      {area.name}
                    </h3>
                    <StatusBadge status={prediction.status} size="sm" />
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-text-muted)',
                      fontFamily: 'monospace'
                    }}
                  >
                    {area.areaId}
                  </div>
                </div>

                {/* KPI Metrics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div
                    style={{
                      backgroundColor: '#0c152d',
                      border: '1px solid #1e293b',
                      padding: '10px 12px',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Point Forecast ($t+1$)
                    </div>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: 800,
                        color: isWithheld ? '#64748B' : 'var(--color-primary)'
                      }}
                    >
                      {isWithheld || prediction.pointForecast === null
                        ? 'Withheld'
                        : `${prediction.pointForecast} cases`}
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#0c152d',
                      border: '1px solid #1e293b',
                      padding: '10px 12px',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      90% Conformal Interval
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                      {prediction.interval
                        ? `[${prediction.interval.lower.toFixed(0)}, ${prediction.interval.upper.toFixed(0)}]`
                        : 'Interval not available'}
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#0c152d',
                      border: '1px solid #1e293b',
                      padding: '10px 12px',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      Hotspot Probability
                    </div>
                    <div
                      style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-emerging)' }}
                    >
                      {prediction.confidenceStatus === 'CALIBRATED' &&
                      prediction.riskProbability !== null
                        ? `${Math.round(prediction.riskProbability * 100)}%`
                        : prediction.confidenceStatus === 'UNCALIBRATED'
                          ? 'Uncalibrated'
                          : '—'}
                    </div>
                  </div>
                </div>

                {/* Modern Mini Trend Histogram / Sparkline */}
                {(() => {
                  const last4 = recentTrend.slice(-4);
                  const maxCasesInTrend = Math.max(...last4.map((pt) => pt.cases ?? 0), 10);
                  const firstVal = last4[0]?.cases ?? 0;
                  const latestVal = last4[last4.length - 1]?.cases ?? 0;
                  const deltaPct =
                    firstVal > 0 ? Math.round(((latestVal - firstVal) / firstVal) * 100) : 0;

                  return (
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}
                      >
                        <h4
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#94a3b8',
                            margin: 0
                          }}
                        >
                          Recent 4-Week Trajectory
                        </h4>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor:
                              deltaPct > 0
                                ? 'rgba(244, 63, 94, 0.15)'
                                : deltaPct < 0
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(56, 189, 248, 0.15)',
                            color:
                              deltaPct > 0
                                ? '#fb7185'
                                : deltaPct < 0
                                ? '#34d399'
                                : '#38bdf8',
                            border: `1px solid ${
                              deltaPct > 0
                                ? 'rgba(244, 63, 94, 0.3)'
                                : deltaPct < 0
                                ? 'rgba(16, 185, 129, 0.3)'
                                : 'rgba(56, 189, 248, 0.3)'
                            }`
                          }}
                        >
                          {deltaPct > 0 ? `+${deltaPct}% Surge` : deltaPct < 0 ? `${deltaPct}% Drop` : 'Stable'}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'flex-end',
                          height: '62px',
                          backgroundColor: 'rgba(8, 14, 32, 0.8)',
                          border: '1px solid rgba(30, 41, 59, 0.8)',
                          padding: '10px 12px 6px 12px',
                          borderRadius: '10px',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)'
                        }}
                      >
                        {last4.map((pt, idx) => {
                          const cases = pt.cases ?? 0;
                          const heightPct = Math.min(100, Math.max(14, (cases / maxCasesInTrend) * 100));
                          const isLatest = idx === last4.length - 1;
                          return (
                            <div
                              key={idx}
                              style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                height: '100%',
                                justifyContent: 'flex-end'
                              }}
                              title={`Week: ${pt.weekStart} | ${cases} confirmed cases`}
                            >
                              <span
                                style={{
                                  fontSize: '10px',
                                  color: isLatest ? '#38BDF8' : '#64748B',
                                  fontWeight: isLatest ? 800 : 600,
                                  fontFamily: 'ui-monospace, SFMono-Regular, monospace'
                                }}
                              >
                                {cases}
                              </span>
                              <div
                                style={{
                                  width: '100%',
                                  height: `${(heightPct * 28) / 100}px`,
                                  background: isLatest
                                    ? 'linear-gradient(180deg, #38BDF8 0%, #2563EB 100%)'
                                    : 'linear-gradient(180deg, #1E3A8A 0%, #0F172A 100%)',
                                  borderRadius: '4px 4px 1px 1px',
                                  border: isLatest
                                    ? '1px solid #38BDF8'
                                    : '1px solid rgba(30, 58, 138, 0.5)',
                                  boxShadow: isLatest ? '0 0 10px rgba(56, 189, 248, 0.4)' : 'none',
                                  transition: 'height 0.2s ease'
                                }}
                              />
                              <span
                                style={{
                                  fontSize: '9px',
                                  color: isLatest ? '#94A3B8' : '#475569',
                                  fontWeight: 600,
                                  fontFamily: 'sans-serif'
                                }}
                              >
                                {isLatest ? 'Now' : `W-${last4.length - 1 - idx}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Select Districts to Compare"
          message="Pick up to three districts from the dropdown above to display side-by-side risk matrices and trajectories."
        />
      )}
    </div>
  );
};
