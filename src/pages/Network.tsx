import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Globe, RefreshCw, Server, Plus, Network as NetworkIcon } from 'lucide-react';

interface Node {
  id: string;
  url: string;
  status: string;
}

export function Network() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const fetchNodes = async () => {
    try {
      const response = await api.get('/nodes');
      setNodes(response.data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.post('/nodes/register', { url: newUrl });
      setNewUrl('');
      setMessage({ text: 'Node registered successfully', type: 'success' });
      fetchNodes();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.detail || 'Failed to register node', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    setResolving(true);
    setMessage(null);
    try {
      const response = await api.post('/nodes/resolve');
      setMessage({ 
        text: response.data.replaced ? 'Chain replaced with a longer one from the network!' : 'Our chain is already authoritative (longest).', 
        type: 'success' 
      });
    } catch (err: any) {
      setMessage({ text: 'Failed to resolve conflicts', type: 'error' });
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="glass-panel rounded-2xl p-8 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
            <Globe className="h-8 w-8 text-[#00f0ff]" />
            P2P Network
          </h1>
          <p className="mt-3 text-slate-400">Connect to other nodes to synchronize and secure the blockchain network.</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${message.type === 'error' ? 'bg-red-900/30 text-red-400 border-red-500/50' : 'bg-green-900/30 text-green-400 border-green-500/50'}`}>
          {message.text}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass-panel rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Plus className="h-5 w-5 text-[#3b82f6]" />
            Add Peer Node
          </h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Node URL</label>
              <input
                type="url"
                required
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="http://192.168.1.100:8000"
                className="w-full px-4 py-3 bg-[#0f111a] border border-[#2d3142] text-white rounded-lg focus:ring-1 focus:ring-[#00f0ff] focus:border-[#00f0ff] outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !newUrl}
              className="w-full bg-[#1e2130] text-[#00f0ff] border border-[#00f0ff]/30 py-3 rounded-lg font-bold hover:bg-[#00f0ff] hover:text-[#0f111a] disabled:opacity-50 transition-all shadow-[0_0_10px_rgba(0,240,255,0.2)]"
            >
              {loading ? 'Adding...' : 'Connect to Peer'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-[#2d3142]">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <NetworkIcon className="h-5 w-5 text-purple-400" />
              Consensus Protocol
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Polls all connected peers. If a valid chain is found that is longer than ours, it will securely replace our local chain.
            </p>
            <button
              onClick={handleResolve}
              disabled={resolving || nodes.length === 0}
              className="w-full bg-gradient-to-r from-[#8a2be2] to-[#3b82f6] text-white py-3 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(138,43,226,0.3)] transition-all"
            >
              <RefreshCw className={`h-5 w-5 ${resolving ? 'animate-spin' : ''}`} />
              {resolving ? 'Syncing Network...' : 'Resolve Conflicts'}
            </button>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Server className="h-5 w-5 text-green-400" />
            Connected Peers ({nodes.length})
          </h2>
          {nodes.length === 0 ? (
            <div className="text-center py-12 bg-[#0f111a] rounded-xl border border-[#2d3142]">
              <Server className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500">No peers connected yet.<br />Add a node to join the network.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {nodes.map(node => (
                <li key={node.id} className="p-4 bg-[#0f111a] border border-[#2d3142] rounded-xl flex justify-between items-center group hover:border-[#3b82f6]/50 transition-colors">
                  <span className="font-mono text-sm text-slate-300 group-hover:text-white transition-colors">{node.url}</span>
                  <span className="px-2.5 py-1 bg-green-900/30 border border-green-500/30 text-green-400 text-xs font-bold rounded-lg uppercase tracking-wider">
                    {node.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
