import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getHealth } from '../services/health';
import { useHealthStore } from '../store/useHealthStore';
import { useToastStore } from '../store/useToastStore';
import { checkHealth } from './checkHealth';

vi.mock('../services/health', () => ({ getHealth: vi.fn() }));

const toasts = () => useToastStore.getState().toasts.map((toast) => toast.text);

describe('checkHealth', () => {
  beforeEach(() => {
    useHealthStore.setState({ online: null, demoMode: false });
    useToastStore.setState({ toasts: [] });
  });

  it('remembers whether the node starts demo accounts', async () => {
    vi.mocked(getHealth).mockResolvedValue({ status: 'ok', environment: 'test', demo_mode: true });
    await checkHealth();
    expect(useHealthStore.getState().demoMode).toBe(true);

    // An API from before VLA-35 does not say, which means no demo.
    vi.mocked(getHealth).mockResolvedValue({ status: 'ok', environment: 'test' });
    await checkHealth();
    expect(useHealthStore.getState().demoMode).toBe(false);
  });

  it('marks the API online on the first answer, without a toast', async () => {
    vi.mocked(getHealth).mockResolvedValue({ status: 'ok', environment: 'test' });

    await checkHealth();

    expect(useHealthStore.getState().online).toBe(true);
    expect(toasts()).toEqual([]);
  });

  it('marks the API offline when /health fails', async () => {
    vi.mocked(getHealth).mockRejectedValue(new Error('Network Error'));

    await checkHealth();

    expect(useHealthStore.getState().online).toBe(false);
  });

  it('says "Back online." when the API answers after being offline', async () => {
    useHealthStore.setState({ online: false });
    vi.mocked(getHealth).mockResolvedValue({ status: 'ok', environment: 'test' });

    await checkHealth();

    expect(useHealthStore.getState().online).toBe(true);
    expect(toasts()).toEqual(['Back online.']);
  });

  it('stays quiet while the API keeps answering', async () => {
    useHealthStore.setState({ online: true });
    vi.mocked(getHealth).mockResolvedValue({ status: 'ok', environment: 'test' });

    await checkHealth();

    expect(toasts()).toEqual([]);
  });
});
