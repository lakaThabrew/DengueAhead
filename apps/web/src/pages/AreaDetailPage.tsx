import React from 'react';
import { navigate, useRouter } from '../lib/router.js';
import { useAreaDetailQuery, useAreaSeriesQuery, useAreaForecastQuery } from '../lib/hooks.js';
import { StatusBadge, QualityBadge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { TimeSeriesChart, TimeSeriesDataPoint } from '../components/charts/TimeSeriesChart.js';
import { CardSkeleton } from '../components/ui/LoadingSkeleton.js';
import { ErrorState } from '../components/ui/ErrorState.js';

interface AreaDetailPageProps {
  areaId?: string;
}

export const AreaDetailPage: React.FC<AreaDetailPageProps> = ({ areaId: propAreaId }) => {
  const router = useRouter();
  // Extract areaId from props or URL pathname (/app/areas/:areaId)
  const pathParts = router.pathname.split('/');
  const routeAreaId = pathParts[pathParts.indexOf('areas') + 1];
  const areaId = propAreaId || routeAreaId || 'LK-11';

  const {
    data: area,
    isLoading: areaLoading,
    error: areaError,
    refetch: refetchArea
  } = useAreaDetailQuery(areaId);
  const {
    data: series,
    isLoading: seriesLoading,
    error: seriesError,
    refetch: refetchSeries
  } = useAreaSeriesQuery(areaId);
  const {
    data: forecast,
    isLoading: forecastLoading,
    error: forecastError,
    refetch: refetchForecast
  } = useAreaForecastQuery(areaId);

  const isLoading = areaLoading || seriesLoading || forecastLoading;

  // Prepare chart data points from series + forecast
  const chartPoints: TimeSeriesDataPoint[] = [];

  if (series?.data) {
    series.data.slice(-12).forEach((obs) => {
      chartPoints.push({
        date: obs.weekStart,
        observed: obs.cases,
        threshold: forecast?.historicalBaseline?.hotspotThreshold ?? null
      });
    });
  }

  if (forecast?.prediction) {
    const pred = forecast.prediction;
    chartPoints.push({
      date: pred.targetWeek,
      predicted: pred.pointForecast,
      intervalLower: pred.interval?.lower ?? null,
      intervalUpper: pred.interval?.upper ?? null,
      threshold: forecast?.historicalBaseline?.hotspotThreshold ?? null
    });
  }

  const prediction = forecast?.prediction;
  const isWithheld = prediction?.status === 'WITHHELD';

  return (
    <div>
      {/* Back button */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => navigate('/app/map')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0
          }}
        >
          ← Back to Risk Map &amp; Registry
        </button>
      </div>

      {/* Error state */}
      {(areaError || seriesError || forecastError) && !area && (
        <div style={{ marginBottom: '24px' }}>
          <ErrorState
            message={areaError || seriesError || forecastError || 'Failed to load area data'}
            onRetry={() => {
              refetchArea();
              refetchSeries();
              refetchForecast();
            }}
          />
        </div>
      )}

      {/* District Profile Header */}
      {isLoading && !area ? (
        <CardSkeleton />
      ) : area ? (
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}
              >
                <h1
                  style={{
                    fontSize: '28px',
                    fontWeight: 800,
                    color: 'var(--color-navy)',
                    margin: 0
                  }}
                >
                  {area.name} District
                </h1>
                {prediction && <StatusBadge status={prediction.status} />}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                <span>
                  Area ID: <code style={{ fontWeight: 600 }}>{area.areaId}</code>
                </span>
                <span>
                  Level: <strong style={{ textTransform: 'capitalize' }}>{area.level}</strong>
                </span>
                {area.population && (
                  <span>
                    Population: <strong>{area.population.toLocaleString()}</strong>
                  </span>
                )}
                {area.centroid && (
                  <span>
                    Centroid: ({area.centroid.latitude.toFixed(4)}°N,{' '}
                    {area.centroid.longitude.toFixed(4)}°E)
                  </span>
                )}
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/app/compare?areaIds=${area.areaId}`)}
            >
              Compare with Another District
            </Button>
          </div>
        </div>
      ) : null}

      {/* Current Forecast KPI Card */}
      {prediction && (
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
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--color-navy)',
              marginBottom: '16px'
            }}
          >
            Next-Week Forecast ({prediction.targetWeek})
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}
          >
            {/* Point Forecast */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)'
              }}
            >
              <div
                style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}
              >
                Point Forecast ($t+1$)
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: isWithheld ? 'var(--color-withheld)' : 'var(--color-primary)'
                }}
              >
                {isWithheld || prediction.pointForecast === null
                  ? 'Withheld'
                  : `${prediction.pointForecast} cases`}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-light)', marginTop: '4px' }}>
                {isWithheld ? 'Quality gate suppressed' : 'HistGradientBoosting estimate'}
              </div>
            </div>

            {/* Conformal Interval */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)'
              }}
            >
              <div
                style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}
              >
                90% Conformal Interval
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#334155' }}>
                {prediction.interval
                  ? `[${prediction.interval.lower.toFixed(0)}, ${prediction.interval.upper.toFixed(0)}]`
                  : 'Interval not available'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-light)', marginTop: '4px' }}>
                Finite-sample coverage guarantee
              </div>
            </div>

            {/* Hotspot Probability */}
            <div
              style={{
                backgroundColor: '#F8FAFC',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)'
              }}
            >
              <div
                style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}
              >
                Hotspot Crossing Risk
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-emerging)' }}>
                {prediction.confidenceStatus === 'CALIBRATED' && prediction.riskProbability !== null
                  ? `${Math.round(prediction.riskProbability * 100)}%`
                  : prediction.confidenceStatus === 'UNCALIBRATED'
                    ? 'Uncalibrated'
                    : '—'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-light)', marginTop: '4px' }}>
                Threshold: {forecast?.historicalBaseline?.hotspotThreshold ?? '—'} cases
              </div>
            </div>
          </div>

          {/* Quality flags if any */}
          {prediction.qualityFlags && prediction.qualityFlags.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Data Quality Flags:
              </span>
              {prediction.qualityFlags.map((flag) => (
                <QualityBadge key={flag} flag={flag} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Time Series Chart */}
      <div style={{ marginBottom: '24px' }}>
        <TimeSeriesChart
          data={chartPoints}
          title={`${area?.name ?? 'District'} Weekly Case Trajectory & Next-Week Projection`}
        />
      </div>

      {/* Statistical Feature Drivers */}
      {forecast?.featureDrivers && forecast.featureDrivers.length > 0 && (
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
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--color-navy)',
              marginBottom: '4px'
            }}
          >
            Top Local Statistical Drivers
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            Features with highest attribution score for this specific district forecast.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginBottom: '16px'
            }}
          >
            {forecast.featureDrivers.map((driver) => (
              <div
                key={driver.feature}
                style={{
                  backgroundColor: '#F8FAFC',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#334155',
                    fontWeight: 600
                  }}
                >
                  {driver.feature}
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: driver.impact >= 0 ? '#DC4754' : '#0D9488',
                    marginTop: '4px'
                  }}
                >
                  {driver.impact >= 0 ? `+${driver.impact.toFixed(2)}` : driver.impact.toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '12px',
              color: '#1E40AF'
            }}
          >
            <strong>Statistical Disclaimer:</strong> {forecast.nonCausalDisclaimer}
          </div>
        </div>
      )}

      {/* Provenance Metadata Card */}
      {prediction && (
        <div
          style={{
            backgroundColor: '#F8FAFC',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            padding: '16px 20px',
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '24px'
          }}
        >
          <div>
            Model Version: <strong style={{ color: '#0B1730' }}>{prediction.modelVersion}</strong>
          </div>
          <div>
            Issue Date: <strong style={{ color: '#0B1730' }}>{prediction.issueDate}</strong>
          </div>
          <div>
            Target Week: <strong style={{ color: '#0B1730' }}>{prediction.targetWeek}</strong>
          </div>
          <div>
            As-Of Cutoff: <strong style={{ color: '#0B1730' }}>{prediction.asOfDate}</strong>
          </div>
          {(prediction.sourceSnapshotIds?.length ?? 0) > 0 && (
            <div>
              Snapshot Provenance:{' '}
              <code style={{ fontSize: '11px' }}>{prediction.sourceSnapshotIds?.join(', ')}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
