import React, { useEffect, useRef, useState } from 'react';
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

interface DistrictMapProps {
  districts?: DistrictMarkerData[];
  selectedAreaId?: string | null;
  onSelectDistrict?: (areaId: string) => void;
}

// Authoritative district centre coordinates (ISO 3166-2:LK)
const DISTRICT_CENTRES: Record<
  string,
  { name: string; lat: number; lon: number; province: string }
> = {
  'LK-11': { name: 'Colombo', lat: 6.9271, lon: 79.8612, province: 'Western' },
  'LK-12': { name: 'Gampaha', lat: 7.0837, lon: 80.0144, province: 'Western' },
  'LK-13': { name: 'Kalutara', lat: 6.5854, lon: 80.1954, province: 'Western' },
  'LK-21': { name: 'Kandy', lat: 7.2906, lon: 80.6337, province: 'Central' },
  'LK-22': { name: 'Matale', lat: 7.4675, lon: 80.6234, province: 'Central' },
  'LK-23': { name: 'Nuwara Eliya', lat: 6.9497, lon: 80.7891, province: 'Central' },
  'LK-31': { name: 'Galle', lat: 6.0535, lon: 80.221, province: 'Southern' },
  'LK-32': { name: 'Matara', lat: 5.9549, lon: 80.555, province: 'Southern' },
  'LK-33': { name: 'Hambantota', lat: 6.1429, lon: 81.1212, province: 'Southern' },
  'LK-41': { name: 'Jaffna', lat: 9.6615, lon: 80.0255, province: 'Northern' },
  'LK-42': { name: 'Kilinochchi', lat: 9.3803, lon: 80.4037, province: 'Northern' },
  'LK-43': { name: 'Mannar', lat: 8.981, lon: 79.9044, province: 'Northern' },
  'LK-44': { name: 'Vavuniya', lat: 8.7514, lon: 80.4979, province: 'Northern' },
  'LK-45': { name: 'Mullaitivu', lat: 9.2671, lon: 80.8122, province: 'Northern' },
  'LK-51': { name: 'Batticaloa', lat: 7.717, lon: 81.7003, province: 'Eastern' },
  'LK-52': { name: 'Ampara', lat: 7.2964, lon: 81.6747, province: 'Eastern' },
  'LK-53': { name: 'Trincomalee', lat: 8.5874, lon: 81.2152, province: 'Eastern' },
  'LK-61': { name: 'Kurunegala', lat: 7.4867, lon: 80.3647, province: 'North Western' },
  'LK-62': { name: 'Puttalam', lat: 8.0362, lon: 79.8283, province: 'North Western' },
  'LK-71': { name: 'Anuradhapura', lat: 8.3114, lon: 80.4037, province: 'North Central' },
  'LK-72': { name: 'Polonnaruwa', lat: 7.9403, lon: 81.0188, province: 'North Central' },
  'LK-81': { name: 'Badulla', lat: 6.9934, lon: 81.055, province: 'Uva' },
  'LK-82': { name: 'Monaragala', lat: 6.8728, lon: 81.3507, province: 'Uva' },
  'LK-91': { name: 'Ratnapura', lat: 6.6828, lon: 80.3992, province: 'Sabaragamuwa' },
  'LK-92': { name: 'Kegalle', lat: 7.2513, lon: 80.3464, province: 'Sabaragamuwa' }
};

const STATUS_COLORS: Record<string, string> = {
  EMERGING: '#F59E0B',
  PERSISTENT: '#F43F5E',
  COOLING: '#06B6D4',
  STABLE: '#10B981',
  WITHHELD: '#94A3B8'
};

function getStatusColor(status?: PredictionStatus): string {
  return STATUS_COLORS[status ?? ''] ?? '#64748B';
}

function getStatusLabel(status?: PredictionStatus): string {
  const labels: Record<string, string> = {
    EMERGING: 'Emerging Hotspot',
    PERSISTENT: 'Persistent High',
    COOLING: 'Cooling Trend',
    STABLE: 'Stable Baseline',
    WITHHELD: 'Withheld'
  };
  return labels[status ?? ''] ?? '—';
}

interface HoverInfo {
  areaId: string;
  name: string;
  province: string;
  status?: PredictionStatus;
  pointForecast?: number | null;
}

