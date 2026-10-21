import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useToastStore } from '../store/useToastStore';
import { ToastRegion } from './ToastRegion';

describe('ToastRegion', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it('is a polite live region that exists before any toast', () => {
    render(<ToastRegion />);

    expect(screen.getByRole('region', { name: 'Notifications' })).toHaveAttribute('aria-live', 'polite');
  });

  it('shows each toast with the entry animation', () => {
    render(<ToastRegion />);

    act(() => {
      useToastStore.getState().show('Block #13 sealed · nonce 3,104,227');
    });

    const toast = screen.getByText('Block #13 sealed · nonce 3,104,227').parentElement;
    expect(toast).toHaveClass('animate-vl-toast-in', 'border-vl-line');
  });

  it('marks a refusal with the danger border', () => {
    render(<ToastRegion />);

    act(() => {
      useToastStore.getState().show('The node refused the request: not enough permissions.', 'err');
    });

    expect(screen.getByText(/not enough permissions/).parentElement).toHaveClass('border-vl-danger');
  });

  it('dismisses a toast', () => {
    render(<ToastRegion />);
    act(() => {
      useToastStore.getState().show('New block #14 arrived from another node.', 'info');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(screen.queryByText('New block #14 arrived from another node.')).not.toBeInTheDocument();
  });
});
