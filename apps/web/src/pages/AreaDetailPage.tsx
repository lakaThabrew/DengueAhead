import React from 'react';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
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

      {/* District Profile Header — always render h1 for accessibility and E2E stability */}
      {!area && (
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 800,
            color: 'var(--color-navy)',
            margin: '0 0 16px 0'
          }}
        >
          {areaId} District
        </h1>
      )}

      {isLoading && !area ? (
        <CardSkeleton />
      ) : area ? (
        <>
          {/* District Vector Ecology Hero Banner */}
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
              src="/images/field-officer-inspection.jpg"
              alt="Sri Lankan Field Health Inspection &amp; Vector Density Larvicide Surveillance"
              style={{ width: '100%', height: '170px', objectFit: 'cover', display: 'block' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(6, 11, 24, 0.15) 0%, rgba(6, 11, 24, 0.88) 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '20px 24px'
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#f59e0b'
                  }}
                />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#fbbf24',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em'
                  }}
                >
                  Micro-Habitat Ecology &bull; Feature Importance Drivers &bull; Conformal
                  Uncertainty
                </span>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                {area.name} District Epidemiological Profile
              </h2>
            </div>
          </div>

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
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '4px'
                  }}
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
        </>
      ) : null}

      {/* Current Forecast KPI Card */}
      {prediction && (
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
                backgroundColor: '#0c152d',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #1e293b'
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
                backgroundColor: '#0c152d',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #1e293b'
              }}
            >
              <div
                style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}
              >
                90% Conformal Interval
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc' }}>
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
                backgroundColor: '#0c152d',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #1e293b'
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
            backgroundColor: '#070E22',
            backgroundImage:
              'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.08) 0%, #070E22 80%)',
            borderRadius: '18px',
            border: '1px solid rgba(56, 189, 248, 0.22)',
            padding: '24px 28px',
            marginBottom: '24px',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.55), 0 0 25px rgba(14, 165, 233, 0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Top Cyber Accent Line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background:
                'linear-gradient(90deg, transparent 0%, #38BDF8 30%, #818CF8 70%, transparent 100%)',
              opacity: 0.85
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Sparkles style={{ width: '18px', height: '18px', color: '#38BDF8' }} />
            <h3
              style={{
                fontSize: '17px',
                fontWeight: 800,
                color: '#F8FAFC',
                margin: 0,
                letterSpacing: '-0.01em'
              }}
            >
              Top Local Statistical Drivers
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0 18px 0' }}>
            Covariates with highest local attribution score for this specific district forecast
            horizon.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '18px'
            }}
          >
            {forecast.featureDrivers.map((driver) => {
              const isSurge = driver.impact >= 0;
              const absVal = Math.min(100, Math.round(Math.abs(driver.impact) * 100));
              return (
                <div
                  key={driver.feature}
                  style={{
                    backgroundColor: 'rgba(11, 20, 44, 0.6)',
                    padding: '14px',
                    borderRadius: '12px',
                    border: `1px solid ${isSurge ? 'rgba(244, 63, 94, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`,
                    boxShadow: isSurge
                      ? '0 0 15px rgba(244, 63, 94, 0.08)'
                      : '0 0 15px rgba(52, 211, 153, 0.08)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '6px'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '12px',
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        color: '#E2E8F0',
                        fontWeight: 700
                      }}
                    >
                      {driver.feature}
                    </div>
                    {isSurge ? (
                      <TrendingUp style={{ width: '14px', height: '14px', color: '#FB7185' }} />
                    ) : (
                      <TrendingDown style={{ width: '14px', height: '14px', color: '#34D399' }} />
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      marginBottom: '6px'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: isSurge ? '#FB7185' : '#34D399',
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace'
                      }}
                    >
                      {isSurge ? `+${driver.impact.toFixed(2)}` : driver.impact.toFixed(2)}
                    </div>
                    <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>
                      {isSurge ? 'Amplifying' : 'Attenuating'}
                    </span>
                  </div>

                  {/* Impact Magnitude Bar */}
                  <div
                    style={{
                      height: '4px',
                      backgroundColor: '#070D1E',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${absVal}%`,
                        backgroundColor: isSurge ? '#F43F5E' : '#10B981',
                        borderRadius: '2px'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              backgroundColor: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '10px',
              padding: '12px 14px',
              fontSize: '12px',
              color: '#38BDF8',
              lineHeight: 1.5
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
            backgroundColor: '#0c152d',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #1e293b',
            padding: '16px 20px',
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '24px'
          }}
        >
          <div>
            Model Version: <strong style={{ color: '#38bdf8' }}>{prediction.modelVersion}</strong>
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
