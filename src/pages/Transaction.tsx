import { useState } from 'react';
import { api } from '../services/api';
import { Send, AlertCircle, CheckCircle2, ShieldCheck, FileDigit } from 'lucide-react';
// @ts-ignore
import { ed25519 } from '@noble/curves/ed25519.js';

export function Transaction() {
  const [tab, setTab] = useState<'transfer' | 'notarize'>('transfer');
  
  const [sender, setSender] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('0.0');
  const [payload, setPayload] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const amountNum = tab === 'transfer' ? parseFloat(amount) : 0.0;
      const feeNum = parseFloat(fee);
      
      if (tab === 'transfer' && (isNaN(amountNum) || amountNum <= 0)) {
        throw new Error('Amount must be a positive number');
      }
      if (isNaN(feeNum) || feeNum < 0) {
        throw new Error('Fee must be zero or a positive number');
      }
      if (tab === 'notarize' && !payload) {
        throw new Error('Document Hash (Payload) is required for notarization');
      }

      // Receiver is self if notarization
      const finalReceiver = tab === 'notarize' ? sender : receiver;

      // Prepare deterministic payload
      const txPayload: any = {
        amount: amountNum,
        fee: feeNum,
        receiver_address: finalReceiver,
        sender_address: sender,
      };
      
      if (tab === 'notarize') {
        txPayload.payload = payload;
      }

      // Sort keys like python's sort_keys=True
      const sortedKeys = Object.keys(txPayload).sort();
      const sortedPayload: any = {};
      for (const k of sortedKeys) {
        sortedPayload[k] = txPayload[k];
      }
      
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
        receiver_address: finalReceiver,
        amount: amountNum,
        fee: feeNum,
        signature: signatureHex,
        payload: tab === 'notarize' ? payload : undefined,
      });

      setSuccess(true);
      if (tab === 'transfer') {
        setReceiver('');
        setAmount('');
      } else {
        setPayload('');
      }
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
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="glass-panel rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="bg-[#1e2130] p-3 rounded-xl border border-[#3b82f6]/30 shadow-[0_0_15px_rgba(59,130,246,0.3)] mr-4">
              <Send className="w-6 h-6 text-[#00f0ff]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Broadcast Transaction</h1>
              <p className="text-slate-400 text-sm mt-1">Sign and send transactions directly to the network.</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8 bg-[#0f111a] p-1 rounded-xl border border-[#2d3142]">
          <button
            onClick={() => setTab('transfer')}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
              tab === 'transfer'
                ? 'bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0f111a] shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-[#1e2130]'
            }`}
          >
            Transfer Funds
          </button>
          <button
            onClick={() => setTab('notarize')}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
              tab === 'notarize'
                ? 'bg-gradient-to-r from-purple-500 to-[#8a2be2] text-white shadow-[0_0_10px_rgba(138,43,226,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-[#1e2130]'
            }`}
          >
            Notarize Document
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/30 text-red-400 p-4 rounded-xl flex items-start border border-red-500/50">
            <AlertCircle className="w-5 h-5 mr-3 mt-0.5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-900/30 text-green-400 p-4 rounded-xl flex items-start border border-green-500/50">
            <CheckCircle2 className="w-5 h-5 mr-3 mt-0.5 shrink-0" />
            <p className="text-sm font-medium">Transaction submitted successfully! It is now pending and waiting to be mined.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Global Identity Section */}
          <div className="space-y-4 p-5 bg-[#0f111a] rounded-xl border border-[#2d3142]">
            <h3 className="font-semibold text-[#00f0ff] text-xs uppercase tracking-wider">Sender Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Public Key (Address)</label>
                <input
                  type="text"
                  required
                  value={sender}
                  onChange={e => setSender(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1e2130] border border-[#2d3142] text-white font-mono text-sm focus:ring-[#00f0ff] focus:border-[#00f0ff] outline-none"
                  placeholder="e.g. 4655ec4f..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Private Key (For Signing)</label>
                <input
                  type="password"
                  required
                  value={privateKey}
                  onChange={e => setPrivateKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#1e2130] border border-[#2d3142] text-white font-mono text-sm focus:ring-[#00f0ff] focus:border-[#00f0ff] outline-none"
                  placeholder="Never share this!"
                />
              </div>
            </div>
          </div>

          {/* Type Specific Fields */}
          <div className={`space-y-4 p-5 bg-[#0f111a] rounded-xl border ${tab === 'notarize' ? 'border-purple-500/30' : 'border-[#2d3142]'}`}>
            <h3 className={`font-semibold text-xs uppercase tracking-wider flex items-center ${tab === 'notarize' ? 'text-purple-400' : 'text-[#3b82f6]'}`}>
              {tab === 'notarize' ? <><ShieldCheck className="w-3.5 h-3.5 mr-1" /> Document Details</> : 'Transfer Details'}
            </h3>
            
            {tab === 'transfer' ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Receiver Address</label>
                  <input
                    type="text"
                    required
                    value={receiver}
                    onChange={e => setReceiver(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#1e2130] border border-[#2d3142] text-white font-mono text-sm focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none"
                    placeholder="e.g. wallet_bob"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Amount</label>
                    <input
                      type="number"
                      step="0.00000001"
                      required
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#1e2130] border border-[#2d3142] text-white focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Network Fee</label>
                    <input
                      type="number"
                      step="0.00000001"
                      required
                      value={fee}
                      onChange={e => setFee(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#1e2130] border border-[#2d3142] text-white focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-400 mb-2">Notarize a document by embedding its cryptographic hash into the blockchain. The amount sent will be 0.0, but you must pay the mining fee.</p>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Document Hash (Payload)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FileDigit className="h-4 w-4 text-purple-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={payload}
                      onChange={e => setPayload(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#1e2130] border border-purple-500/30 text-white font-mono text-sm focus:ring-purple-500 focus:border-purple-500 outline-none"
                      placeholder="e.g. a8b4c92..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Network Fee</label>
                  <input
                    type="number"
                    step="0.00000001"
                    required
                    value={fee}
                    onChange={e => setFee(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#1e2130] border border-[#2d3142] text-white focus:ring-purple-500 focus:border-purple-500 outline-none"
                    placeholder="0.00"
                  />
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !sender || !privateKey || (tab === 'transfer' && (!receiver || !amount)) || (tab === 'notarize' && !payload)}
            className={`w-full py-4 rounded-xl shadow-lg font-bold transition-all ${
              tab === 'notarize'
                ? 'bg-gradient-to-r from-purple-600 to-[#8a2be2] text-white hover:opacity-90 shadow-[0_0_20px_rgba(138,43,226,0.3)] disabled:opacity-50 disabled:shadow-none'
                : 'bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0f111a] hover:opacity-90 shadow-[0_0_20px_rgba(0,240,255,0.3)] disabled:opacity-50 disabled:shadow-none'
            }`}
          >
            {loading ? 'Signing & Sending...' : tab === 'notarize' ? 'Sign & Notarize Document' : 'Sign & Broadcast Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
}
