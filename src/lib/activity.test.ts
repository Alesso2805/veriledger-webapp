import { describe, expect, it } from 'vitest';
import type { Transaction } from '../types/ledger';
import { activityRow, activitySummary } from './activity';

const me = 'aa'.repeat(32);
const other = '7c2d09aa' + 'cd'.repeat(26) + 'e51b';

const tx = (patch: Partial<Transaction>): Transaction => ({
  id: 't',
  sender_address: me,
  receiver_address: other,
  amount: 0,
  fee: 0,
  status: 'CONFIRMED',
  signature: 'ab'.repeat(64),
  timestamp: '2026-10-21T15:00:00Z',
  tx_hash: 'h',
  block_number: 10,
  ...patch,
});

const reward = tx({ sender_address: 'SYSTEM', receiver_address: me, amount: 50, block_number: 12 });
const sent = tx({ amount: 5, fee: 0.1 });
const notarized = tx({ receiver_address: me, fee: 0.2, payload: 'a8b4c92e' + 'ef'.repeat(26) + '1f07', status: 'PENDING', block_number: null });
const received = tx({ sender_address: other, receiver_address: me, amount: 50, fee: 0.3, block_number: 8 });

describe('activityRow', () => {
  it('words each kind as the artboard does, with what it does to the balance', () => {
    expect(activityRow(me, reward)).toEqual({ title: 'Mining reward', detail: 'Block #12', change: '+50.00', status: 'Block #12' });
    expect(activityRow(me, sent)).toEqual({ title: 'Sent to 7c2d09aa…e51b', detail: 'fee 0.10', change: '−5.10', status: 'Block #10' });
    expect(activityRow(me, notarized)).toEqual({
      title: 'Notarized a document',
      detail: 'a8b4c92e…efef1f07 · fee 0.20',
      change: '−0.20',
      status: 'Waiting',
    });
    expect(activityRow(me, received)).toEqual({
      title: 'Received from 7c2d09aa…e51b',
      detail: 'fee 0.30, paid by the sender',
      change: '+50.00',
      status: 'Block #8',
    });
  });

  it('charges only the fee for a transfer to the same address', () => {
    expect(activityRow(me, tx({ receiver_address: me, amount: 3, fee: 0.1 }))).toMatchObject({
      title: 'Sent to this address',
      change: '−0.10',
    });
  });

  it('adds amounts that came as floats without drift', () => {
    expect(activityRow(me, tx({ amount: 0.1, fee: 0.2 })).change).toBe('−0.30');
  });
});

describe('activitySummary', () => {
  it('adds up what was received, sent and is still waiting', () => {
    expect(activitySummary(me, [notarized, reward, sent, received])).toBe('100.00 received · 5.10 sent · 0.20 waiting');
  });

  it('leaves out failed transactions', () => {
    expect(activitySummary(me, [reward, tx({ amount: 9, status: 'FAILED' })])).toBe('50.00 received · 0.00 sent · 0.00 waiting');
  });

  it('says a new address has received nothing yet', () => {
    expect(activitySummary(me, [])).toBe('New address: nothing received yet');
  });
});
