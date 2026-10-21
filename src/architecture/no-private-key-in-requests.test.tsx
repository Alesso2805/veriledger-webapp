import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SignAndSend } from '../pages/SignAndSend';
import { Wallet } from '../pages/Wallet';
import { api } from '../services/api';
import { useKeyStore } from '../store/useKeyStore';

// AR-05: the generate → sign → send flow, through the real services and API client, with every request recorded
// by a stand-in adapter that answers like the API. No URL, header or body may contain the private key.
interface Recorded {
  method: string;
  url: string;
  headers: string;
  body: string;
}

type Config = { method?: string; url?: string; headers?: unknown; data?: unknown };

const recorded: Recorded[] = [];
let nextNonce = 1;

function answer(config: Config) {
  recorded.push({
    method: (config.method ?? 'get').toUpperCase(),
    url: config.url ?? '',
    headers: JSON.stringify(config.headers ?? {}),
    body: typeof config.data === 'string' ? config.data : JSON.stringify(config.data ?? null),
  });
  const url = config.url ?? '';
  let data: unknown = null;
  if (url.endsWith('/nonce')) data = { address: 'x', nonce: nextNonce };
  if (url.endsWith('/balance')) data = { address: 'x', balance: 50 };
  if (url === '/transactions' && config.method === 'post') {
    nextNonce += 1;
    data = { id: `t${nextNonce}`, tx_hash: String(nextNonce).repeat(64), status: 'PENDING' };
  }
  return { data, status: 200, statusText: 'OK', headers: {}, config };
}

const original = api.defaults.adapter;

describe('AR-05 no request carries the private key', () => {
  beforeAll(() => {
    api.defaults.adapter = (async (config: Config) => answer(config)) as unknown as typeof api.defaults.adapter;
  });

  afterAll(() => {
    api.defaults.adapter = original;
  });

  it('generates a wallet, then signs and sends a transfer and a notarization without sending the key', async () => {
    render(
      <MemoryRouter>
        <Wallet />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Create a wallet' }));
    const privateKey = useKeyStore.getState().pair?.private_key ?? '';
    expect(privateKey).toMatch(/^[0-9a-f]{64}$/);
    cleanup();

    render(
      <MemoryRouter>
        <SignAndSend />
      </MemoryRouter>,
    );
    await screen.findByDisplayValue('1');
    fireEvent.change(screen.getByLabelText('To'), { target: { value: 'ab'.repeat(32) } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign with this key' }));
    fireEvent.click(screen.getByRole('button', { name: 'Send to the node' }));
    await screen.findByText('Accepted by the node');

    fireEvent.click(screen.getByRole('button', { name: 'Send another' }));
    await screen.findByDisplayValue('2');
    fireEvent.click(screen.getByRole('button', { name: 'Notarize a document' }));
    fireEvent.change(screen.getByLabelText(/Choose the document/), {
      target: { files: [new File(['a contract'], 'contract.txt', { type: 'text/plain' })] },
    });
    await screen.findByText(/contract\.txt · SHA-256/);
    fireEvent.click(screen.getByRole('button', { name: 'Sign with this key' }));
    fireEvent.click(screen.getByRole('button', { name: 'Send to the node' }));
    await screen.findByText('Accepted by the node');

    const sent = recorded.filter((request) => request.method === 'POST' && request.url === '/transactions');
    expect(sent).toHaveLength(2);
    expect(sent.map((request) => JSON.parse(request.body).nonce)).toEqual([1, 2]);
    const leaks = recorded.filter((request) => `${request.url} ${request.headers} ${request.body}`.includes(privateKey));
    expect(leaks).toEqual([]);
  });
});
