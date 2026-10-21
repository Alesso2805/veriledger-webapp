import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TOAST_MS, useToastStore } from './useToastStore';

describe('useToastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a toast, ok by default', () => {
    useToastStore.getState().show('Block #13 sealed');

    expect(useToastStore.getState().toasts).toEqual([
      expect.objectContaining({ text: 'Block #13 sealed', kind: 'ok' }),
    ]);
  });

  it('removes a toast after 4 s', () => {
    useToastStore.getState().show('Back online. Data is up to date.');

    vi.advanceTimersByTime(TOAST_MS - 1);
    expect(useToastStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('dismisses one toast and keeps the others', () => {
    const first = useToastStore.getState().show('first');
    useToastStore.getState().show('second', 'err');

    useToastStore.getState().dismiss(first);

    expect(useToastStore.getState().toasts.map((toast) => toast.text)).toEqual(['second']);
  });
});