// Build a DivIcon HTML string for a district pin
function pinHtml(name: string, color: string, selected: boolean): string {
  const dotSize = selected ? 14 : 10;
  const ring = selected
    ? `<div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid ${color};opacity:0.5;"></div>`
    : '';
  return `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
      <div style="
        width:${dotSize}px;height:${dotSize}px;border-radius:50%;
        background:${color};border:2px solid #ffffff;
        box-shadow:0 0 ${selected ? 10 : 5}px ${color};
        position:relative;
      ">${ring}</div>
      <div style="
        margin-top:3px;
        background:rgba(7,13,30,0.85);
        color:#F8FAFC;
        font-size:9px;font-weight:${selected ? 700 : 500};
        padding:1px 5px;border-radius:3px;
        white-space:nowrap;pointer-events:none;
        border:1px solid rgba(255,255,255,0.08);
      ">${name}</div>
    </div>`;
}

export const DistrictMap: React.FC<DistrictMapProps> = ({
  districts = [],
  selectedAreaId,
  onSelectDistrict
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);

  // ── Init map once on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    import('leaflet').then((L) => {
      if (mapRef.current || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [7.87, 80.77] as [number, number],
        zoom: 7,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      mapRef.current = map;
      setLeafletReady(true);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Place / refresh markers whenever map is ready or data/selection changes ─
  useEffect(() => {
    if (!leafletReady || !mapRef.current) return;

    import('leaflet').then((L) => {
      // Remove all existing markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const districtMap = new Map(districts.map((d) => [d.areaId, d]));

      Object.entries(DISTRICT_CENTRES).forEach(([areaId, centre]) => {
        const d = districtMap.get(areaId);
        const color = getStatusColor(d?.status);
        const isSelected = areaId === selectedAreaId;

        const icon = L.divIcon({
          html: pinHtml(centre.name, color, isSelected),
          className: '', // clear leaflet's default white box
          iconSize: [0, 0], // positioned by the HTML itself
          iconAnchor: [7, 7] // anchor at dot centre
        });

        const marker = L.marker([centre.lat, centre.lon], {
          icon,
          title: centre.name,
          // @ts-expect-error – custom property for bookkeeping
          areaId
        });

        marker.on('mouseover', () => {
          setHoverInfo({
            areaId,
            name: centre.name,
            province: centre.province,
            status: d?.status,
            pointForecast: d?.pointForecast
          });
        });

        marker.on('mouseout', () => {
          setHoverInfo(null);
        });

        marker.on('click', () => {
          onSelectDistrict?.(areaId);
        });

        marker.addTo(mapRef.current);
        markersRef.current.push(marker);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady, districts, selectedAreaId]);

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid #1E293B',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: '12px 18px',
          backgroundColor: '#0B1329',
          borderBottom: '1px solid #1E293B',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>
            Sri Lanka — District Map
          </h3>
          <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>
            25 districts · hover for details · click to select
          </p>
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: '#38BDF8',
            backgroundColor: 'rgba(56,189,248,0.1)',
            border: '1px solid rgba(56,189,248,0.25)',
            borderRadius: '9999px',
            padding: '3px 10px'
          }}
        >
          LIVE
        </span>
      </div>

      {/* ── Leaflet map ── */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '480px' }} />

      {/* ── Hover Detail Card ── */}
      {hoverInfo && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: '52px',
            left: '12px',
            right: '12px',
            backgroundColor: 'rgba(7,13,30,0.96)',
            backdropFilter: 'blur(12px)',
            border: '1px solid #1E293B',
            borderRadius: '12px',
            padding: '14px 18px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          {/* Left: name + province + status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                flexShrink: 0,
                backgroundColor: getStatusColor(hoverInfo.status),
                boxShadow: `0 0 8px ${getStatusColor(hoverInfo.status)}`
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#F8FAFC',
                  whiteSpace: 'nowrap'
                }}
              >
                {hoverInfo.name}
                <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px' }}>
                  {hoverInfo.areaId}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                {hoverInfo.province} Province
                {hoverInfo.status && (
                  <span
                    style={{
                      color: getStatusColor(hoverInfo.status),
                      fontWeight: 700,
                      marginLeft: '8px'
                    }}
                  >
                    · {getStatusLabel(hoverInfo.status)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: forecast */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {hoverInfo.pointForecast != null ? (
              <>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: '#38BDF8',
                    fontFamily: 'monospace',
                    lineHeight: 1
                  }}
                >
                  {hoverInfo.pointForecast}
                </div>
                <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
                  cases (t+1)
                </div>
              </>
            ) : (
              <span style={{ fontSize: '11px', color: '#475569' }}>No forecast data</span>
            )}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div
        style={{
          padding: '8px 18px',
          backgroundColor: '#0B1329',
          borderTop: '1px solid #1E293B',
          fontSize: '11px',
          color: '#475569',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>Hover a pin to preview · Click to select district</span>
        <span style={{ color: '#334155' }}>© OpenStreetMap</span>
      </div>
    </div>
  );
};
