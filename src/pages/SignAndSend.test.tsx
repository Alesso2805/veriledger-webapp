import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import vectors from '../lib/__fixtures__/signing-vectors.json';
import { buildSignedMessage, signMessage } from '../lib/signing';
import { statusOf } from '../services/api';
import { sendTransaction } from '../services/ledger';
import { getBalance, getNextNonce } from '../services/wallets';
import { useKeyStore } from '../store/useKeyStore';
import type { Transaction } from '../types/ledger';
import { SignAndSend } from './SignAndSend';

vi.mock('../services/wallets', () => ({ getBalance: vi.fn(), getNextNonce: vi.fn() }));
vi.mock('../services/ledger', () => ({ sendTransaction: vi.fn() }));
vi.mock('../services/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/api')>()),
  statusOf: vi.fn(),
}));

// RFC 8032 test keys from the API's vectors: published, test-only.
const { public_key: publicKey, private_key: privateKey } = vectors.vectors[0];

function renderPage() {
  render(
    <MemoryRouter>
      <SignAndSend />
    </MemoryRouter>,
  );
}

function openKeyFile(text: string) {
  fireEvent.change(screen.getByLabelText('Open a key file'), {
    target: { files: [new File([text], 'key.json', { type: 'application/json' })] },
  });
}

describe('SignAndSend', () => {
  beforeEach(() => {
    useKeyStore.setState({ pair: null });
    vi.mocked(getBalance).mockResolvedValue(50.1);
    vi.mocked(getNextNonce).mockResolvedValue(1);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('asks for a key when this tab holds none', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'No key in this tab' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create a wallet' })).toHaveAttribute('href', '/wallet');
  });

  it('opens a key file and signs as its address, with its balance', async () => {
    renderPage();

    openKeyFile(JSON.stringify({ public_key: publicKey, private_key: privateKey }));

    expect(await screen.findByText('Signing as')).toBeInTheDocument();
    expect(screen.getByTitle(publicKey)).toHaveTextContent('d75a9801…f707511a');
    expect(await screen.findByText('50.10 VL')).toBeInTheDocument();
    expect(useKeyStore.getState().pair).toEqual({ public_key: publicKey, private_key: privateKey });
    expect(getBalance).toHaveBeenCalledWith(publicKey);
  });

  it('says what is wrong with a file that is not a key file', async () => {
    renderPage();

    openKeyFile('{"public_key": "ab"}');

    expect(await screen.findByRole('alert')).toHaveTextContent('This file has no private_key of 64 hex characters.');
    expect(useKeyStore.getState().pair).toBeNull();
  });

  it('signs as the key a wallet left in this tab', async () => {
    useKeyStore.setState({ pair: { public_key: publicKey, private_key: privateKey } });
    renderPage();

    expect(screen.queryByRole('heading', { name: 'No key in this tab' })).not.toBeInTheDocument();
    expect(await screen.findByText('50.10 VL')).toBeInTheDocument();
  });
});

describe('SignAndSend composing and signing', () => {
  // The API's own "transfer" vector: 10 to its receiver, no fee, nonce 1.
  const transfer = vectors.vectors.find((vector) => vector.name === 'transfer')!;

  beforeEach(() => {
    useKeyStore.setState({ pair: { public_key: transfer.public_key, private_key: transfer.private_key } });
    vi.mocked(getBalance).mockResolvedValue(50);
    vi.mocked(getNextNonce).mockResolvedValue(1);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  async function startTransfer() {
    renderPage();
    await screen.findByDisplayValue('1');
    fireEvent.change(screen.getByLabelText('To'), { target: { value: transfer.fields.receiver_address } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '10' } });
  }

  it('shows the message as it will be signed, with the nonce from the node, and signs it as the API expects', async () => {
    await startTransfer();

    expect(getNextNonce).toHaveBeenCalledWith(transfer.public_key);
    expect(screen.getByText(`${new TextEncoder().encode(transfer.message).length} bytes · keys sorted · no spaces`)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sign with this key' }));

    expect(screen.getByText(transfer.signature)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Signed' })).toBeDisabled();
  });

  it('discards the signature when the message changes after signing', async () => {
    await startTransfer();
    fireEvent.click(screen.getByRole('button', { name: 'Sign with this key' }));

    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '11' } });

    expect(screen.queryByText(transfer.signature)).not.toBeInTheDocument();
    expect(screen.getByText('You changed the message, so the old signature no longer matches. Sign again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign with this key' })).toBeEnabled();
  });

  it('says what is wrong with the address, and does not sign', async () => {
    renderPage();
    await screen.findByDisplayValue('1');

    fireEvent.change(screen.getByLabelText('To'), { target: { value: 'abc' } });

    expect(screen.getByLabelText('To')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('An address has 64 characters from 0–9 and a–f.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign with this key' })).toBeDisabled();
  });

  it('hashes the chosen document here and signs its fingerprint as the payload', async () => {
    const abc = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
    renderPage();
    await screen.findByDisplayValue('1');
    fireEvent.click(screen.getByRole('button', { name: 'Notarize a document' }));

    fireEvent.change(screen.getByLabelText(/Choose the document/), {
      target: { files: [new File(['abc'], 'contract.txt', { type: 'text/plain' })] },
    });

    expect(await screen.findByText('contract.txt · SHA-256 ba7816bf…f20015ad')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sign with this key' }));
    const message = buildSignedMessage({
      sender_address: transfer.public_key,
      receiver_address: transfer.public_key,
      amount: '0.00000000',
      fee: '0.00000000',
      nonce: 1,
      payload: abc,
    });
    expect(screen.getByText(signMessage(message, transfer.private_key))).toBeInTheDocument();
  });
});

