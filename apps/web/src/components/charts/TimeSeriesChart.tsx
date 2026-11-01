import React, { useState } from 'react';

export interface TimeSeriesDataPoint {
  date: string;
  observed?: number | null;
  predicted?: number | null;
  intervalLower?: number | null;
  intervalUpper?: number | null;
  threshold?: number | null;
}

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  title?: string;
  height?: number;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  title = 'Weekly Surveillance & Forecast Series',
  height = 260
}) => {
  const [showTable, setShowTable] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<TimeSeriesDataPoint | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
          borderRadius: '8px',
          color: 'var(--color-text-muted)',
          fontSize: '13px'
        }}
      >
        No historical or forecast observations available
      </div>
    );
  }

  // Calculate scales
  const width = 640;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Max value among observed, predicted, upper interval, threshold
  const allValues = data.flatMap((d) => [
    d.observed ?? 0,
    d.predicted ?? 0,
    d.intervalUpper ?? 0,
    d.threshold ?? 0
  ]);
  const maxValue = Math.max(...allValues, 10);
  const yMax = Math.ceil(maxValue * 1.15);

  const getX = (index: number) => padding.left + (index / (data.length - 1 || 1)) * chartWidth;
  const getY = (val: number) => padding.top + chartHeight - (val / yMax) * chartHeight;

  // Build observed path (solid dark line)
  const observedPoints = data
    .map((d, i) =>
      d.observed !== undefined && d.observed !== null
        ? { x: getX(i), y: getY(d.observed), val: d.observed }
        : null
    )
    .filter(Boolean) as { x: number; y: number; val: number }[];

  const observedPath = observedPoints.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`),
    ''
  );

  // Build threshold path (dotted amber line)
  const thresholdPoints = data
    .map((d, i) =>
      d.threshold !== undefined && d.threshold !== null
        ? { x: getX(i), y: getY(d.threshold) }
        : null
    )
    .filter(Boolean) as { x: number; y: number }[];

  const thresholdPath = thresholdPoints.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`),
    ''
  );

  // Build forecast point and conformal band
  const forecastIndex = data.findIndex((d) => d.predicted !== undefined && d.predicted !== null);
  const forecastPoint = forecastIndex >= 0 ? data[forecastIndex] : null;

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        padding: '20px',
        boxShadow: 'var(--shadow-sm)'
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
        <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-navy)', margin: 0 }}>
          {title}
        </h4>
        <button
          onClick={() => setShowTable(!showTable)}
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '12px',
            cursor: 'pointer',
            color: 'var(--color-text-muted)'
          }}
          aria-expanded={showTable}
        >
          {showTable ? 'Show Chart' : 'Show Data Table'}
        </button>
      </div>

      {showTable ? (
        <div style={{ maxHeight: `${height}px`, overflowY: 'auto' }}>
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
                <th style={{ padding: '6px' }}>Date</th>
                <th style={{ padding: '6px' }}>Observed Cases</th>
                <th style={{ padding: '6px' }}>Forecast ($t+1$)</th>
                <th style={{ padding: '6px' }}>90% Interval</th>
                <th style={{ padding: '6px' }}>Seasonal Threshold</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '6px' }}>{d.date}</td>
                  <td style={{ padding: '6px', fontWeight: 600 }}>{d.observed ?? '—'}</td>
                  <td style={{ padding: '6px', color: 'var(--color-primary)', fontWeight: 600 }}>
                    {d.predicted ?? '—'}
                  </td>
                  <td style={{ padding: '6px', color: 'var(--color-text-muted)' }}>
                    {d.intervalLower !== null &&
                    d.intervalUpper !== null &&
                    d.intervalLower !== undefined &&
                    d.intervalUpper !== undefined
                      ? `[${d.intervalLower.toFixed(0)}, ${d.intervalUpper.toFixed(0)}]`
                      : '—'}
                  </td>
                  <td style={{ padding: '6px', color: '#D97706' }}>{d.threshold ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: '100%', height: 'auto', display: 'block' }}
            role="region"
            aria-label="Time series chart displaying observed cases and model forecast"
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const val = Math.round(yMax * pct);
              const y = getY(val);
              return (
                <g key={pct}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#F1F5F9"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#94A3B8"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Threshold Line (Dotted Amber) */}
            {thresholdPath && (
              <path
                d={thresholdPath}
                fill="none"
                stroke="#D97706"
                strokeWidth="2"
                strokeDasharray="4 4"
                opacity="0.85"
              />
            )}

            {/* Conformal Uncertainty Shaded Band (if forecast exists) */}
            {forecastPoint &&
              forecastPoint.intervalLower !== null &&
              forecastPoint.intervalUpper !== null &&
              forecastPoint.intervalLower !== undefined &&
              forecastPoint.intervalUpper !== undefined &&
              forecastIndex >= 0 && (
                <rect
                  x={getX(forecastIndex) - 15}
                  y={getY(forecastPoint.intervalUpper)}
                  width="30"
                  height={Math.max(
                    2,
                    getY(forecastPoint.intervalLower) - getY(forecastPoint.intervalUpper)
                  )}
                  fill="rgba(37, 99, 235, 0.18)"
                  rx="4"
                />
              )}

            {/* Observed Cases Path (Solid Dark Blue) */}
            {observedPath && (
              <path d={observedPath} fill="none" stroke="#0B1730" strokeWidth="2.5" />
            )}

            {/* Observed data point dots */}
            {observedPoints.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill="#0B1730"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                onMouseEnter={() => setHoveredPoint(data[i] ?? null)}
                onMouseLeave={() => setHoveredPoint(null)}
                style={{ cursor: 'pointer' }}
              />
            ))}

            {/* Forecast Point & Connecting Line (Dashed Ocean Blue) */}
            {forecastIndex >= 0 &&
              forecastPoint?.predicted !== undefined &&
              forecastPoint.predicted !== null && (
                <g>
                  {observedPoints.length > 0 && (
                    <line
                      x1={observedPoints[observedPoints.length - 1]!.x}
                      y1={observedPoints[observedPoints.length - 1]!.y}
                      x2={getX(forecastIndex)}
                      y2={getY(forecastPoint.predicted)}
                      stroke="#2563EB"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  )}
                  <circle
                    cx={getX(forecastIndex)}
                    cy={getY(forecastPoint.predicted)}
                    r="6"
                    fill="#2563EB"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    onMouseEnter={() => setHoveredPoint(forecastPoint)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    style={{ cursor: 'pointer' }}
                  />
                </g>
              )}

            {/* X-axis labels */}
            {data.map((d, i) => {
              if (i % Math.ceil(data.length / 5) === 0 || i === data.length - 1) {
                return (
                  <text
                    key={i}
                    x={getX(i)}
                    y={height - 12}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#94A3B8"
                  >
                    {d.date.slice(5)}
                  </text>
                );
              }
              return null;
            })}
          </svg>

          {/* Hover Tooltip */}
          {hoveredPoint && (
            <div
              role="tooltip"
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: 'rgba(11, 23, 48, 0.95)',
                color: '#FFFFFF',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                pointerEvents: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              <div>
                <strong>Week:</strong> {hoveredPoint.date}
              </div>
              {hoveredPoint.observed !== undefined && hoveredPoint.observed !== null && (
                <div>
                  Observed: <strong>{hoveredPoint.observed} cases</strong>
                </div>
              )}
              {hoveredPoint.predicted !== undefined && hoveredPoint.predicted !== null && (
                <div style={{ color: '#38BDF8' }}>
                  Forecast: <strong>{hoveredPoint.predicted} cases</strong>
                </div>
              )}
              {hoveredPoint.threshold !== undefined && hoveredPoint.threshold !== null && (
                <div style={{ color: '#FCD34D' }}>Seasonal 75th %: {hoveredPoint.threshold}</div>
              )}
            </div>
          )}

          {/* Legend */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              justifyContent: 'center',
              marginTop: '12px',
              fontSize: '12px',
              color: 'var(--color-text-muted)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '16px',
                  height: '3px',
                  backgroundColor: '#0B1730',
                  display: 'inline-block'
                }}
              />
              Observed Cases
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '16px',
                  height: '3px',
                  borderTop: '2px dashed #2563EB',
                  display: 'inline-block'
                }}
              />
              Point Forecast ($t+1$)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '16px',
                  height: '3px',
                  borderTop: '2px dotted #D97706',
                  display: 'inline-block'
                }}
              />
              Seasonal 75th % Threshold
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '14px',
                  height: '10px',
                  backgroundColor: 'rgba(37, 99, 235, 0.25)',
                  display: 'inline-block',
                  borderRadius: '2px'
                }}
              />
              90% Conformal Interval
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
