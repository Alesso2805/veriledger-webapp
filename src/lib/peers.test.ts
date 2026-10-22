import { describe, expect, it } from 'vitest';
import { looksLikePeerUrl, MAP, peerHex, peerLabel, ringPoints } from './peers';

describe('ringPoints', () => {
  it('puts the first peer at the top and spreads the others evenly', () => {
    const points = ringPoints(4);

    expect(points[0]).toEqual({ x: MAP.cx, y: MAP.cy - MAP.radius, degrees: -90 });
    expect(points[1]).toEqual({ x: MAP.cx + MAP.radius, y: MAP.cy, degrees: 0 });
    expect(points[2]).toEqual({ x: MAP.cx, y: MAP.cy + MAP.radius, degrees: 90 });
    expect(points[3]).toEqual({ x: MAP.cx - MAP.radius, y: MAP.cy, degrees: 180 });
  });

  it('draws nothing without peers', () => {
    expect(ringPoints(0)).toEqual([]);
  });
});

describe('peerLabel', () => {
  it('names a peer by the first label of its host', () => {
    expect(peerLabel('https://node-b.example.org')).toEqual({ name: 'node-b', detail: 'example.org' });
  });

  it('keeps an IP address whole, over its port', () => {
    expect(peerLabel('http://127.0.0.1:8001')).toEqual({ name: '127.0.0.1', detail: ':8001' });
  });

  it('shows text that is not a URL as it is', () => {
    expect(peerLabel('not a url')).toEqual({ name: 'not a url', detail: '' });
  });
});

describe('looksLikePeerUrl', () => {
  it.each([
    ['https://node-e.example.org', true],
    [' http://127.0.0.1:8001 ', true],
    ['node-e.example.org', false],
    ['ftp://node-e.example.org', false],
    ['https://', false],
  ])('%j → %s', (text, expected) => {
    expect(looksLikePeerUrl(text)).toBe(expected);
  });
});

describe('peerHex', () => {
  it('gives each URL four bytes of its own, the same on every visit', () => {
    // FNV-1a of "a" is 0xe40c292c; its bytes, low first.
    expect(peerHex('a')).toBe('2c290ce4');
    expect(peerHex('https://node-b.example.org')).toBe(peerHex('https://node-b.example.org'));
    expect(peerHex('https://node-b.example.org')).not.toBe(peerHex('https://node-c.example.org'));
  });
});
