import React, { useState, useEffect } from 'react';
import {
  Wallet as WalletIcon,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Plus,
  Clock,
  CheckCircle2,
  Calculator,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { UserProfile, Wallet as WalletType, Deposit, Investment } from '../types';
import { DepositModal } from './DepositModal';

interface WalletViewProps {
  user: UserProfile;
  onNavigate: (view: string) => void;
}

const ANNUAL_ILLUSTRATIVE_RATE = 0.08;

const formatProjectedUgx = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return '0';
  return value.toLocaleString('en-UG', {
    minimumFractionDigits: value < 100 ? 2 : 0,
    maximumFractionDigits: 2,
  });
};

const safeFormatDate = (iso?: string): string => {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

export const WalletView: React.FC<WalletViewProps> = ({ user, onNavigate }) => {
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [recentDeposits, setRecentDeposits] = useState<Deposit[]>([]);
  const [recentInvestments, setRecentInvestments] = useState<Investment[]>([]);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [calcInput, setCalcInput] = useState<string>('50000');

  const fetchWalletData = async () => {
    setLoadError(null);
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

      const [depResult, invResult] = await Promise.allSettled([
        getDocs(query(collection(db, 'deposits'), where('userId', '==', user.uid), limit(5))),
        getDocs(query(collection(db, 'investments'), where('userId', '==', user.uid), limit(5))),
      ]);

      if (depResult.status === 'fulfilled') {
        setRecentDeposits(depResult.value.docs.map((d) => ({ id: d.id, ...d.data() } as Deposit)));
      }
      if (invResult.status === 'fulfilled') {
        setRecentInvestments(invResult.value.docs.map((d) => ({ id: d.id, ...d.data() } as Investment)));
      }
    } catch (err) {
      console.error('Wallet fetch error:', err);
      setLoadError('Unable to refresh wallet records right now. Showing latest available view.');
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

  const balance = Number(wallet?.balanceUgx ?? 0);
  const invested = Number(wallet?.totalInvestedUgx ?? 0);
  const earned = Number(wallet?.totalEarnedUgx ?? 0);
  const userName = user.displayName || (user.email ? user.email.split('@')[0] : 'Member');

  const parsedCalc = Number(calcInput);
  const calcAmount = Number.isFinite(parsedCalc) && parsedCalc > 0 ? parsedCalc : 0;
  const projectedDailyReturn = (calcAmount * ANNUAL_ILLUSTRATIVE_RATE) / 365;
  const projectedMonthlyReturn = projectedDailyReturn * 30;
  const projectedAnnualReturn = calcAmount * ANNUAL_ILLUSTRATIVE_RATE;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
          <div>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-2">
              <ShieldCheck className="w-4 h-4" /> Nsimbi Rise · Secure UGX Wallet
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome back, {userName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage your savings, deploy investments into daily (24-hour) cycles, and withdraw between 7:00 AM and 6:00 PM EAT.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowDepositModal(true)}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Deposit via Mobile Money
            </button>
            <button
              onClick={() => onNavigate('investments')}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Invest
            </button>
            <button
              onClick={() => onNavigate('withdrawals')}
              className="px-5 py-3 bg-slate-950 border border-slate-700 hover:border-cyan-500 text-white font-bold rounded-2xl transition-all text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap"
            >
              <ArrowUpRight className="w-4 h-4 text-cyan-400" /> Withdraw
            </button>
          </div>
        </div>

        {loadError && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loadError}</span>
            </div>
            <button
              type="button"
              onClick={fetchWalletData}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Balance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 text-emerald-400">
              <WalletIcon className="w-20 h-20" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Available Wallet Balance
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-white mt-3">
              UGX {balance.toLocaleString()}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <CheckCircle2 className="w-4 h-4" /> Withdrawals 7:00 AM – 6:00 PM EAT
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 text-amber-400">
              <TrendingUp className="w-20 h-20" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Investments
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-white mt-3">
              UGX {invested.toLocaleString()}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-amber-400 font-mono">
              <Clock className="w-4 h-4" /> 8% target yield across daily cycles
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 text-blue-400">
              <ArrowUpRight className="w-20 h-20" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Yield Earned
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-emerald-400 mt-3">
              UGX {earned.toLocaleString()}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-blue-400 font-mono">
              <ShieldCheck className="w-4 h-4" /> Automatically credited
            </div>
          </div>

        </div>

        {/* Interactive Daily Returns Calculator Widget (8% Annual Illustrative Rate) */}
        <section
          aria-label="Daily Returns Calculator"
          className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                <Calculator className="w-4 h-4" />
                <span>Projected Daily Return Calculator · 8% Annual Illustrative Rate</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Estimate Your Projected Daily Returns
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('investments')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl text-xs transition-colors flex items-center gap-2 self-start sm:self-auto whitespace-nowrap"
            >
              Go to Investments <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div>
                <label
                  htmlFor="wallet-return-calc-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2"
                >
                  Enter Amount (UGX)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                    UGX
                  </span>
                  <input
                    id="wallet-return-calc-input"
                    type="number"
                    min={0}
                    step={1000}
                    inputMode="numeric"
                    value={calcInput}
                    onChange={(e) => setCalcInput(e.target.value)}
                    placeholder="50000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-14 pr-4 py-3 text-white font-mono tabular-nums text-lg focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[10000, 50000, 200000, 1000000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCalcInput(String(preset))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono tabular-nums transition-colors ${
                      calcAmount === preset
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {preset >= 1000000 ? '1M' : `${preset / 1000}k`}
                  </button>
                ))}
                {balance >= 5000 && (
                  <button
                    type="button"
                    onClick={() => setCalcInput(String(Math.floor(balance)))}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                  >
                    Use Balance
                  </button>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6 lg:border-l lg:border-slate-800/80 lg:pl-8">
              <div className="space-y-1">
                <div className="text-xs text-slate-400">Projected Daily Return</div>
                <div className="text-2xl font-extrabold font-mono tabular-nums text-emerald-400">
                  + UGX {formatProjectedUgx(projectedDailyReturn)}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Per day (8% ÷ 365)
                </div>
              </div>

              <div className="space-y-1 sm:border-l sm:border-slate-800/80 sm:pl-6">
                <div className="text-xs text-slate-400">Projected 30-Day Return</div>
                <div className="text-2xl font-extrabold font-mono tabular-nums text-white">
                  + UGX {formatProjectedUgx(projectedMonthlyReturn)}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  30 days cumulative
                </div>
              </div>

              <div className="space-y-1 sm:border-l sm:border-slate-800/80 sm:pl-6">
                <div className="text-xs text-slate-400">Projected Annual (8%)</div>
                <div className="text-2xl font-extrabold font-mono tabular-nums text-cyan-300">
                  + UGX {formatProjectedUgx(projectedAnnualReturn)}
                </div>
                <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                  Total: UGX {formatProjectedUgx(calcAmount + projectedAnnualReturn)}
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
            Estimates are calculated from the 8% annual illustrative rate divided across 365 days (`Amount × 8% ÷ 365`). Figures are illustrative and not guaranteed.
          </p>
        </section>

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
                      <div className="text-xs font-bold text-white font-mono">{d.provider || 'MoMo'} Money - {d.phoneNumber || '—'}</div>
                      <div className="text-[10px] text-slate-400">{safeFormatDate(d.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono tabular-nums font-bold text-emerald-400">+ UGX {Number(d.amountUgx ?? 0).toLocaleString()}</div>
                      <span className="text-[10px] uppercase font-mono text-emerald-400">
                        {d.status || 'completed'}
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
              <p className="text-xs text-slate-500 py-4">No active investment cycles. Deploy funds to start earning 8% illustrative daily returns.</p>
            ) : (
              <div className="space-y-3">
                {recentInvestments.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80">
                    <div>
                      <div className="text-xs font-bold text-white font-mono tabular-nums">UGX {Number(inv.principalUgx ?? 0).toLocaleString()} Principal</div>
                      <div className="text-[10px] text-slate-400">Expected: UGX {Number(inv.expectedReturnUgx ?? 0).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] uppercase font-mono font-semibold ${
                        inv.status === 'active' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {inv.status || 'active'}
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
