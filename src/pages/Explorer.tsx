import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Block, Paginated } from '../types/ledger';
import { Box, Hash, Clock, FileDigit, Search, Activity, Database, Server } from 'lucide-react';
import { useNavigate } from 'react-router';

export function Explorer() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [minerAddress, setMinerAddress] = useState('');
  const [mining, setMining] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setSearchError('');
    // Try block first, then transaction
    try {
      // Actually we don't have GET /blocks/{hash}, we have GET /transactions/{hash}
      // For MVP, just search transactions:
      const response = await api.get(`/transactions/${searchQuery}`);
      if (response.data) {
        navigate(`/transaction/${searchQuery}`);
      }
    } catch {
      setSearchError('Transaction not found. (Block search not supported yet).');
    }
  };

  useEffect(() => {
    fetchBlocks();
    const interval = setInterval(fetchBlocks, 10000); // Auto refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const totalTxs = blocks.reduce((acc, b) => acc + b.transaction_ids.length, 0);

  if (loading) return <div className="p-8 text-center text-slate-400">Loading blockchain data...</div>;
  
  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="glass-panel rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#00f0ff] rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-[#8a2be2] rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
        
        <div className="relative z-10 text-center space-y-6">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            The <span className="neon-text">VeriLedger</span> Explorer
          </h1>
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-11 pr-4 py-4 bg-[#1e2130]/80 border border-[#2d3142] rounded-l-xl text-white placeholder-slate-400 focus:ring-[#00f0ff] focus:border-[#00f0ff] transition-colors"
                placeholder="Search by Transaction Hash..."
              />
            </div>
            <button
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-slate-900 font-bold rounded-r-xl hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(0,240,255,0.4)]"
            >
              Search
            </button>
          </form>
          {searchError && <p className="text-red-400 text-sm mt-2">{searchError}</p>}
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-xl p-6 flex items-center space-x-4 relative overflow-hidden group">
          <div className="bg-[#1e2130] p-3 rounded-xl border border-[#00f0ff]/30 text-[#00f0ff] group-hover:scale-110 transition-transform">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Total Blocks</p>
            <h3 className="text-2xl font-bold text-white">{blocks.length}</h3>
          </div>
        </div>
        <div className="glass-card rounded-xl p-6 flex items-center space-x-4 relative overflow-hidden group">
          <div className="bg-[#1e2130] p-3 rounded-xl border border-[#8a2be2]/30 text-[#8a2be2] group-hover:scale-110 transition-transform">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Total Transactions</p>
            <h3 className="text-2xl font-bold text-white">{totalTxs}</h3>
          </div>
        </div>
        <div className="glass-card rounded-xl p-6 flex items-center space-x-4 relative overflow-hidden group">
          <div className="bg-[#1e2130] p-3 rounded-xl border border-[#10b981]/30 text-[#10b981] group-hover:scale-110 transition-transform">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Network Status</p>
            <h3 className="text-2xl font-bold text-white flex items-center">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Online
            </h3>
          </div>
        </div>
      </div>

      {error && <div className="p-4 bg-red-900/50 border border-red-500/50 text-red-200 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center">
              <Box className="w-5 h-5 mr-2 text-[#00f0ff]" />
              Latest Blocks
            </h2>
            <button 
              onClick={fetchBlocks}
              className="px-3 py-1.5 bg-[#1e2130] hover:bg-[#2d3142] border border-[#2d3142] hover:border-[#3b82f6] text-slate-300 rounded-lg text-sm transition-all"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-4">
            {blocks.map((block) => (
              <div key={block.id} className="glass-card rounded-xl p-5 neon-border group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-[#1e2130] p-3 rounded-xl border border-[#2d3142] group-hover:border-[#00f0ff]/50 transition-colors">
                      <span className="text-lg font-bold text-[#00f0ff]">#{block.block_number}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Mined Block</h3>
                      <p className="text-xs text-slate-400 flex items-center mt-1">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {new Date(block.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#1e2130] border border-[#8a2be2]/50 text-[#e9d5ff]">
                      {block.transaction_ids.length} Txs
                    </span>
                    <p className="text-xs text-slate-400 mt-2 flex items-center justify-end font-mono">
                      <FileDigit className="w-3.5 h-3.5 mr-1" />
                      Nonce: {block.nonce}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4 bg-[#0f111a] p-3 rounded-lg border border-[#2d3142]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Block Hash</span>
                    <span className="font-mono text-xs text-[#00f0ff] truncate ml-4 max-w-[200px] md:max-w-md">{block.block_hash}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Prev Hash</span>
                    <span className="font-mono text-xs text-slate-400 truncate ml-4 max-w-[200px] md:max-w-md">{block.previous_hash}</span>
                  </div>
                </div>
                
                {block.transaction_ids.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#2d3142]">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">Transactions in this block</span>
                    <div className="flex flex-wrap gap-2">
                      {block.transaction_ids.map(txId => (
                        <button 
                          key={txId}
                          onClick={() => navigate(`/transaction/${txId}`)}
                          className="px-2 py-1 bg-[#1e2130] hover:bg-[#2d3142] border border-[#3b82f6]/30 hover:border-[#00f0ff] text-[#60a5fa] hover:text-[#00f0ff] text-xs font-mono rounded cursor-pointer transition-colors"
                        >
                          {txId.substring(0, 16)}...
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {blocks.length === 0 && (
              <div className="text-center py-12 glass-card rounded-xl">
                <Box className="w-12 h-12 text-[#2d3142] mx-auto mb-3" />
                <p className="text-slate-500">No blocks have been mined yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Mining Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-xl p-6 sticky top-24">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center">
              <Server className="w-5 h-5 mr-2 text-[#8a2be2]" />
              Mine Block
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Participate in Proof-of-Work to secure the network and earn the block reward (50.0).
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Miner Address (Public Key)</label>
                <input
                  type="text"
                  value={minerAddress}
                  onChange={(e) => setMinerAddress(e.target.value)}
                  placeholder="e.g. 4655ec4f..."
                  className="w-full px-3 py-2.5 bg-[#0f111a] rounded-lg border border-[#2d3142] text-slate-300 font-mono text-sm focus:border-[#8a2be2] focus:ring-1 focus:ring-[#8a2be2] transition-colors outline-none"
                />
              </div>
              <button
                onClick={mineBlock}
                disabled={mining || !minerAddress}
                className="w-full py-3 bg-gradient-to-r from-[#8a2be2] to-[#3b82f6] text-white font-bold rounded-lg shadow-[0_0_15px_rgba(138,43,226,0.4)] disabled:opacity-50 disabled:shadow-none hover:opacity-90 transition-all flex justify-center items-center"
              >
                {mining ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mining (PoW)...
                  </>
                ) : 'Start Mining'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
