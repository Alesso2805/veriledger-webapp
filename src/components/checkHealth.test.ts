import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseDownError, getHealth } from '../services/health';
import { useHealthStore } from '../store/useHealthStore';
import { useToastStore } from '../store/useToastStore';
import { checkHealth } from './checkHealth';

vi.mock('../services/health', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/health')>()),
  getHealth: vi.fn(),
}));

const toasts = () => useToastStore.getState().toasts.map((toast) => toast.text);

describe('checkHealth', () => {
  beforeEach(() => {
    useHealthStore.setState({ online: null, databaseDown: false, demoMode: false });
    useToastStore.setState({ toasts: [] });
  });

  it('remembers whether the node starts demo accounts', async () => {
    vi.mocked(getHealth).mockResolvedValue({ status: 'ok', environment: 'test', demo_mode: true, database: 'ok' });
    await checkHealth();
    expect(useHealthStore.getState().demoMode).toBe(true);

    vi.mocked(getHealth).mockResolvedValue({ status: 'ok', environment: 'test', demo_mode: false, database: 'ok' });
    await checkHealth();
    expect(useHealthStore.getState().demoMode).toBe(false);
  });

  it('marks the API online on the first answer, without a toast', async () => {
    vi.mocked(getHealth).mockResolvedValue({ status: 'ok', environment: 'test', demo_mode: false, database: 'ok' });

    await checkHealth();

    expect(useHealthStore.getState().online).toBe(true);
    expect(toasts()).toEqual([]);
  });

  it('remembers that the database is the cause when /health says so, until it answers again', async () => {
    vi.mocked(getHealth).mockRejectedValue(new DatabaseDownError('The API answers, but its database does not'));
    await checkHealth();
    expect(useHealthStore.getState()).toMatchObject({ online: false, databaseDown: true });

    vi.mocked(getHealth).mockRejectedValue(new Error('Network Error'));
    await checkHealth();
    expect(useHealthStore.getState()).toMatchObject({ online: false, databaseDown: false });

    vi.mocked(getHealth).mockResolvedValue({ status: 'ok', environment: 'test', demo_mode: false, database: 'ok' });
    await checkHealth();
    expect(useHealthStore.getState()).toMatchObject({ online: true, databaseDown: false });
  });

  it('marks the API offline when /health fails', async () => {
    vi.mocked(getHealth).mockRejectedValue(new Error('Network Error'));

    await checkHealth();

    expect(useHealthStore.getState().online).toBe(false);
  });

  it('says "Back online." when the API answers after being offline', async () => {
    useHealthStore.setState({ online: false });
    vi.mocked(getHealth).mockResolvedValue({ status: 'ok', environment: 'test', demo_mode: false, database: 'ok' });

    await checkHealth();

    expect(useHealthStore.getState().online).toBe(true);
    expect(toasts()).toEqual(['Back online.']);
  });

  it('stays quiet while the API keeps answering', async () => {
    useHealthStore.setState({ online: true });
    vi.mocked(getHealth).mockResolvedValue({ status: 'ok', environment: 'test', demo_mode: false, database: 'ok' });

    await checkHealth();

    expect(toasts()).toEqual([]);
  });
});
