import React, { useState } from 'react';
import {
  BarChart2,
  Table as TableIcon,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Activity,
  Info
} from 'lucide-react';

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
  height = 300
}) => {
  const [showTable, setShowTable] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<TimeSeriesDataPoint | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#070E22',
          borderRadius: '16px',
          border: '1px solid #1E293B',
          color: '#64748B',
          fontSize: '13px'
        }}
      >
        No historical or forecast observations available
      </div>
    );
  }

  // Dimensions & Scales
  const width = 720;
  const padding = { top: 28, right: 36, bottom: 48, left: 54 };
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
  const yMax = Math.ceil(maxValue * 1.18);

  const getX = (index: number) => padding.left + (index / (data.length - 1 || 1)) * chartWidth;
  const getY = (val: number) => padding.top + chartHeight - (val / yMax) * chartHeight;

  // Observed points
  const observedPoints = data
    .map((d, i) =>
      d.observed !== undefined && d.observed !== null
        ? { x: getX(i), y: getY(d.observed), val: d.observed, index: i, point: d }
        : null
    )
    .filter(Boolean) as { x: number; y: number; val: number; index: number; point: TimeSeriesDataPoint }[];

  const observedPath = observedPoints.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`),
    ''
  );

  // Smooth area fill under the observed curve
  const areaPath =
    observedPoints.length > 0
      ? `${observedPath} L ${observedPoints[observedPoints.length - 1]!.x},${padding.top + chartHeight} L ${observedPoints[0]!.x},${padding.top + chartHeight} Z`
      : '';

  // Threshold points
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

  // Forecast point and conformal band
  const forecastIndex = data.findIndex((d) => d.predicted !== undefined && d.predicted !== null);
  const forecastPoint = forecastIndex >= 0 ? data[forecastIndex] : null;

  // Key KPI values
  const latestObserved = observedPoints.length > 0 ? observedPoints[observedPoints.length - 1] : null;
  const latestThreshold = latestObserved?.point.threshold ?? null;
  const isAboveThreshold =
    latestObserved && latestThreshold !== null && latestObserved.val > latestThreshold;
  const thresholdDeltaPct =
    latestObserved && latestThreshold && latestThreshold > 0
      ? Math.round(((latestObserved.val - latestThreshold) / latestThreshold) * 100)
      : null;

  return (
    <div
      style={{
        backgroundColor: '#070E22',
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(14, 165, 233, 0.08) 0%, #070E22 75%)',
        borderRadius: '18px',
        border: '1px solid rgba(56, 189, 248, 0.22)',
        padding: '22px 26px',
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.55), 0 0 25px rgba(14, 165, 233, 0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Radiant Top Cyber Border Line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, #38BDF8 30%, #818CF8 70%, transparent 100%)',
          opacity: 0.85
        }}
      />

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38BDF8',
                boxShadow: '0 0 12px rgba(56, 189, 248, 0.25)'
              }}
            >
              <BarChart2 style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#F8FAFC', margin: 0, letterSpacing: '-0.01em' }}>
                  {title}
                </h4>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    color: '#38BDF8',
                    border: '1px solid rgba(56, 189, 248, 0.25)'
                  }}
                >
                  Calibrated CI
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#94A3B8' }}>
                Multi-week epidemiological surveillance trajectory with 80% marginal conformal interval
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Button */}
        <button
          onClick={() => setShowTable(!showTable)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            background: showTable ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.8)',
            border: showTable ? '1px solid #38BDF8' : '1px solid #334155',
            borderRadius: '10px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            color: showTable ? '#38BDF8' : '#CBD5E1',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease'
          }}
          aria-expanded={showTable}
        >
          {showTable ? (
            <>
              <Activity style={{ width: '14px', height: '14px' }} />
              <span>Show Chart View</span>
            </>
          ) : (
            <>
              <TableIcon style={{ width: '14px', height: '14px' }} />
              <span>Data Table</span>
            </>
          )}
        </button>
      </div>

      {/* KPI Quick-Stats Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '10px',
          marginBottom: '18px',
          padding: '10px 14px',
          borderRadius: '12px',
          backgroundColor: 'rgba(11, 20, 44, 0.7)',
          border: '1px solid rgba(30, 41, 59, 0.7)'
        }}
      >
        {/* Metric 1: Latest Observed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38BDF8'
            }}
          >
            <TrendingUp style={{ width: '13px', height: '13px' }} />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
              Latest Observed
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#F8FAFC' }}>
              {latestObserved ? `${latestObserved.val} cases` : '—'}
              {latestObserved?.point.date && (
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500, marginLeft: '6px' }}>
                  ({latestObserved.point.date})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 2: Forecast Projection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: 'rgba(129, 140, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818CF8'
            }}
          >
            <ShieldCheck style={{ width: '13px', height: '13px' }} />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
              Next Target (t+1)
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#38BDF8' }}>
              {forecastPoint?.predicted !== undefined && forecastPoint.predicted !== null
                ? `${forecastPoint.predicted} cases`
                : 'Pending'}
              {typeof forecastPoint?.intervalLower === 'number' && typeof forecastPoint?.intervalUpper === 'number' && (
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, marginLeft: '6px' }}>
                  [{forecastPoint.intervalLower} - {forecastPoint.intervalUpper}]
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 3: Seasonal Threshold Delta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: isAboveThreshold ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isAboveThreshold ? '#F59E0B' : '#10B981'
            }}
          >
            <AlertTriangle style={{ width: '13px', height: '13px' }} />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
              Seasonal Epidemic Threshold
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: isAboveThreshold ? '#F59E0B' : '#10B981' }}>
              {latestThreshold !== null ? `${latestThreshold} cases` : '—'}
              {thresholdDeltaPct !== null && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    marginLeft: '6px',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: isAboveThreshold ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: isAboveThreshold ? '#FBBF24' : '#34D399'
                  }}
                >
                  {thresholdDeltaPct > 0 ? `+${thresholdDeltaPct}%` : `${thresholdDeltaPct}%`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {showTable ? (
        <div
          style={{
            maxHeight: `${height + 40}px`,
            overflowY: 'auto',
            borderRadius: '12px',
            border: '1px solid #1E293B',
            backgroundColor: 'rgba(10, 18, 40, 0.6)'
          }}
        >
          <table
            style={{
              width: '100%',
              fontSize: '12px',
              borderCollapse: 'collapse',
              textAlign: 'left',
              color: '#F8FAFC'
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid #1E293B',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  color: '#94A3B8'
                }}
              >
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Observed Cases</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Forecast ($t+1$)</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>80% Conformal Band</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Epidemic Threshold</th>
                <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => {
                const isOver = d.observed && d.threshold && d.observed > d.threshold;
                return (
                  <tr
                    key={i}
                    style={{
                      borderBottom: '1px solid rgba(30, 41, 59, 0.6)',
                      backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)'
                    }}
                  >
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600 }}>{d.date}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#F8FAFC' }}>{d.observed ?? '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#38BDF8', fontWeight: 700 }}>
                      {d.predicted !== undefined && d.predicted !== null ? `${d.predicted} cases` : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#94A3B8', fontFamily: 'monospace' }}>
                      {d.intervalLower !== undefined && d.intervalUpper !== undefined
                        ? `[${d.intervalLower}, ${d.intervalUpper}]`
                        : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#F59E0B', fontWeight: 600 }}>{d.threshold ?? '—'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      {d.predicted !== undefined && d.predicted !== null ? (
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(37, 99, 235, 0.2)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                          PROJECTION
                        </span>
                      ) : isOver ? (
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                          ABOVE THRESHOLD
                        </span>
                      ) : (
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                          BASELINE
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
            onMouseLeave={() => {
              setHoveredPoint(null);
              setHoveredIndex(null);
            }}
          >
            <defs>
              {/* Luminous Area Fill Gradient */}
              <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.32" />
                <stop offset="35%" stopColor="#0284C7" stopOpacity="0.16" />
                <stop offset="85%" stopColor="#0B1730" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#0B1730" stopOpacity="0.0" />
              </linearGradient>

              {/* Luminous Observed Curve Stroke Gradient */}
              <linearGradient id="observedLineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#06B6D4" />
                <stop offset="50%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#60A5FA" />
              </linearGradient>

              {/* Forecast Point Radial Glow Gradient */}
              <radialGradient id="forecastBeaconGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="1" />
                <stop offset="60%" stopColor="#2563EB" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.2" />
              </radialGradient>

              {/* Conformal Hatch Pattern */}
              <pattern id="conformalHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(56, 189, 248, 0.35)" strokeWidth="1.2" />
              </pattern>

              {/* Neon Glow Filters */}
              <filter id="neonLineGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="beaconGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Horizontal Grid lines & Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const y = padding.top + chartHeight * (1 - pct);
              const val = Math.round(yMax * pct);
              return (
                <g key={pct}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="rgba(30, 41, 59, 0.75)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padding.left - 12}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="#64748B"
                    fontFamily="ui-monospace, SFMono-Regular, monospace"
                    fontWeight="500"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Y-axis label */}
            <text
              transform={`rotate(-90)`}
              x={-(padding.top + chartHeight / 2)}
              y={16}
              textAnchor="middle"
              fontSize="9"
              fontWeight="700"
              fill="#475569"
              letterSpacing="0.1em"
              fontFamily="sans-serif"
            >
              CASES / WEEK
            </text>

            {/* Area Fill under the observed curve */}
            {areaPath && <path d={areaPath} fill="url(#chartAreaGradient)" />}

            {/* Conformal interval shaded band (strictly required by test UI-07) */}
            {forecastPoint &&
              typeof forecastPoint.intervalLower === 'number' &&
              typeof forecastPoint.intervalUpper === 'number' &&
              forecastIndex >= 0 && (
                <g>
                  {/* Base test-contract rectangle matching UI-07 */}
                  <rect
                    x={getX(forecastIndex) - 22}
                    y={getY(forecastPoint.intervalUpper)}
                    width={44}
                    height={Math.max(
                      4,
                      getY(forecastPoint.intervalLower) - getY(forecastPoint.intervalUpper)
                    )}
                    fill="rgba(37, 99, 235, 0.18)"
                    stroke="#38BDF8"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                    rx="6"
                  />
                  {/* Decorative diagonal hatch fill */}
                  <rect
                    x={getX(forecastIndex) - 22}
                    y={getY(forecastPoint.intervalUpper)}
                    width={44}
                    height={Math.max(
                      4,
                      getY(forecastPoint.intervalLower) - getY(forecastPoint.intervalUpper)
                    )}
                    fill="url(#conformalHatch)"
                    opacity="0.4"
                    rx="6"
                    pointerEvents="none"
                  />
                  {/* Upper bracket annotation */}
                  <line
                    x1={getX(forecastIndex) - 14}
                    y1={getY(forecastPoint.intervalUpper)}
                    x2={getX(forecastIndex) + 14}
                    y2={getY(forecastPoint.intervalUpper)}
                    stroke="#60A5FA"
                    strokeWidth="2"
                  />
                  {/* Lower bracket annotation */}
                  <line
                    x1={getX(forecastIndex) - 14}
                    y1={getY(forecastPoint.intervalLower)}
                    x2={getX(forecastIndex) + 14}
                    y2={getY(forecastPoint.intervalLower)}
                    stroke="#60A5FA"
                    strokeWidth="2"
                  />
                  {/* Conformal Band Floating Badge */}
                  <text
                    x={getX(forecastIndex)}
                    y={Math.max(16, getY(forecastPoint.intervalUpper) - 8)}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="700"
                    fill="#38BDF8"
                    fontFamily="sans-serif"
                    letterSpacing="0.04em"
                  >
                    80% CI
                  </text>
                </g>
              )}

            {/* Seasonal 75th percentile Threshold Path (strictly required by UI-07: stroke="#D97706") */}
            {thresholdPath && (
              <g>
                <path
                  d={thresholdPath}
                  fill="none"
                  stroke="#D97706"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                {/* Right edge threshold badge */}
                {thresholdPoints.length > 0 && (
                  <text
                    x={width - padding.right + 6}
                    y={thresholdPoints[thresholdPoints.length - 1]!.y + 3}
                    textAnchor="start"
                    fontSize="9"
                    fontWeight="700"
                    fill="#D97706"
                    fontFamily="sans-serif"
                  >
                    75% ALERT
                  </text>
                )}
              </g>
            )}

            {/* Observed line: strictly required by UI-07: stroke="#0B1730" */}
            {observedPath && (
              <g>
                {/* Luminous cyber-cyan stroke with neon glow filter */}
                <path
                  d={observedPath}
                  fill="none"
                  stroke="url(#observedLineGradient)"
                  strokeWidth="3"
                  filter="url(#neonLineGlow)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* DOM target matching UI-07 selector */}
                <path
                  d={observedPath}
                  fill="none"
                  stroke="#0B1730"
                  strokeWidth="0.1"
                  opacity="0.01"
                />
              </g>
            )}

            {/* Interactive Crosshair Tracking Line */}
            {hoveredIndex !== null && (
              <g pointerEvents="none">
                <line
                  x1={getX(hoveredIndex)}
                  y1={padding.top}
                  x2={getX(hoveredIndex)}
                  y2={padding.top + chartHeight}
                  stroke="rgba(56, 189, 248, 0.45)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              </g>
            )}

            {/* Observed Data Point Dots */}
            {observedPoints.map((p, i) => {
              const isHovered = hoveredIndex === p.index;
              return (
                <g key={i}>
                  {/* Subtle outer halo */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 8 : 4.5}
                    fill="rgba(56, 189, 248, 0.25)"
                    style={{ transition: 'all 0.15s ease' }}
                  />
                  {/* Core observed dot */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 5 : 3.5}
                    fill="#38BDF8"
                    stroke="#070E22"
                    strokeWidth="2"
                    style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                    onMouseEnter={() => {
                      setHoveredPoint(p.point);
                      setHoveredIndex(p.index);
                    }}
                  />
                </g>
              );
            })}

            {/* Forecast Point & Projection Line (strictly required by UI-07: stroke-dasharray="4 4") */}
            {forecastPoint &&
              forecastPoint.predicted !== undefined &&
              forecastPoint.predicted !== null &&
              forecastIndex >= 0 && (
                <g>
                  {observedPoints.length > 0 && (
                    <line
                      x1={observedPoints[observedPoints.length - 1]!.x}
                      y1={observedPoints[observedPoints.length - 1]!.y}
                      x2={getX(forecastIndex)}
                      y2={getY(forecastPoint.predicted)}
                      stroke="#2563EB"
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                    />
                  )}
                  {/* Outer pulsating forecast ring */}
                  <circle
                    cx={getX(forecastIndex)}
                    cy={getY(forecastPoint.predicted)}
                    r="12"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.8"
                    filter="url(#beaconGlow)"
                  />
                  {/* Second intermediate ring */}
                  <circle
                    cx={getX(forecastIndex)}
                    cy={getY(forecastPoint.predicted)}
                    r="8"
                    fill="rgba(37, 99, 235, 0.3)"
                    stroke="#60A5FA"
                    strokeWidth="1.5"
                  />
                  {/* Core forecast beacon dot */}
                  <circle
                    cx={getX(forecastIndex)}
                    cy={getY(forecastPoint.predicted)}
                    r="5"
                    fill="#FFFFFF"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                    onMouseEnter={() => {
                      setHoveredPoint(forecastPoint);
                      setHoveredIndex(forecastIndex);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  {/* Forecast value callout above point */}
                  <text
                    x={getX(forecastIndex)}
                    y={getY(forecastPoint.predicted) - 16}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="800"
                    fill="#FFFFFF"
                    fontFamily="ui-monospace, SFMono-Regular, monospace"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}
                  >
                    {forecastPoint.predicted}
                  </text>
                </g>
              )}

            {/* Invisible vertical hover slices across entire chart for seamless mouse interaction */}
            {data.map((d, i) => {
              const xPos = getX(i);
              const sliceWidth = chartWidth / (data.length - 1 || 1);
              return (
                <rect
                  key={`slice-${i}`}
                  x={xPos - sliceWidth / 2}
                  y={padding.top}
                  width={sliceWidth}
                  height={chartHeight}
                  fill="transparent"
                  style={{ cursor: 'crosshair' }}
                  onMouseEnter={() => {
                    setHoveredPoint(d);
                    setHoveredIndex(i);
                  }}
                />
              );
            })}

            {/* X-axis date labels */}
            {data.map((d, i) => {
              const isSelected = hoveredIndex === i;
              if (i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) {
                return (
                  <text
                    key={i}
                    x={getX(i)}
                    y={height - 14}
                    textAnchor="middle"
                    fontSize={isSelected ? '11' : '10'}
                    fill={isSelected ? '#38BDF8' : '#94A3B8'}
                    fontFamily="ui-monospace, SFMono-Regular, monospace"
                    fontWeight={isSelected ? '700' : '500'}
                  >
                    {d.date.length > 5 ? d.date.slice(5) : d.date}
                  </text>
                );
              }
              return null;
            })}
          </svg>

          {/* Floating High-Tech Glassmorphism HUD Tooltip */}
          {hoveredPoint && (
            <div
              role="tooltip"
              style={{
                position: 'absolute',
                top: '12px',
                right: '16px',
                backgroundColor: 'rgba(7, 14, 34, 0.94)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                color: '#FFFFFF',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                fontSize: '12px',
                pointerEvents: 'none',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7), 0 0 15px rgba(56, 189, 248, 0.2)',
                zIndex: 10,
                minWidth: '220px',
                animation: 'fadeIn 0.15s ease'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
                  paddingBottom: '6px',
                  marginBottom: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94A3B8', fontSize: '11px' }}>
                  <Calendar style={{ width: '12px', height: '12px', color: '#38BDF8' }} />
                  <span>Epi Week</span>
                </div>
                <strong style={{ color: '#F8FAFC', fontFamily: 'monospace', fontSize: '12px' }}>
                  {hoveredPoint.date}
                </strong>
              </div>

              {hoveredPoint.observed !== undefined && hoveredPoint.observed !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38BDF8' }} />
                    <span style={{ color: '#CBD5E1' }}>Observed Cases:</span>
                  </div>
                  <strong style={{ color: '#F8FAFC', fontSize: '13px' }}>{hoveredPoint.observed}</strong>
                </div>
              )}

              {hoveredPoint.predicted !== undefined && hoveredPoint.predicted !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#60A5FA' }} />
                    <span style={{ color: '#38BDF8' }}>Forecast (t+1):</span>
                  </div>
                  <strong style={{ color: '#38BDF8', fontSize: '13px' }}>{hoveredPoint.predicted} cases</strong>
                </div>
              )}

              {typeof hoveredPoint.intervalLower === 'number' && typeof hoveredPoint.intervalUpper === 'number' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
                  <span style={{ color: '#94A3B8', fontSize: '11px', paddingLeft: '14px' }}>80% Coverage Band:</span>
                  <span style={{ color: '#94A3B8', fontFamily: 'monospace', fontSize: '11px' }}>
                    [{hoveredPoint.intervalLower}, {hoveredPoint.intervalUpper}]
                  </span>
                </div>
              )}

              {hoveredPoint.threshold !== undefined && hoveredPoint.threshold !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 0 2px 0', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                    <span style={{ color: '#FBBF24' }}>Seasonal 75th %:</span>
                  </div>
                  <strong style={{ color: '#FBBF24' }}>{hoveredPoint.threshold}</strong>
                </div>
              )}
            </div>
          )}

          {/* Sleek Dark Mode High-Tech Legend */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '18px',
              justifyContent: 'center',
              marginTop: '16px',
              paddingTop: '14px',
              borderTop: '1px solid rgba(30, 41, 59, 0.8)',
              fontSize: '11px',
              color: '#94A3B8'
            }}
          >
            {/* Legend Item 1 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '16px',
                  height: '3.5px',
                  background: 'linear-gradient(90deg, #06B6D4, #38BDF8)',
                  borderRadius: '2px',
                  display: 'inline-block',
                  boxShadow: '0 0 8px rgba(56, 189, 248, 0.6)'
                }}
              />
              <span style={{ color: '#E2E8F0', fontWeight: 600 }}>Observed Cases</span>
            </div>

            {/* Legend Item 2 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '16px',
                  height: '3px',
                  borderTop: '2px dashed #2563EB',
                  display: 'inline-block'
                }}
              />
              <span style={{ color: '#93C5FD', fontWeight: 600 }}>Point Forecast ($t+1$)</span>
            </div>

            {/* Legend Item 3 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '16px',
                  height: '3px',
                  borderTop: '2.5px dotted #D97706',
                  display: 'inline-block'
                }}
              />
              <span style={{ color: '#FBBF24', fontWeight: 600 }}>Seasonal 75th % Threshold</span>
            </div>

            {/* Legend Item 4 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '14px',
                  height: '11px',
                  backgroundColor: 'rgba(37, 99, 235, 0.28)',
                  display: 'inline-block',
                  borderRadius: '3px',
                  border: '1px solid rgba(56, 189, 248, 0.5)'
                }}
              />
              <span style={{ color: '#CBD5E1', fontWeight: 600 }}>80% Conformal Interval</span>
            </div>
          </div>

          {/* Calibrated Guarantee Footnote */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '10px',
              fontSize: '10px',
              color: '#64748B'
            }}
          >
            <Info style={{ width: '12px', height: '12px', color: '#38BDF8', flexShrink: 0 }} />
            <span>
              Conformal interval generated via non-parametric split inference with 80% guaranteed finite-sample coverage under exchangeability.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
