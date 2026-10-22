import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import themeScript from '../../public/theme.js?raw';
import { usePreferencesStore } from '../store/usePreferencesStore';
import { PREFERENCES_KEY } from '../types/preferences';
import { ThemeSwitch } from './ThemeSwitch';
import { useThemeAttribute } from './useThemeAttribute';

function Shell() {
  useThemeAttribute();
  return <ThemeSwitch />;
}

const theme = () => document.documentElement.getAttribute('data-theme');

describe('the theme switch', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    usePreferencesStore.setState({ theme: 'system' });
  });

  it('cycles System, Light and Dark, says so in words, and pins the theme on <html>', () => {
    render(<Shell />);
    expect(theme()).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Theme: System. Switch to Light' }));
    expect(theme()).toBe('light');

    fireEvent.click(screen.getByRole('button', { name: 'Theme: Light. Switch to Dark' }));
    expect(theme()).toBe('dark');

    fireEvent.click(screen.getByRole('button', { name: 'Theme: Dark. Switch to System' }));
    expect(theme()).toBeNull();
    expect(screen.getByRole('button', { name: 'Theme: System. Switch to Light' })).toBeInTheDocument();
  });
});

describe('public/theme.js', () => {
  const run = () => new Function(themeScript)();

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('sets the stored theme before the app loads', () => {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ state: { theme: 'dark' }, version: 0 }));
    run();
    expect(theme()).toBe('dark');
  });

  it.each([
    ['nothing stored', null],
    ['System', JSON.stringify({ state: { theme: 'system' }, version: 0 })],
    ['a theme it does not know', JSON.stringify({ state: { theme: 'purple' }, version: 0 })],
    ['storage that is not JSON', '{not json'],
    ['a null state', JSON.stringify({ state: null, version: 0 })],
  ])('leaves the system in charge with %s', (_, value) => {
    if (value !== null) localStorage.setItem(PREFERENCES_KEY, value);
    expect(run).not.toThrow();
    expect(theme()).toBeNull();
  });
});
