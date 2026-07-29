import { useState } from 'react';
import { api } from '../services/api';
import type { Wallet as WalletType } from '../types/ledger';
import { KeyRound, ShieldCheck, Copy, Check } from 'lucide-react';

export function Wallet() {
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const generateWallet = async () => {
    setLoading(true);
    try {
      const response = await api.post<WalletType>('/wallets/generate');
      setWallet(response.data);
    } catch (err) {
      console.error('Failed to generate wallet', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(type);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Wallet Generator</h1>
        <p className="mt-2 text-slate-500">Generate a new Ed25519 keypair to sign transactions securely.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          <KeyRound className="w-8 h-8 text-blue-600" />
        </div>
        
        <button
          onClick={generateWallet}
          disabled={loading}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Generating...' : 'Generate New Wallet'}
        </button>

        {wallet && (
          <div className="mt-8 text-left space-y-6">
            <div className="bg-green-50 rounded-lg p-4 flex items-start border border-green-200">
              <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 mr-3 shrink-0" />
              <p className="text-sm text-green-800">
                Wallet generated successfully! <strong>Save your private key.</strong> We do not store it, and if you lose it, you lose access to sign transactions from this address.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Public Key (Address)</label>
                <div className="flex">
                  <input
                    readOnly
                    value={wallet.public_key}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-slate-300 bg-slate-50 text-slate-900 sm:text-sm font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(wallet.public_key, 'public')}
                    className="inline-flex items-center px-4 py-2 border border-l-0 border-slate-300 rounded-r-md bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {copiedKey === 'public' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Private Key (Secret)</label>
                <div className="flex">
                  <input
                    readOnly
                    value={wallet.private_key}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-slate-300 bg-slate-50 text-slate-900 sm:text-sm font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(wallet.private_key, 'private')}
                    className="inline-flex items-center px-4 py-2 border border-l-0 border-slate-300 rounded-r-md bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {copiedKey === 'private' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
