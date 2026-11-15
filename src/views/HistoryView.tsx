import React, { useState, useEffect } from 'react';
import { History, Smartphone, TrendingUp, ArrowUpRight, Loader2, AlertCircle } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { UserProfile, Deposit, Investment, Withdrawal } from '../types';

interface HistoryViewProps {
  user: UserProfile;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ user }) => {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'deposits' | 'investments' | 'withdrawals'>('all');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [depSnap, invSnap, wthSnap] = await Promise.all([
          getDocs(query(collection(db, 'deposits'), where('userId', '==', user.uid))),
          getDocs(query(collection(db, 'investments'), where('userId', '==', user.uid))),
          getDocs(query(collection(db, 'withdrawals'), where('userId', '==', user.uid))),
        ]);
        setDeposits(depSnap.docs.map(d => ({ id: d.id, ...d.data() } as Deposit)));
        setInvestments(invSnap.docs.map(d => ({ id: d.id, ...d.data() } as Investment)));
        setWithdrawals(wthSnap.docs.map(d => ({ id: d.id, ...d.data() } as Withdrawal)));
      } catch (err) {
        console.error('Failed to load transaction history:', err);
        setError('Unable to load transaction history right now.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user.uid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
          <div>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-2">
              <History className="w-4 h-4" /> Nsimbi Rise · Comprehensive Ledger
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Transaction History
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Complete audit trail of all Mobile Money deposits, daily investments, and withdrawal payouts.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${activeTab === 'all' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('deposits')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${activeTab === 'deposits' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              Deposits
            </button>
            <button
              onClick={() => setActiveTab('investments')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${activeTab === 'investments' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              Investments
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${activeTab === 'withdrawals' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              Withdrawals
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Ledger Content */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          
          {(activeTab === 'all' || activeTab === 'deposits') && deposits.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Deposits</h4>
              {deposits.map(d => (
                <div key={d.id} className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-400">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white font-mono">{d.provider || 'MoMo'} Deposit - {d.phoneNumber || '—'}</div>
                      <div className="text-[10px] text-slate-400">Ref: {d.reference || '—'} · {d.createdAt ? new Date(d.createdAt).toLocaleString() : '—'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono tabular-nums font-bold text-emerald-400">+ UGX {Number(d.amountUgx ?? 0).toLocaleString()}</div>
                    <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold">{d.status || 'completed'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'investments') && investments.length > 0 && (
            <div className="space-y-3 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Investments</h4>
              {investments.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white font-mono tabular-nums">{inv.maturityHours || 24}h Cycle Principal: UGX {Number(inv.principalUgx ?? 0).toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">Expected: UGX {Number(inv.expectedReturnUgx ?? 0).toLocaleString()} · {inv.startDate ? new Date(inv.startDate).toLocaleString() : '—'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono tabular-nums font-bold text-white">UGX {Number(inv.expectedReturnUgx ?? 0).toLocaleString()}</div>
                    <span className="text-[10px] uppercase font-mono text-amber-400 font-semibold">{inv.status || 'active'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'withdrawals') && withdrawals.length > 0 && (
            <div className="space-y-3 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Withdrawals</h4>
              {withdrawals.map(wth => (
                <div key={wth.id} className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white font-mono">{wth.provider || 'MoMo'} Payout - {wth.phoneNumber || '—'}</div>
                      <div className="text-[10px] text-slate-400">Fee: UGX {Number(wth.feeUgx ?? 0).toLocaleString()} (10%) · {wth.createdAt ? new Date(wth.createdAt).toLocaleString() : '—'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono tabular-nums font-bold text-red-400">- UGX {Number(wth.netAmountUgx ?? 0).toLocaleString()}</div>
                    <span className="text-[10px] uppercase font-mono text-blue-400 font-semibold">{wth.status || 'pending'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {deposits.length === 0 && investments.length === 0 && withdrawals.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <History className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>No transaction history recorded yet.</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
