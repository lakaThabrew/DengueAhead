import React, { useState, useMemo } from 'react';
import type { PredictionStatus } from '@dengueahead/contracts';
import { StatusBadge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';
import { EmptyState } from '../ui/EmptyState.js';

export interface DistrictTableRow {
  areaId: string;
  name: string;
  level: string;
  cases?: number | null;
  pointForecast?: number | null;
  interval?: { lower: number; upper: number } | null;
  status: PredictionStatus;
}

interface DistrictListTableProps {
  districts: DistrictTableRow[];
  selectedAreaId?: string | null;
  onSelectDistrict?: (areaId: string) => void;
  onNavigateDetail?: (areaId: string) => void;
}

type SortField = 'name' | 'areaId' | 'cases' | 'pointForecast';
type SortDirection = 'asc' | 'desc';

export const DistrictListTable: React.FC<DistrictListTableProps> = ({
  districts,
  selectedAreaId,
  onSelectDistrict,
  onNavigateDetail
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const filteredDistricts = useMemo(() => {
    return districts
      .filter((d) => {
        const matchesQuery =
          d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.areaId.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => {
        const valA: string | number = a[sortField] ?? 0;
        const valB: string | number = b[sortField] ?? 0;

        if (typeof valA === 'string') {
          return sortDirection === 'asc'
            ? valA.localeCompare(valB as string)
            : (valB as string).localeCompare(valA);
        }

        return sortDirection === 'asc'
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      });
  }, [districts, searchQuery, statusFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        padding: '20px',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Controls Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flex: '1 1 240px' }}>
          <input
            type="search"
            aria-label="Search districts by name or ID"
            placeholder="Search districts (e.g. Colombo, LK-11)…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label
            htmlFor="status-filter"
            style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}
          >
            Filter:
          </label>
          <select
            id="status-filter"
            aria-label="Filter districts by risk status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-card)'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="EMERGING">Emerging</option>
            <option value="PERSISTENT">Persistent</option>
            <option value="COOLING">Cooling</option>
            <option value="STABLE">Stable</option>
            <option value="WITHHELD">Withheld</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filteredDistricts.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '14px'
            }}
            aria-label="Sri Lanka Districts Forecast Table"
          >
            <thead>
              <tr
                style={{
                  borderBottom: '2px solid var(--color-border)',
                  color: 'var(--color-text-muted)'
                }}
              >
                <th
                  onClick={() => handleSort('name')}
                  style={{ padding: '10px 12px', cursor: 'pointer', userSelect: 'none' }}
                >
                  District {sortField === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th
                  onClick={() => handleSort('areaId')}
                  style={{ padding: '10px 12px', cursor: 'pointer', userSelect: 'none' }}
                >
                  Area ID {sortField === 'areaId' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th style={{ padding: '10px 12px' }}>Level</th>
                <th
                  onClick={() => handleSort('cases')}
                  style={{ padding: '10px 12px', cursor: 'pointer', userSelect: 'none' }}
                >
                  Current {sortField === 'cases' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th
                  onClick={() => handleSort('pointForecast')}
                  style={{ padding: '10px 12px', cursor: 'pointer', userSelect: 'none' }}
                >
                  Forecast ($t+1$){' '}
                  {sortField === 'pointForecast' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th style={{ padding: '10px 12px' }}>90% Interval</th>
                <th style={{ padding: '10px 12px' }}>Risk Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDistricts.map((d) => {
                const isSelected = selectedAreaId === d.areaId;
                return (
                  <tr
                    key={d.areaId}
                    tabIndex={0}
                    role="row"
                    aria-selected={isSelected}
                    onClick={() => onSelectDistrict?.(d.areaId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectDistrict?.(d.areaId);
                      }
                    }}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: isSelected ? 'rgba(37,99,235,0.18)' : 'transparent',
                      borderLeft: isSelected ? '3px solid #2563EB' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.1s'
                    }}
                  >
                    <td
                      style={{ padding: '12px', fontWeight: 600, color: 'var(--color-text-main)' }}
                    >
                      {d.name}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        fontFamily: 'monospace',
                        color: 'var(--color-text-muted)'
                      }}
                    >
                      {d.areaId}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        color: 'var(--color-text-muted)',
                        textTransform: 'capitalize'
                      }}
                    >
                      {d.level}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {d.cases !== undefined && d.cases !== null ? `${d.cases}` : '—'}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>
                      {d.pointForecast !== undefined && d.pointForecast !== null
                        ? `${d.pointForecast}`
                        : d.status === 'WITHHELD'
                          ? 'Withheld'
                          : '—'}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        color: 'var(--color-text-muted)',
                        fontSize: '13px'
                      }}
                    >
                      {d.interval
                        ? `[${d.interval.lower.toFixed(0)}, ${d.interval.upper.toFixed(0)}]`
                        : 'Interval not available'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <StatusBadge status={d.status} size="sm" />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateDetail?.(d.areaId);
                        }}
                      >
                        Detail →
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No Matching Districts"
          message={`No districts match your filter "${searchQuery}". Try adjusting your search term or status filter.`}
        />
      )}
    </div>
  );
};
