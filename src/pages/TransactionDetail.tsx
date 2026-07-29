import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { api } from '../services/api';
import type { Transaction } from '../types/ledger';
import { Hash, ArrowLeft, CheckCircle2, Clock, Box, ShieldCheck, FileCheck2 } from 'lucide-react';

export function TransactionDetail() {
  const { hash } = useParams<{ hash: string }>();
  const navigate = useNavigate();
  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTx = async () => {
      try {
        const response = await api.get<Transaction>(`/transactions/${hash}`);
        setTx(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Transaction not found');
      } finally {
        setLoading(false);
      }
    };
    if (hash) fetchTx();
  }, [hash]);

  if (loading) return <div className="p-8 text-center text-slate-400">Searching Ledger...</div>;
  
  if (error || !tx) {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <button onClick={() => navigate(-1)} className="text-[#00f0ff] hover:underline flex items-center mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </button>
        <div className="glass-panel rounded-2xl p-12 text-center border-red-500/30">
          <h2 className="text-2xl font-bold text-white mb-2">Not Found</h2>
          <p className="text-slate-400 mb-6">{error || 'This transaction does not exist on the network.'}</p>
          <p className="font-mono text-sm text-slate-500 break-all bg-[#0f111a] p-3 rounded-lg border border-[#2d3142] inline-block">{hash}</p>
        </div>
      </div>
    );
  }

  const isNotarization = tx.payload !== null && tx.payload !== undefined && tx.amount === 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="text-[#00f0ff] hover:underline flex items-center mb-2">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </button>

      <div className="glass-panel rounded-2xl overflow-hidden neon-border">
        {/* Header */}
        <div className="bg-[#1e2130]/80 px-8 py-6 border-b border-[#2d3142] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl border ${isNotarization ? 'bg-purple-900/30 border-purple-500/50 text-purple-400' : 'bg-[#00f0ff]/10 border-[#00f0ff]/30 text-[#00f0ff]'}`}>
              {isNotarization ? <FileCheck2 className="w-8 h-8" /> : <Hash className="w-8 h-8" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center">
                {isNotarization ? 'Document Notarization' : 'Transaction Details'}
                {tx.status === 'CONFIRMED' && <CheckCircle2 className="w-5 h-5 ml-3 text-green-500" />}
              </h1>
              <p className="text-slate-400 text-sm flex items-center mt-1">
                <Clock className="w-4 h-4 mr-1" />
                {new Date(tx.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg border font-bold ${tx.status === 'CONFIRMED' ? 'bg-green-900/30 border-green-500/50 text-green-400' : 'bg-yellow-900/30 border-yellow-500/50 text-yellow-400'}`}>
            {tx.status}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Main Hash Info */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Transaction Hash</h3>
            <div className="bg-[#0f111a] p-4 rounded-xl border border-[#2d3142] font-mono text-sm text-[#00f0ff] break-all flex items-center shadow-inner">
              {tx.tx_hash}
            </div>
          </div>

          {/* Notarization Payload Highlight */}
          {isNotarization && (
            <div className="bg-gradient-to-r from-purple-900/20 to-[#0f111a] border border-purple-500/30 p-6 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <ShieldCheck className="w-32 h-32 text-purple-500" />
              </div>
              <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2" /> Proof of Existence (Payload)
              </h3>
              <p className="text-white font-mono bg-[#0f111a]/80 p-4 rounded-lg border border-purple-500/20 break-all shadow-inner">
                {tx.payload}
              </p>
              <p className="text-xs text-slate-400 mt-3">This cryptographic hash is permanently anchored to the VeriLedger blockchain, proving its existence at {new Date(tx.timestamp).toLocaleString()}.</p>
            </div>
          )}

          {/* Standard Payload Info (If not purely notarization but has payload) */}
          {!isNotarization && tx.payload && (
             <div className="space-y-2">
               <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Attached Payload</h3>
               <div className="bg-[#0f111a] p-4 rounded-xl border border-[#2d3142] font-mono text-sm text-slate-300 break-all shadow-inner">
                 {tx.payload}
               </div>
             </div>
          )}

          {/* Transfer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Sender</h3>
              <div className="bg-[#0f111a] p-4 rounded-xl border border-[#2d3142] font-mono text-xs text-slate-300 break-all min-h-[5rem]">
                {tx.sender_address}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Receiver</h3>
              <div className="bg-[#0f111a] p-4 rounded-xl border border-[#2d3142] font-mono text-xs text-slate-300 break-all min-h-[5rem]">
                {tx.receiver_address}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[#2d3142]">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Value</h3>
              <p className="text-2xl font-bold text-white">{tx.amount.toFixed(8)}</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Fee</h3>
              <p className="text-2xl font-bold text-slate-300">{tx.fee.toFixed(8)}</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Block Included</h3>
              {tx.block_id ? (
                <p className="text-md font-mono font-medium text-[#00f0ff] flex items-center">
                  <Box className="w-4 h-4 mr-2" /> {tx.block_id.substring(0, 12)}...
                </p>
              ) : (
                <p className="text-md font-medium text-yellow-500 flex items-center">
                   Pending in Mempool
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
