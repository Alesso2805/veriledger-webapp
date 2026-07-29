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
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-3">
          <Globe className="h-8 w-8 text-blue-500" />
          P2P Network
        </h1>
        <p className="mt-2 text-slate-600">Connect to other nodes to synchronize the blockchain</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-slate-400" />
            Add Peer Node
          </h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Node URL</label>
              <input
                type="url"
                required
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="http://192.168.1.100:8000"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !newUrl}
              className="w-full bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Connect to Peer'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <NetworkIcon className="h-5 w-5 text-slate-400" />
              Consensus Protocol
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Polls all connected peers. If a valid chain is found that is longer than ours, it will replace our local chain.
            </p>
            <button
              onClick={handleResolve}
              disabled={resolving || nodes.length === 0}
              className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${resolving ? 'animate-spin' : ''}`} />
              {resolving ? 'Syncing Network...' : 'Resolve Conflicts'}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Server className="h-5 w-5 text-slate-400" />
            Connected Peers ({nodes.length})
          </h2>
          {nodes.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No peers connected yet.<br />Add a node to join the network.
            </div>
          ) : (
            <ul className="space-y-3">
              {nodes.map(node => (
                <li key={node.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex justify-between items-center">
                  <span className="font-mono text-sm">{node.url}</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
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
