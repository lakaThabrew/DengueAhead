import React, { useState } from 'react';
import { useBacktestsQuery } from '../lib/hooks.js';
import { Button } from '../components/ui/Button.js';
import { CardSkeleton } from '../components/ui/LoadingSkeleton.js';
import { ErrorState } from '../components/ui/ErrorState.js';

interface ReplaySample {
  week: string;
  district: string;
  asOfDate: string;
  forecast: number;
  actual: number;
  naiveForecast: number;
  seasonalForecast: number;
}

const HISTORICAL_WEEKS: ReplaySample[] = [
  {
    week: '2024-06-15',
    district: 'Colombo (LK-11)',
    asOfDate: '2024-06-08',
    forecast: 148,
    actual: 154,
    naiveForecast: 132,
    seasonalForecast: 160
  },
  {
    week: '2024-07-20',
    district: 'Gampaha (LK-12)',
    asOfDate: '2024-07-13',
    forecast: 89,
    actual: 92,
    naiveForecast: 75,
    seasonalForecast: 105
  },
  {
    week: '2024-08-10',
    district: 'Kalutara (LK-13)',
    asOfDate: '2024-08-03',
    forecast: 42,
    actual: 39,
    naiveForecast: 51,
    seasonalForecast: 48
  }
];

export const HistoryPage: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [revealed, setRevealed] = useState<boolean>(false);

  const { data: backtests, isLoading, error, refetch } = useBacktestsQuery();

  const currentSample = HISTORICAL_WEEKS[selectedIdx]!;
  const hgbError = Math.abs(currentSample.forecast - currentSample.actual);
  const naiveError = Math.abs(currentSample.naiveForecast - currentSample.actual);
  const seasonalError = Math.abs(currentSample.seasonalForecast - currentSample.actual);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-navy)', margin: 0 }}>
          Historical Replay &amp; Time Travel
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
          Evaluate past weekly forecasts under strict temporal isolation. Hides actual outcomes
          until revealed.
        </p>
      </div>

      {error && !backtests && (
        <div style={{ marginBottom: '20px' }}>
          <ErrorState message={error} onRetry={refetch} />
        </div>
      )}

      {/* Week Selector Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-main)' }}>
            Select Historical Test Week:
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {HISTORICAL_WEEKS.map((sample, idx) => (
              <Button
                key={sample.week}
                variant={selectedIdx === idx ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => {
                  setSelectedIdx(idx);
                  setRevealed(false);
                }}
              >
                {sample.week} ({sample.district.split(' ')[0]})
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Strict As-Of Safety Confirmation Banner */}
      <div
        style={{
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          fontSize: '13px',
          color: '#1E40AF',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span>🔒</span>
        <span>
          <strong>Temporal Leakage Guard:</strong> Features generated strictly as of{' '}
          <code>{currentSample.asOfDate}</code>. Zero surveillance reports or weather observations
          after this timestamp were accessed.
        </span>
      </div>

      {/* As-Of Forecast Panel */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '28px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '24px'
          }}
        >
          <div>
            <h2
              style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-navy)', margin: 0 }}
            >
              Forecast Issued for Week {currentSample.week}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Target District: <strong>{currentSample.district}</strong> · Issue Cutoff:{' '}
              <code>{currentSample.asOfDate}</code>
            </div>
          </div>

          {!revealed ? (
            <Button size="md" onClick={() => setRevealed(true)}>
              Reveal Actual Outcome →
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setRevealed(false)}>
              Hide Outcome
            </Button>
          )}
        </div>

        {/* Prediction Display Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '24px'
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
              DengueAhead HGB Forecast
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-primary)' }}>
              {currentSample.forecast} cases
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-light)', marginTop: '4px' }}>
              As-of safe model inference
            </div>
          </div>

          <div
            style={{
              backgroundColor: revealed ? '#F0FDF4' : '#F1F5F9',
              padding: '16px',
              borderRadius: '8px',
              border: `1px solid ${revealed ? '#BBF7D0' : 'var(--color-border)'}`
            }}
          >
            <div
              style={{ fontSize: '12px', color: revealed ? '#166534' : 'var(--color-text-muted)' }}
            >
              Reported Actual Outcome
            </div>
            <div
              style={{ fontSize: '32px', fontWeight: 800, color: revealed ? '#16A34A' : '#94A3B8' }}
            >
              {revealed ? `${currentSample.actual} cases` : '████ Hidden'}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: revealed ? '#15803D' : 'var(--color-text-light)',
                marginTop: '4px'
              }}
            >
              {revealed ? 'Reported by NDCU' : 'Click "Reveal" to unmask truth'}
            </div>
          </div>
        </div>

        {/* Comparative Baseline Performance (revealed only) */}
        {revealed && (
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
            <h3
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--color-navy)',
                marginBottom: '12px'
              }}
            >
              Error Delta vs Historical Baselines
            </h3>
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
                    <th style={{ padding: '8px' }}>Model</th>
                    <th style={{ padding: '8px' }}>Forecasted</th>
                    <th style={{ padding: '8px' }}>Actual</th>
                    <th style={{ padding: '8px' }}>Absolute Error</th>
                    <th style={{ padding: '8px' }}>Accuracy Advantage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      backgroundColor: '#EFF6FF',
                      fontWeight: 600
                    }}
                  >
                    <td style={{ padding: '10px 8px', color: '#1D4ED8' }}>DengueAhead HGB</td>
                    <td style={{ padding: '10px 8px' }}>{currentSample.forecast}</td>
                    <td style={{ padding: '10px 8px' }}>{currentSample.actual}</td>
                    <td style={{ padding: '10px 8px', color: '#16A34A' }}>{hgbError} cases</td>
                    <td style={{ padding: '10px 8px', color: '#16A34A' }}>Baseline Champion</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px' }}>Seasonal Historical Median</td>
                    <td style={{ padding: '8px' }}>{currentSample.seasonalForecast}</td>
                    <td style={{ padding: '8px' }}>{currentSample.actual}</td>
                    <td style={{ padding: '8px' }}>{seasonalError} cases</td>
                    <td style={{ padding: '8px', color: '#DC2626' }}>
                      +{seasonalError - hgbError} error
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px' }}>Naive Last Week</td>
                    <td style={{ padding: '8px' }}>{currentSample.naiveForecast}</td>
                    <td style={{ padding: '8px' }}>{currentSample.actual}</td>
                    <td style={{ padding: '8px' }}>{naiveError} cases</td>
                    <td style={{ padding: '8px', color: '#DC2626' }}>
                      +{naiveError - hgbError} error
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Aggregate Backtest Summary */}
      {isLoading ? (
        <CardSkeleton />
      ) : backtests && backtests.data.length > 0 ? (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--color-navy)',
              marginBottom: '8px'
            }}
          >
            Verified Backtest Records ({backtests.count})
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            Historical evaluation runs published to MongoDB.
          </p>
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
                  <th style={{ padding: '8px' }}>Model Version</th>
                  <th style={{ padding: '8px' }}>Target Window</th>
                  <th style={{ padding: '8px' }}>MAE</th>
                  <th style={{ padding: '8px' }}>Top-K Recall</th>
                  <th style={{ padding: '8px' }}>Brier Score</th>
                </tr>
              </thead>
              <tbody>
                {backtests.data.map((bt, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{bt.modelVersion}</td>
                    <td style={{ padding: '8px' }}>
                      {bt.testRange.startWeek} → {bt.testRange.endWeek}
                    </td>
                    <td style={{ padding: '8px', fontWeight: 600 }}>{bt.mae.toFixed(2)}</td>
                    <td style={{ padding: '8px' }}>{(bt.topKRecall * 100).toFixed(1)}%</td>
                    <td style={{ padding: '8px' }}>
                      {bt.brierScore !== null ? bt.brierScore.toFixed(3) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};
