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
          backgroundColor: '#FFFFFF',
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
                  backgroundColor: '#EFF6FF',
                  color: '#1D4ED8',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: '1px solid #BFDBFE'
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
                    color: '#1D4ED8',
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
              backgroundColor: '#FFFFFF'
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
              backgroundColor: '#FEF3C7',
              border: '1px solid #FCD34D',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '13px',
              color: '#92400E'
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
                  backgroundColor: '#FFFFFF',
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
                      backgroundColor: '#F8FAFC',
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
                      backgroundColor: '#F8FAFC',
                      padding: '10px 12px',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      90% Conformal Interval
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                      {prediction.interval
                        ? `[${prediction.interval.lower.toFixed(0)}, ${prediction.interval.upper.toFixed(0)}]`
                        : 'Interval not available'}
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#F8FAFC',
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

                {/* Mini Recent Trend Sparks */}
                <div>
                  <h4
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                      marginBottom: '8px'
                    }}
                  >
                    Recent 4-Week Trend
                  </h4>
                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      alignItems: 'flex-end',
                      height: '48px',
                      backgroundColor: '#F8FAFC',
                      padding: '8px',
                      borderRadius: '6px'
                    }}
                  >
                    {recentTrend.slice(-4).map((pt, idx) => (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>
                          {pt.cases ?? 0}
                        </span>
                        <div
                          style={{
                            width: '100%',
                            height: `${Math.min(24, Math.max(4, ((pt.cases ?? 0) / 100) * 24))}px`,
                            backgroundColor: '#2563EB',
                            borderRadius: '2px'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
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
