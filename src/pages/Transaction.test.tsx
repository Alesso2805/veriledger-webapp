import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import vectors from '../lib/__fixtures__/signing-vectors.json';
import { api, statusOf } from '../services/api';
import { getNextNonce } from '../services/wallets';
import { Transaction } from './Transaction';

vi.mock('../services/wallets', () => ({ getNextNonce: vi.fn() }));
vi.mock('../services/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/api')>()),
  statusOf: vi.fn(),
}));

// The API's own "transfer" vector: 10 with no fee, nonce 1. Signing it here must give the vector's signature.
const transfer = vectors.vectors.find((vector) => vector.name === 'transfer')!;

function signTransfer() {
  render(<Transaction />);
  fireEvent.change(screen.getByPlaceholderText('e.g. 4655ec4f...'), { target: { value: transfer.public_key } });
  fireEvent.change(screen.getByPlaceholderText('Never share this!'), { target: { value: transfer.private_key } });
  fireEvent.change(screen.getByPlaceholderText('e.g. wallet_bob'), { target: { value: transfer.fields.receiver_address } });
  fireEvent.change(screen.getAllByPlaceholderText('0.00')[0], { target: { value: '10' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign & Broadcast Transaction' }));
}

describe('Transaction (sign and send)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(getNextNonce).mockReset();
    vi.mocked(statusOf).mockReset();
  });

  it("signs the sender's next nonce and sends exactly what the API's vector signed", async () => {
    vi.mocked(getNextNonce).mockResolvedValue(transfer.fields.nonce);
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });

    signTransfer();

    expect(await screen.findByText(/Transaction submitted successfully/)).toBeInTheDocument();
    expect(getNextNonce).toHaveBeenCalledWith(transfer.public_key);
    expect(post).toHaveBeenCalledWith('/transactions', { ...transfer.fields, signature: transfer.signature });
  });

  it("shows the API's message for a used nonce and which nonce signing again will use", async () => {
    vi.mocked(getNextNonce).mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    vi.spyOn(api, 'post').mockRejectedValue(new Error('Nonce 1 is not the next one for this sender; the next is 2'));
    vi.mocked(statusOf).mockReturnValue(409);

    signTransfer();

    expect(
      await screen.findByText('Nonce 1 is not the next one for this sender; the next is 2. Sign again to use nonce 2.'),
    ).toBeInTheDocument();
  });

  it("shows any other refusal as the API words it, without reading the nonce again", async () => {
    vi.mocked(getNextNonce).mockResolvedValue(1);
    vi.spyOn(api, 'post').mockRejectedValue(new Error('Insufficient funds'));
    vi.mocked(statusOf).mockReturnValue(400);

    signTransfer();

    expect(await screen.findByText('Insufficient funds')).toBeInTheDocument();
    expect(getNextNonce).toHaveBeenCalledTimes(1);
  });
});
