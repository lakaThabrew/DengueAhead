import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from '../App.js';
import { HealthBadge } from '../features/health/HealthBadge.js';

// ── App shell tests ───────────────────────────────────────────────────────────

describe('App Component', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          status: 'ok',
          apiVersion: '1.0.0',
          service: 'dengueahead-api',
          timestamp: new Date().toISOString()
        })
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders DengueAhead header and non-clinical banner', async () => {
    render(<App />);
    // Wait for HealthBadge async state to settle before asserting
    await waitFor(() => expect(screen.queryByText('Checking…')).toBeNull());
    const brandingElements = screen.getAllByText(/DengueAhead/i);
    expect(brandingElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/Non-clinical decision-support system/i)).toBeInTheDocument();
  });

  it('renders a skip link for keyboard navigation', async () => {
    render(<App />);
    await waitFor(() => expect(screen.queryByText('Checking…')).toBeNull());
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });

  it('displays the 4 architectural pillars', async () => {
    render(<App />);
    await waitFor(() => expect(screen.queryByText('Checking…')).toBeNull());
    expect(screen.getByText('@dengueahead/contracts')).toBeInTheDocument();
    expect(screen.getByText('@dengueahead/api')).toBeInTheDocument();
    expect(screen.getByText('@dengueahead/web')).toBeInTheDocument();
    expect(screen.getByText('services/ml')).toBeInTheDocument();
  });

  it('displays no numeric metrics or case numbers', async () => {
    render(<App />);
    await waitFor(() => expect(screen.queryByText('Checking…')).toBeNull());
    expect(screen.queryByText(/\d+ cases/i)).toBeNull();
    expect(screen.queryByText(/forecast:/i)).toBeNull();
  });
});

// ── HealthBadge tests ─────────────────────────────────────────────────────────

describe('HealthBadge', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const validHealthJson = {
    status: 'ok',
    apiVersion: '1.0.0',
    service: 'dengueahead-api',
    timestamp: new Date().toISOString()
  };

  it('shows loading state initially', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {}))
    ); // never resolves
    render(<HealthBadge apiBaseUrl="http://localhost:4000/api/v1" />);
    expect(screen.getByText('Checking…')).toBeInTheDocument();
  });

  it('shows ok state on successful valid response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => validHealthJson
      })
    );
    render(<HealthBadge apiBaseUrl="http://localhost:4000/api/v1" />);
    await waitFor(() => expect(screen.getByText('API Connected')).toBeInTheDocument());
  });

  it('shows degraded state when API reports degraded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ...validHealthJson, status: 'degraded' })
      })
    );
    render(<HealthBadge apiBaseUrl="http://localhost:4000/api/v1" />);
    await waitFor(() => expect(screen.getByText('API Degraded')).toBeInTheDocument());
  });

  it('shows error state when API reports error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ...validHealthJson, status: 'error' })
      })
    );
    render(<HealthBadge apiBaseUrl="http://localhost:4000/api/v1" />);
    await waitFor(() => expect(screen.getByText('API Error')).toBeInTheDocument());
  });

  it('shows unreachable state on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network error')));
    render(<HealthBadge apiBaseUrl="http://localhost:4000/api/v1" />);
    await waitFor(() => expect(screen.getByText('API Unreachable')).toBeInTheDocument());
  });

  it('shows error state on HTTP 503', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({})
      })
    );
    render(<HealthBadge apiBaseUrl="http://localhost:4000/api/v1" />);
    await waitFor(() => expect(screen.getByText('API Error')).toBeInTheDocument());
  });

  it('shows invalid state when response fails schema validation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ unexpected: 'garbage', noStatus: true })
      })
    );
    render(<HealthBadge apiBaseUrl="http://localhost:4000/api/v1" />);
    await waitFor(() => expect(screen.getByText('API Response Invalid')).toBeInTheDocument());
  });

  it('shows invalid state on malformed JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        }
      })
    );
    render(<HealthBadge apiBaseUrl="http://localhost:4000/api/v1" />);
    await waitFor(() => expect(screen.getByText('API Response Invalid')).toBeInTheDocument());
  });

  it('shows not-configured state when apiBaseUrl is undefined', async () => {
    render(<HealthBadge apiBaseUrl={undefined as unknown as string} />);
    await waitFor(() => expect(screen.getByText('API Not Configured')).toBeInTheDocument());
  });

  it('never shows "API Connected" when the response is invalid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({})
      })
    );
    render(<HealthBadge apiBaseUrl="http://localhost:4000/api/v1" />);
    await waitFor(() => expect(screen.queryByText('API Connected')).toBeNull());
  });
});
