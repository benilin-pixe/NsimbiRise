import React, { useState, useEffect } from 'react';
import { Wallet as WalletIcon, ArrowDownRight, ArrowUpRight, TrendingUp, ShieldCheck, Plus, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { UserProfile, Wallet as WalletType, Deposit, Investment, Withdrawal } from '../types';
import { DepositModal } from './DepositModal';

interface WalletViewProps {
  user: UserProfile;
  onNavigate: (view: string) => void;
}

export const WalletView: React.FC<WalletViewProps> = ({ user, onNavigate }) => {
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [recentDeposits, setRecentDeposits] = useState<Deposit[]>([]);
  const [recentInvestments, setRecentInvestments] = useState<Investment[]>([]);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchWalletData = async () => {
    try {
      const walletRef = doc(db, 'wallets', user.uid);
      const walletSnap = await getDoc(walletRef);
      if (walletSnap.exists()) {
        setWallet(walletSnap.data() as WalletType);
      } else {
        setWallet({
          userId: user.uid,
          balanceUgx: 0,
          totalInvestedUgx: 0,
          totalEarnedUgx: 0,
          totalWithdrawnUgx: 0,
          updatedAt: new Date().toISOString(),
        });
      }

      // Fetch recent deposits
      const depQuery = query(collection(db, 'deposits'), where('userId', '==', user.uid), limit(5));
      const depSnap = await getDocs(depQuery);
      setRecentDeposits(depSnap.docs.map(d => ({ id: d.id, ...d.data() } as Deposit)));

      // Fetch recent investments
      const invQuery = query(collection(db, 'investments'), where('userId', '==', user.uid), limit(5));
      const invSnap = await getDocs(invQuery);
      setRecentInvestments(invSnap.docs.map(d => ({ id: d.id, ...d.data() } as Investment)));

    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `wallets/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [user.uid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400">
        <Clock className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const balance = wallet?.balanceUgx || 0;
  const invested = wallet?.totalInvestedUgx || 0;
  const earned = wallet?.totalEarnedUgx || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
              <ShieldCheck className="w-4 h-4" /> Secure UGX Wallet
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome back, {user.displayName || user.email.split('@')[0]}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage your savings, deploy investments into 48-hour cycles, and execute Mobile Money payouts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDepositModal(true)}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all text-xs sm:text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Deposit via Mobile Money
            </button>
            <button
              onClick={() => onNavigate('investments')}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all text-xs sm:text-sm flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Invest
            </button>
          </div>
        </div>

        {/* Balance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 text-emerald-400">
              <WalletIcon className="w-20 h-20" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Available Wallet Balance
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white mt-3">
              UGX {balance.toLocaleString()}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <CheckCircle2 className="w-4 h-4" /> Ready for withdrawal or investment
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 text-amber-400">
              <TrendingUp className="w-20 h-20" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Investments
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white mt-3">
              UGX {invested.toLocaleString()}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-amber-400 font-mono">
              <Clock className="w-4 h-4" /> 8% target yield across 48h cycles
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 text-blue-400">
              <ArrowUpRight className="w-20 h-20" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Yield Earned
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-400 mt-3">
              UGX {earned.toLocaleString()}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-blue-400 font-mono">
              <ShieldCheck className="w-4 h-4" /> Automatically credited
            </div>
          </div>

        </div>

        {/* Quick Actions & Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-emerald-400" /> Recent Deposits
            </h3>
            {recentDeposits.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No deposits found yet. Make your first deposit starting at UGX 5,000.</p>
            ) : (
              <div className="space-y-3">
                {recentDeposits.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
                    <div>
                      <div className="text-xs font-bold text-white font-mono">{d.provider} Money - {d.phoneNumber}</div>
                      <div className="text-[10px] text-slate-400">{new Date(d.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-emerald-400">+ UGX {d.amountUgx.toLocaleString()}</div>
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                        {d.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" /> Active Investments
            </h3>
            {recentInvestments.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No active investment cycles. Deploy funds to start earning 8% illustrative returns.</p>
            ) : (
              <div className="space-y-3">
                {recentInvestments.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
                    <div>
                      <div className="text-xs font-bold text-white font-mono">UGX {inv.principalUgx.toLocaleString()} Principal</div>
                      <div className="text-[10px] text-slate-400">Expected: UGX {inv.expectedReturnUgx.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] uppercase px-2.5 py-1 rounded-full font-semibold ${
                        inv.status === 'active' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {showDepositModal && (
        <DepositModal
          user={user}
          wallet={wallet}
          onClose={() => setShowDepositModal(false)}
          onSuccess={fetchWalletData}
        />
      )}
    </div>
  );
};
