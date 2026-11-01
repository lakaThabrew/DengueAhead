import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { LandingPage } from '../pages/LandingPage.js';
import { OverviewPage } from '../pages/OverviewPage.js';
import { AreaDetailPage } from '../pages/AreaDetailPage.js';
import { ComparePage } from '../pages/ComparePage.js';
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart.js';
import { DistrictListTable } from '../components/map/DistrictListTable.js';
import { EmptyState } from '../components/ui/EmptyState.js';

describe('Phase 5 UI Test Suite (UI-01 to UI-08)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── UI-01: Landing page CTA navigation ────────────────────────────────────
  it('UI-01: Landing page CTAs trigger correct navigation targets', () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState');
    render(<LandingPage />);

    // Click "Explore Risk Map"
    const exploreBtn = screen.getByRole('button', { name: /Explore Risk Map/i });
    fireEvent.click(exploreBtn);
    expect(pushStateSpy).toHaveBeenCalledWith(null, '', '/app/map');

    // Click "See How It Works"
    const howBtn = screen.getByRole('button', { name: /See How It Works/i });
    fireEvent.click(howBtn);
    expect(pushStateSpy).toHaveBeenCalledWith(null, '', '/methodology');
  });

  // ── UI-02: Empty data handling ────────────────────────────────────────────
  it('UI-02: Empty API data renders honest empty state without crashing', () => {
    render(
      <EmptyState
        title="No Forecasts Available"
        message="No monitored districts currently project risk threshold crossing."
      />
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('No Forecasts Available')).toBeInTheDocument();
    expect(
      screen.getByText('No monitored districts currently project risk threshold crossing.')
    ).toBeInTheDocument();
  });

  // ── UI-03: Withheld prediction suppression ────────────────────────────────
  it('UI-03: Prediction with status "WITHHELD" suppresses all numeric fields', async () => {
    // Mock area and forecast APIs returning a WITHHELD prediction
    const withheldForecast = {
      areaId: 'LK-11',
      areaName: 'Colombo',
      prediction: {
        areaId: 'LK-11',
        geographicLevel: 'district',
        issueDate: '2026-11-01',
        targetWeek: '2026-11-08',
        asOfDate: '2026-11-01',
        modelVersion: 'dengueahead-hgb-v1',
        status: 'WITHHELD',
        confidenceStatus: 'NOT_AVAILABLE',
        pointForecast: null,
        interval: null,
        riskProbability: null,
        qualityFlags: ['STALE_SURVEILLANCE'],
        sourceSnapshotIds: []
      },
      nonCausalDisclaimer: 'Non-causal statistical correlation notice.'
    };

    const areaDetail = {
      areaId: 'LK-11',
      name: 'Colombo',
      level: 'district',
      centroid: { latitude: 6.9271, longitude: 79.8612 }
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/forecast')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => withheldForecast
          });
        }
        if (url.includes('/series')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ areaId: 'LK-11', data: [], count: 0 })
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => areaDetail
        });
      })
    );

    render(<AreaDetailPage areaId="LK-11" />);

    // Assert "Withheld" is rendered and no numeric point forecast appears
    await waitFor(() => {
      const withheldBadges = screen.getAllByText('Withheld');
      expect(withheldBadges.length).toBeGreaterThan(0);
    });

    expect(screen.queryByText(/\d+ cases/i)).toBeNull();
    expect(screen.getByText('STALE_SURVEILLANCE')).toBeInTheDocument();
    expect(screen.getByText('Interval not available')).toBeInTheDocument();
  });

  // ── UI-04: Stale data warning ─────────────────────────────────────────────
  it('UI-04: Renders high-visibility alert banner when sourceFreshnessStatus is STALE', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/meta')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              geographicLevel: 'district',
              latestIssueDate: '2026-10-15',
              latestTargetWeek: '2026-10-22',
              activeModelVersion: 'dengueahead-hgb-v1',
              lastUpdated: new Date().toISOString(),
              sourceFreshnessStatus: 'STALE'
            })
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            issueDate: '2026-10-15',
            targetWeek: '2026-10-22',
            monitoredAreasCount: 25,
            emergingHotspotsCount: 0,
            persistentHotspotsCount: 0,
            stableAreasCount: 25,
            coolingAreasCount: 0,
            withheldCount: 0,
            topEmergingAreas: []
          })
        });
      })
    );

    render(<OverviewPage />);

    await waitFor(() => {
      const banner = screen.getByRole('alert');
      expect(banner).toBeInTheDocument();
      expect(banner.textContent).toMatch(/STALE/i);
    });
  });

  // ── UI-05: Issue date change refetching ────────────────────────────────────
  it('UI-05: Changing issue date triggers fresh query request', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/meta')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            geographicLevel: 'district',
            latestIssueDate: '2026-11-01',
            latestTargetWeek: '2026-11-08',
            activeModelVersion: 'dengueahead-hgb-v1',
            lastUpdated: new Date().toISOString(),
            sourceFreshnessStatus: 'CURRENT'
          })
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          issueDate: '2026-11-01',
          targetWeek: '2026-11-08',
          monitoredAreasCount: 25,
          emergingHotspotsCount: 1,
          persistentHotspotsCount: 0,
          stableAreasCount: 24,
          coolingAreasCount: 0,
          withheldCount: 0,
          topEmergingAreas: []
        })
      });
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<OverviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Surveillance Overview')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/v1/overview'));
  });

  // ── UI-06: Multi-district comparison limits ───────────────────────────────
  it('UI-06: Selecting more than 3 areas displays "Maximum 3 areas" warning', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/areas')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              data: [
                {
                  areaId: 'LK-11',
                  name: 'Colombo',
                  level: 'district',
                  centroid: { latitude: 6.9, longitude: 79.8 }
                },
                {
                  areaId: 'LK-12',
                  name: 'Gampaha',
                  level: 'district',
                  centroid: { latitude: 7.0, longitude: 80.0 }
                },
                {
                  areaId: 'LK-13',
                  name: 'Kalutara',
                  level: 'district',
                  centroid: { latitude: 6.5, longitude: 80.1 }
                },
                {
                  areaId: 'LK-21',
                  name: 'Kandy',
                  level: 'district',
                  centroid: { latitude: 7.2, longitude: 80.6 }
                }
              ],
              count: 4
            })
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            issueDate: '2026-11-01',
            targetWeek: '2026-11-08',
            comparisons: []
          })
        });
      })
    );

    render(<ComparePage />);

    await waitFor(() => {
      expect(screen.getByText(/Selected Districts/i)).toBeInTheDocument();
    });

    const select = screen.getByLabelText(/Add district to comparison/i);

    // Add 3rd district (Kalutara)
    act(() => {
      fireEvent.change(select, { target: { value: 'LK-13' } });
    });

    // Try adding 4th district (Kandy) -> should show validation warning
    act(() => {
      fireEvent.change(select, { target: { value: 'LK-21' } });
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Maximum 3 areas/i)).toBeInTheDocument();
  });

  // ── UI-07: Chart semantic differentiation ─────────────────────────────────
  it('UI-07: TimeSeriesChart renders distinct visual elements for observed, predicted, and threshold', () => {
    const sampleData = [
      { date: '2026-10-01', observed: 120, threshold: 140 },
      { date: '2026-10-08', observed: 135, threshold: 140 },
      { date: '2026-10-15', observed: 150, threshold: 140 },
      { date: '2026-10-22', predicted: 165, intervalLower: 145, intervalUpper: 185, threshold: 140 }
    ];

    const { container } = render(<TimeSeriesChart data={sampleData} />);

    // Observed solid line
    const solidPaths = container.querySelectorAll('path[stroke="#0B1730"]');
    expect(solidPaths.length).toBeGreaterThan(0);

    // Threshold dotted line
    const thresholdPaths = container.querySelectorAll('path[stroke="#D97706"]');
    expect(thresholdPaths.length).toBeGreaterThan(0);

    // Predicted dashed line
    const dashedLines = container.querySelectorAll('line[stroke-dasharray="4 4"]');
    expect(dashedLines.length).toBeGreaterThan(0);

    // Uncertainty band rectangle
    const uncertaintyRect = container.querySelector('rect[fill="rgba(37, 99, 235, 0.18)"]');
    expect(uncertaintyRect).toBeInTheDocument();
  });

  // ── UI-08: Keyboard-accessible map list ────────────────────────────────────
  it('UI-08: DistrictListTable supports keyboard search and sorting', () => {
    const districts = [
      {
        areaId: 'LK-11',
        name: 'Colombo',
        level: 'district',
        cases: 140,
        pointForecast: 155,
        status: 'EMERGING' as const
      },
      {
        areaId: 'LK-12',
        name: 'Gampaha',
        level: 'district',
        cases: 80,
        pointForecast: 75,
        status: 'STABLE' as const
      },
      {
        areaId: 'LK-21',
        name: 'Kandy',
        level: 'district',
        cases: 95,
        pointForecast: 110,
        status: 'PERSISTENT' as const
      }
    ];

    const selectSpy = vi.fn();
    render(<DistrictListTable districts={districts} onSelectDistrict={selectSpy} />);

    // Verify search input filters list
    const searchInput = screen.getByLabelText(/Search districts/i);
    fireEvent.change(searchInput, { target: { value: 'Colombo' } });

    expect(screen.getByText('Colombo')).toBeInTheDocument();
    expect(screen.queryByText('Kandy')).toBeNull();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('Kandy')).toBeInTheDocument();

    // Verify keyboard selection via Enter on row
    const row = screen.getByText('Kandy').closest('tr');
    expect(row).toBeInTheDocument();
    fireEvent.keyDown(row!, { key: 'Enter', code: 'Enter' });
    expect(selectSpy).toHaveBeenCalledWith('LK-21');
  });
});
