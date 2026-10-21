import { useState } from 'react';
import { generateKeyPair } from '../lib/keys';
import { api } from '../services/api';
import type { Wallet as WalletType } from '../types/ledger';
import { KeyRound, ShieldCheck, Copy, Check, Search } from 'lucide-react';

export function Wallet() {
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [balanceAddress, setBalanceAddress] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const checkBalance = async () => {
    if (!balanceAddress) return;
    setBalanceLoading(true);
    try {
      const response = await api.get(`/wallets/${balanceAddress}/balance`);
      setBalance(response.data.balance);
    } catch (err) {
      console.error('Failed to get balance', err);
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  };

  const generateWallet = () => {
    setWallet(generateKeyPair());
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(type);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Generator Section */}
      <div className="glass-panel rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#00f0ff] rounded-full blur-[100px] opacity-10 pointer-events-none"></div>
        
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-[#1e2130] rounded-2xl border border-[#00f0ff]/30 shadow-[0_0_15px_rgba(0,240,255,0.2)] flex items-center justify-center mb-6">
            <KeyRound className="w-8 h-8 text-[#00f0ff]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Wallet Generator</h1>
          <p className="mt-2 text-slate-400 text-sm">Generate a new Ed25519 keypair for the VeriLedger network.</p>
        </div>
        
        <button
          onClick={generateWallet}
          className="w-full py-3 bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#0f111a] font-bold rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50 transition-all hover:opacity-90"
        >
          Generate New Wallet
        </button>

        {wallet && (
          <div className="mt-8 text-left space-y-6">
            <div className="bg-green-900/20 rounded-xl p-4 flex items-start border border-green-500/30">
              <ShieldCheck className="w-5 h-5 text-green-400 mt-0.5 mr-3 shrink-0" />
              <p className="text-sm text-green-300">
                Wallet generated in this browser. <strong>Save your private key:</strong> it was never sent to the server and is not stored anywhere.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Public Key (Address)</label>
                <div className="flex">
                  <input
                    readOnly
                    value={wallet.public_key}
                    className="flex-1 min-w-0 block w-full px-3 py-2.5 rounded-l-lg border border-[#2d3142] bg-[#0f111a] text-[#00f0ff] sm:text-sm font-mono outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(wallet.public_key, 'public')}
                    className="inline-flex items-center px-4 py-2 border border-l-0 border-[#2d3142] rounded-r-lg bg-[#1e2130] text-sm font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    {copiedKey === 'public' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Private Key (Secret)</label>
                <div className="flex">
                  <input
                    readOnly
                    value={wallet.private_key}
                    className="flex-1 min-w-0 block w-full px-3 py-2.5 rounded-l-lg border border-[#2d3142] bg-[#0f111a] text-purple-400 sm:text-sm font-mono outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(wallet.private_key, 'private')}
                    className="inline-flex items-center px-4 py-2 border border-l-0 border-[#2d3142] rounded-r-lg bg-[#1e2130] text-sm font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    {copiedKey === 'private' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Balance Checker Section */}
      <div className="glass-panel rounded-2xl p-8 relative overflow-hidden h-fit">
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>

        <div className="text-center mb-8">
           <div className="mx-auto w-16 h-16 bg-[#1e2130] rounded-2xl border border-purple-500/30 shadow-[0_0_15px_rgba(138,43,226,0.2)] flex items-center justify-center mb-6">
            <Search className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Check Balance</h2>
          <p className="mt-2 text-slate-400 text-sm">View the UTXO balance of any wallet address on the network.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Address (Public Key)</label>
            <input
              type="text"
              value={balanceAddress}
              onChange={e => setBalanceAddress(e.target.value)}
              className="w-full px-3 py-3 rounded-lg border border-[#2d3142] bg-[#0f111a] text-white font-mono text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
              placeholder="e.g. 4655ec4f..."
            />
          </div>
          <button
            onClick={checkBalance}
            disabled={!balanceAddress || balanceLoading}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-[#8a2be2] text-white font-bold rounded-xl shadow-[0_0_15px_rgba(138,43,226,0.3)] disabled:opacity-50 transition-all hover:opacity-90"
          >
            {balanceLoading ? 'Checking Network...' : 'Query Ledger'}
          </button>
        </div>

        {balance !== null && (
          <div className="mt-8 text-center p-6 bg-[#0f111a] rounded-xl border border-purple-500/30 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Available Balance</p>
            <p className="text-4xl font-black text-white mt-2 drop-shadow-[0_0_10px_rgba(138,43,226,0.5)]">
              {balance.toFixed(2)} <span className="text-lg text-purple-400">VL</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
