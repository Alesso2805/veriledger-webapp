import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Block, Paginated } from '../types/ledger';
import { Box, Hash, Clock, FileDigit } from 'lucide-react';

export function Explorer() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [minerAddress, setMinerAddress] = useState('');
  const [mining, setMining] = useState(false);

  const mineBlock = async () => {
    if (!minerAddress) return;
    setMining(true);
    setError(null);
    try {
      await api.post('/blocks/mine', { miner_address: minerAddress });
      await fetchBlocks();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to mine block');
    } finally {
      setMining(false);
    }
  };

  const fetchBlocks = async () => {
    try {
      const response = await api.get<Paginated<Block>>('/blocks');
      setBlocks(response.data.items);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch blocks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
    const interval = setInterval(fetchBlocks, 10000); // Auto refresh every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading blocks...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Block Explorer</h1>
        <button 
          onClick={fetchBlocks}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Mine Pending Transactions</h2>
        <p className="text-sm text-slate-500 mb-4">
          Provide your wallet address to receive the block reward (50.0) plus transaction fees.
        </p>
        <div className="flex space-x-3">
          <input
            type="text"
            value={minerAddress}
            onChange={(e) => setMinerAddress(e.target.value)}
            placeholder="Miner Wallet Address (Public Key)"
            className="flex-1 px-3 py-2 rounded-md border border-slate-300 font-mono text-sm"
          />
          <button
            onClick={mineBlock}
            disabled={mining || !minerAddress}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm disabled:opacity-50 transition-colors"
          >
            {mining ? 'Mining (PoW)...' : 'Mine Block'}
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {blocks.map((block) => (
          <div key={block.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Box className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Block #{block.block_number}</h3>
                  <p className="text-sm text-slate-500 flex items-center mt-1">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(block.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {block.transaction_ids.length} Transactions
                </span>
                <p className="text-sm text-slate-500 mt-2 flex items-center justify-end">
                  <FileDigit className="w-4 h-4 mr-1" />
                  Nonce: {block.nonce}
                </p>
              </div>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Hash</span>
                <div className="mt-1 flex items-center font-mono text-sm text-slate-900 bg-slate-100 p-2 rounded-md break-all">
                  <Hash className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                  {block.block_hash}
                </div>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Previous Hash</span>
                <div className="mt-1 flex items-center font-mono text-sm text-slate-600 bg-slate-50 border border-slate-100 p-2 rounded-md break-all">
                  <Hash className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                  {block.previous_hash}
                </div>
              </div>
            </div>
          </div>
        ))}
        {blocks.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Box className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No blocks have been mined yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