describe('SignAndSend sending', () => {
  const transfer = vectors.vectors.find((vector) => vector.name === 'transfer')!;
  const txHash = 'f'.repeat(64);

  beforeEach(() => {
    useKeyStore.setState({ pair: { public_key: transfer.public_key, private_key: transfer.private_key } });
    vi.mocked(getBalance).mockResolvedValue(50);
    vi.mocked(getNextNonce).mockResolvedValue(1);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  async function signTransfer() {
    renderPage();
    await screen.findByDisplayValue('1');
    fireEvent.change(screen.getByLabelText('To'), { target: { value: transfer.fields.receiver_address } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign with this key' }));
  }

  it('sends what was signed, says the node accepted it, and links to its page', async () => {
    vi.mocked(sendTransaction).mockResolvedValue({ id: 't1', tx_hash: txHash } as Transaction);
    await signTransfer();

    fireEvent.click(screen.getByRole('button', { name: 'Send to the node' }));

    expect(await screen.findByText('Accepted by the node')).toBeInTheDocument();
    expect(sendTransaction).toHaveBeenCalledWith(transfer.fields, transfer.signature);
    expect(screen.getByRole('link', { name: 'Open the transaction' })).toHaveAttribute('href', `/transaction/${txHash}`);
  });

  it('starts another transaction with the next nonce from the node', async () => {
    vi.mocked(sendTransaction).mockResolvedValue({ id: 't1', tx_hash: txHash } as Transaction);
    await signTransfer();
    fireEvent.click(screen.getByRole('button', { name: 'Send to the node' }));
    await screen.findByText('Accepted by the node');
    vi.mocked(getNextNonce).mockResolvedValue(2);

    fireEvent.click(screen.getByRole('button', { name: 'Send another' }));

    expect(await screen.findByDisplayValue('2')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toHaveValue('');
    expect(screen.getByText('Not signed yet.')).toBeInTheDocument();
  });

  it('reads the next nonce after a 409 and asks to sign again', async () => {
    vi.mocked(sendTransaction).mockRejectedValue(new Error('Nonce 1 is not the next one for this sender; the next is 2'));
    vi.mocked(statusOf).mockReturnValue(409);
    await signTransfer();
    vi.mocked(getNextNonce).mockResolvedValue(2);

    fireEvent.click(screen.getByRole('button', { name: 'Send to the node' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('This nonce was already used');
    expect(alert).toHaveTextContent(
      'Nonce 1 is not the next one for this sender; the next is 2. We read the next one, 2, from the node. Sign again.',
    );
    expect(screen.getByLabelText('Nonce')).toHaveValue('2');
    expect(screen.getByRole('button', { name: 'Sign with this key' })).toBeEnabled();
  });

  it('shows a refused signature with the API’s words', async () => {
    vi.mocked(sendTransaction).mockRejectedValue(new Error('Invalid transaction signature'));
    vi.mocked(statusOf).mockReturnValue(400);
    await signTransfer();

    fireEvent.click(screen.getByRole('button', { name: 'Send to the node' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('The node refused the signature');
    expect(alert).toHaveTextContent('Invalid transaction signature');
    expect(getNextNonce).toHaveBeenCalledTimes(1);
  });
});
