import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkHealth, HEALTH_POLL_MS } from './checkHealth';
import { HealthWatcher } from './HealthWatcher';

vi.mock('./checkHealth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./checkHealth')>()),
  checkHealth: vi.fn().mockResolvedValue(undefined),
}));

describe('HealthWatcher', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(checkHealth).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('checks /health on mount and every 10 s, and stops when unmounted', () => {
    const { unmount } = render(<HealthWatcher />);
    expect(checkHealth).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(HEALTH_POLL_MS * 2);
    expect(checkHealth).toHaveBeenCalledTimes(3);

    unmount();
    vi.advanceTimersByTime(HEALTH_POLL_MS * 2);
    expect(checkHealth).toHaveBeenCalledTimes(3);
  });
});
