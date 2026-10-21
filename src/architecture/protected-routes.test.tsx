import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, type RouteObject } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { routes } from '../Router';

// AR-08: every route except the public ones renders only with a session. The public ones are the login and what
// the API lets anyone read (ADR-0005); a new route is protected unless it is added here.
const PUBLIC_PATHS = ['/login', '/', '/transaction/:hash', '/network', '/*'];

vi.mock('../services/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/api')>()),
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

const visitable = (path: string) => path.replace(/:\w+/g, 'sample').replace('*', 'no-such-page');
const protectedPaths = leafPaths(routes)
  .filter((path) => !PUBLIC_PATHS.includes(path))
  .map(visitable);
const openPaths = PUBLIC_PATHS.filter((path) => path !== '/login').map(visitable);

function CurrentPath() {
  return <output data-testid="path">{useLocation().pathname}</output>;
}

describe('AR-08 protected routes', () => {
  it('walks the route table', () => {
    expect(protectedPaths).toEqual(expect.arrayContaining(['/wallet', '/transact']));
    // A public path that no longer exists in the table would make this list lie.
    expect(leafPaths(routes)).toEqual(expect.arrayContaining(PUBLIC_PATHS));
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

  it.each(openPaths)('%s opens without a session', async (path) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
        <CurrentPath />
      </MemoryRouter>,
    );

    await screen.findByRole('link', { name: 'Sign in' });
    expect(screen.getByTestId('path').textContent).toBe(path);
  });
});
