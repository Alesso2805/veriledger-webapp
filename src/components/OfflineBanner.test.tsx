import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useHealthStore } from '../store/useHealthStore';
import { checkHealth } from './checkHealth';
import { OfflineBanner } from './OfflineBanner';

vi.mock('./checkHealth', () => ({ checkHealth: vi.fn().mockResolvedValue(undefined) }));

describe('OfflineBanner', () => {
  beforeEach(() => {
    vi.mocked(checkHealth).mockClear();
  });

  it('stays closed and hidden from assistive technology while the API answers', () => {
    useHealthStore.setState({ online: true });
    const { container } = render(<OfflineBanner />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(container.firstChild).toHaveClass('grid-rows-[0fr]');
  });

  it('stays closed before the first answer', () => {
    useHealthStore.setState({ online: null });
    render(<OfflineBanner />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('opens with the API host when /health fails', () => {
    useHealthStore.setState({ online: false });
    const { container } = render(<OfflineBanner />);

    expect(screen.getByRole('alert')).toHaveTextContent('Can’t reach 127.0.0.1:8000. Retrying every 10 s.');
    expect(container.firstChild).toHaveClass('grid-rows-[1fr]');
  });

  it('checks again on "Retry now"', () => {
    useHealthStore.setState({ online: false });
    render(<OfflineBanner />);

    fireEvent.click(screen.getByRole('button', { name: 'Retry now' }));

    expect(checkHealth).toHaveBeenCalledTimes(1);
  });
});
