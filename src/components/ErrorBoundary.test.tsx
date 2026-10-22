import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

let broken = true;

function Page() {
  if (broken) throw new Error('drawing failed');
  return <p>the page</p>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    broken = true;
    // React logs every caught error; the test expects them.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('draws the fallback in place of a child that throws while drawing, and the child again on retry', () => {
    render(
      <ErrorBoundary fallback={(retry) => <button onClick={retry}>Try again</button>}>
        <Page />
      </ErrorBoundary>,
    );

    expect(screen.queryByText('the page')).not.toBeInTheDocument();
    broken = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('the page')).toBeInTheDocument();
  });

  it('draws the fallback again when the child still throws', () => {
    render(
      <ErrorBoundary fallback={(retry) => <button onClick={retry}>Try again</button>}>
        <Page />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
