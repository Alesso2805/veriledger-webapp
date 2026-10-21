import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, type RouteObject } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { routes } from '../Router';

// AR-08: every route except the public ones renders only with a session.
// VLW-34 makes the tower, transactions and peers public; it adds them here.
const PUBLIC_PATHS = ['/login'];

vi.mock('../services/api', () => ({
  api: {
    get: () => new Promise(() => {}),
    post: () => new Promise(() => {}),
  },
}));

function leafPaths(list: RouteObject[], parent = ''): string[] {
  return list.flatMap((route) => {
    const path = route.index
      ? parent || '/'
      : `${parent.replace(/\/$/, '')}/${(route.path ?? '').replace(/^\//, '')}`;
    return route.children?.length ? leafPaths(route.children, path) : [path];
  });
}

const protectedPaths = leafPaths(routes)
  .filter((path) => !PUBLIC_PATHS.includes(path))
  .map((path) => path.replace(/:\w+/g, 'sample'));

function CurrentPath() {
  return <output data-testid="path">{useLocation().pathname}</output>;
}

describe('AR-08 protected routes', () => {
  it('walks the route table', () => {
    expect(protectedPaths).toContain('/');
    expect(protectedPaths).toContain('/wallet');
  });

  it.each(protectedPaths)('%s without a session goes to /login', async (path) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
        <CurrentPath />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent(/^\/login$/));
  });
});
