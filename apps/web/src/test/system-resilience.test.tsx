import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { useState } from 'react';
import { z } from 'zod';
import { ErrorBoundary } from '../components/ui/ErrorBoundary.js';
import { apiFetch } from '../lib/api.js';
import { OfflineBanner } from '../components/ui/OfflineBanner.js';

const CrashingComponent: React.FC<{ crash: boolean }> = ({ crash }) => {
  if (crash) {
    throw new Error('Simulated SVG Chart Render Failure');
  }
  return <div>Healthy Component Content</div>;
};

const ResilientWrapper: React.FC = () => {
  const [hasCrash, setHasCrash] = useState(true);

  return (
    <ErrorBoundary fallbackTitle="Area Detail Render Crash" onReset={() => setHasCrash(false)}>
      <CrashingComponent crash={hasCrash} />
    </ErrorBoundary>
  );
};

describe('System Resilience Suite (SYS-01, SYS-02)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── SYS-01: React Error Boundary ──────────────────────────────────────────
  it('SYS-01: ErrorBoundary catches child render crash, displays recovery card, and recovers on retry', () => {
    // Spy on console.error to silence expected React boundary error in test output
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ResilientWrapper />);

    // Verify recovery card is visible
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Area Detail Render Crash')).toBeInTheDocument();
    expect(screen.getByText(/Simulated SVG Chart Render Failure/i)).toBeInTheDocument();

    // Verify diagnostic details toggle
    const detailsBtn = screen.getByRole('button', { name: /Show Diagnostic Details/i });
    fireEvent.click(detailsBtn);
    expect(screen.getByText(/Reference ID: err_/i)).toBeInTheDocument();

    // Verify Try Again button triggers reset and recovers
    const retryBtn = screen.getByRole('button', { name: /Try Again/i });
    fireEvent.click(retryBtn);

    expect(screen.getByText('Healthy Component Content')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  // ── apiFetch Retry Policy ──────────────────────────────────────────────────
  it('apiFetch retries on transient HTTP 503 and succeeds on subsequent attempt', async () => {
    let callCount = 0;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First attempt: 503 DATABASE_UNAVAILABLE
          return Promise.resolve({
            ok: false,
            status: 503,
            json: async () => ({})
          });
        }
        // Second attempt: 200 OK
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ status: 'ok', count: 42 })
        });
      })
    );

    const testSchema = z.object({
      status: z.literal('ok'),
      count: z.number()
    });

    const result = await apiFetch('http://localhost:4000/api/v1/test', testSchema, {
      retries: 2,
      retryDelayMs: 10 // fast for tests
    });

    expect(callCount).toBe(2);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.count).toBe(42);
    }
  });

  // ── Offline Banner ────────────────────────────────────────────────────────
  it('OfflineBanner renders polite ARIA live alert for database outages', () => {
    render(<OfflineBanner message="Database disconnected — displaying cached forecasts" />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Database disconnected');
  });
});
