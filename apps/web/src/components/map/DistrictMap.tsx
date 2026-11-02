import React, { useState } from 'react';
import type { PredictionStatus } from '@dengueahead/contracts';

export interface DistrictMarkerData {
  areaId: string;
  name: string;
  lat: number;
  lon: number;
  status?: PredictionStatus;
  pointForecast?: number | null;
  cases?: number | null;
}

const DISTRICT_COORDS: Record<string, { lat: number; lon: number; name: string }> = {
  'LK-11': { name: 'Colombo', lat: 6.9271, lon: 79.8612 },
  'LK-12': { name: 'Gampaha', lat: 7.0837, lon: 80.0144 },
  'LK-13': { name: 'Kalutara', lat: 6.5854, lon: 80.1954 },
  'LK-21': { name: 'Kandy', lat: 7.2906, lon: 80.6337 },
  'LK-22': { name: 'Matale', lat: 7.4675, lon: 80.6234 },
  'LK-23': { name: 'Nuwara Eliya', lat: 6.9497, lon: 80.7891 },
  'LK-31': { name: 'Galle', lat: 6.0535, lon: 80.221 },
  'LK-32': { name: 'Matara', lat: 5.9549, lon: 80.555 },
  'LK-33': { name: 'Hambantota', lat: 6.1429, lon: 81.1212 },
  'LK-41': { name: 'Jaffna', lat: 9.6615, lon: 80.0255 },
  'LK-42': { name: 'Kilinochchi', lat: 9.3803, lon: 80.4037 },
  'LK-43': { name: 'Mannar', lat: 8.981, lon: 79.9044 },
  'LK-44': { name: 'Vavuniya', lat: 8.7514, lon: 80.4979 },
  'LK-45': { name: 'Mullaitivu', lat: 9.2671, lon: 80.8122 },
  'LK-51': { name: 'Batticaloa', lat: 7.717, lon: 81.7003 },
  'LK-52': { name: 'Ampara', lat: 7.2964, lon: 81.6747 },
  'LK-53': { name: 'Trincomalee', lat: 8.5874, lon: 81.2152 },
  'LK-61': { name: 'Kurunegala', lat: 7.4867, lon: 80.3647 },
  'LK-62': { name: 'Puttalam', lat: 8.0362, lon: 79.8283 },
  'LK-71': { name: 'Anuradhapura', lat: 8.3114, lon: 80.4037 },
  'LK-72': { name: 'Polonnaruwa', lat: 7.9403, lon: 81.0188 },
  'LK-81': { name: 'Badulla', lat: 6.9934, lon: 81.055 },
  'LK-82': { name: 'Monaragala', lat: 6.8728, lon: 81.3507 },
  'LK-91': { name: 'Ratnapura', lat: 6.6828, lon: 80.3992 },
  'LK-92': { name: 'Kegalle', lat: 7.2513, lon: 80.3464 }
};

interface DistrictMapProps {
  districts?: DistrictMarkerData[];
  selectedAreaId?: string | null;
  onSelectDistrict?: (areaId: string) => void;
}

export const DistrictMap: React.FC<DistrictMapProps> = ({
  districts = [],
  selectedAreaId,
  onSelectDistrict
}) => {
  const [hoveredArea, setHoveredArea] = useState<DistrictMarkerData | null>(null);

  // Coordinate projection helper
  // Latitude: 5.8 -> 10.0; Longitude: 79.5 -> 82.0
  const project = (lat: number, lon: number) => {
    const x = ((lon - 79.4) / 2.6) * 320 + 30;
    const y = ((10.0 - lat) / 4.2) * 440 + 20;
    return { x, y };
  };

  const getStatusColor = (status?: PredictionStatus) => {
    switch (status) {
      case 'EMERGING':
        return '#D97706';
      case 'PERSISTENT':
        return '#DC4754';
      case 'COOLING':
        return '#0284C7';
      case 'STABLE':
        return '#0D9488';
      case 'WITHHELD':
        return '#64748B';
      default:
        return '#2563EB';
    }
  };

  // Merge default list with incoming data
  const districtList: DistrictMarkerData[] = Object.entries(DISTRICT_COORDS).map(([id, info]) => {
    const matched = districts.find((d) => d.areaId === id);
    return {
      areaId: id,
      name: info.name,
      lat: info.lat,
      lon: info.lon,
      status: matched?.status ?? 'STABLE',
      pointForecast: matched?.pointForecast,
      cases: matched?.cases
    };
  });

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        padding: '20px',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div style={{ alignSelf: 'flex-start', marginBottom: '8px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-navy)', margin: 0 }}>
          Sri Lanka District Centroids
        </h3>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          Click any marker to inspect district forecast
        </span>
      </div>

      <svg
        viewBox="0 0 380 480"
        style={{ width: '100%', maxWidth: '360px', height: 'auto', maxHeight: '460px' }}
        role="img"
        aria-label="Map of Sri Lanka districts"
      >
        {/* Simplified island outline silhouette */}
        <path
          d="M 120,40 Q 150,30 180,60 Q 220,120 260,200 Q 290,280 270,360 Q 240,430 190,440 Q 140,450 110,400 Q 80,320 80,240 Q 90,140 120,40 Z"
          fill="#F1F5F9"
          stroke="#CBD5E1"
          strokeWidth="1.5"
        />

        {/* District Markers */}
        {districtList.map((d) => {
          const { x, y } = project(d.lat, d.lon);
          const isSelected = selectedAreaId === d.areaId;
          const color = getStatusColor(d.status);

          return (
            <g
              key={d.areaId}
              cursor="pointer"
              tabIndex={0}
              role="button"
              aria-label={`${d.name} (${d.areaId}): ${d.status ?? 'STABLE'}`}
              onClick={() => onSelectDistrict?.(d.areaId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectDistrict?.(d.areaId);
                }
              }}
              onMouseEnter={() => setHoveredArea(d)}
              onMouseLeave={() => setHoveredArea(null)}
              onFocus={() => setHoveredArea(d)}
              onBlur={() => setHoveredArea(null)}
            >
              {isSelected && (
                <circle
                  cx={x}
                  cy={y}
                  r="14"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2"
                  strokeDasharray="3,3"
                />
              )}
              <circle
                cx={x}
                cy={y}
                r={isSelected ? 8 : 6}
                fill={color}
                stroke="#FFFFFF"
                strokeWidth="2"
                style={{ transition: 'all 0.15s ease' }}
              />
              <text
                x={x}
                y={y - 8}
                textAnchor="middle"
                fontSize="9"
                fontWeight={isSelected ? 700 : 500}
                fill="#334155"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {d.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredArea && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '20px',
            right: '20px',
            backgroundColor: '#0B1730',
            color: '#FFFFFF',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
            zIndex: 10
          }}
        >
          <div>
            <strong>{hoveredArea.name}</strong> ({hoveredArea.areaId})
            <div style={{ color: '#94A3B8', fontSize: '11px' }}>
              Status:{' '}
              <span style={{ color: getStatusColor(hoveredArea.status), fontWeight: 700 }}>
                {hoveredArea.status}
              </span>
            </div>
          </div>
          {hoveredArea.pointForecast !== undefined && hoveredArea.pointForecast !== null && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#38BDF8' }}>
                {hoveredArea.pointForecast} cases
              </div>
              <div style={{ color: '#94A3B8', fontSize: '10px' }}>forecast $t+1$</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
