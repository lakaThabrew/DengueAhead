import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from '../App.js';

describe('App Component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        apiVersion: '1.0.0',
        service: 'dengueahead-api',
        timestamp: new Date().toISOString()
      })
    }));
  });

  it('renders DengueAhead header and non-clinical banner', async () => {
    render(<App />);
    const brandingElements = screen.getAllByText(/DengueAhead/i);
    expect(brandingElements.length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Non-clinical decision-support system/i)
    ).toBeInTheDocument();
  });

  it('displays the 4 architectural pillars', async () => {
    render(<App />);
    expect(screen.getByText('@dengueahead/contracts')).toBeInTheDocument();
    expect(screen.getByText('@dengueahead/api')).toBeInTheDocument();
    expect(screen.getByText('@dengueahead/web')).toBeInTheDocument();
    expect(screen.getByText('services/ml')).toBeInTheDocument();
  });

  it('connects to health endpoint successfully', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/API: Connected/i)).toBeInTheDocument();
    });
  });
});
