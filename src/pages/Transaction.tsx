import { useState } from 'react';
import { api } from '../services/api';
import { Send, AlertCircle, CheckCircle2 } from 'lucide-react';
// @ts-ignore
import { ed25519 } from '@noble/curves/ed25519.js';

export function Transaction() {
  const [sender, setSender] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('0.0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const amountNum = parseFloat(amount);
      const feeNum = parseFloat(fee);
      
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Amount must be a positive number');
      }
      if (isNaN(feeNum) || feeNum < 0) {
        throw new Error('Fee must be zero or a positive number');
      }

      // Prepare deterministic payload
      const payload = {
        amount: amountNum,
        fee: feeNum,
        receiver_address: receiver,
        sender_address: sender,
      };

      // Sort keys like python's sort_keys=True
      const sortedPayload = {
        amount: payload.amount,
        fee: payload.fee,
        receiver_address: payload.receiver_address,
        sender_address: payload.sender_address,
      };
      
      const payloadStr = JSON.stringify(sortedPayload);
      const message = new TextEncoder().encode(payloadStr);

      // Convert hex private key to bytes
      const privateBytes = h2b(privateKey);
      
      // Sign the payload
      const signature = ed25519.sign(message, privateBytes);
      const signatureHex = b2h(signature);

      // Submit transaction
      await api.post('/transactions', {
        sender_address: sender,
        receiver_address: receiver,
        amount: amountNum,
        fee: feeNum,
        signature: signatureHex,
      });

      setSuccess(true);
      setReceiver('');
      setAmount('');
      setFee('0.0');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to submit transaction');
    } finally {
      setLoading(false);
    }
  };

  const h2b = (hex: string) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  };

  const b2h = (bytes: Uint8Array) => {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center mb-8">
          <div className="bg-blue-100 p-3 rounded-xl mr-4">
            <Send className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Send Transaction</h1>
            <p className="text-slate-500">Sign and broadcast a new transaction to the network.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg flex items-start border border-red-200">
            <AlertCircle className="w-5 h-5 mr-3 mt-0.5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 text-green-800 p-4 rounded-lg flex items-start border border-green-200">
            <CheckCircle2 className="w-5 h-5 mr-3 mt-0.5 shrink-0" />
            <p className="text-sm font-medium">Transaction submitted successfully! It is now pending and waiting to be mined in the next block.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Sender Info</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Your Public Key (Address)</label>
              <input
                type="text"
                required
                value={sender}
                onChange={e => setSender(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white font-mono text-sm"
                placeholder="e.g. 4655ec4f..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Your Private Key (For signing)</label>
              <input
                type="password"
                required
                value={privateKey}
                onChange={e => setPrivateKey(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white font-mono text-sm"
                placeholder="Never share this!"
              />
            </div>
          </div>

          <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Transaction Details</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Receiver Address</label>
              <input
                type="text"
                required
                value={receiver}
                onChange={e => setReceiver(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white font-mono text-sm"
                placeholder="e.g. wallet_bob"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.00000001"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 rounded-md border border-slate-300 bg-white"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Network Fee</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.00000001"
                    required
                    value={fee}
                    onChange={e => setFee(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 rounded-md border border-slate-300 bg-white"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !sender || !privateKey || !receiver || !amount}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing & Sending...' : 'Sign & Broadcast Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
}
