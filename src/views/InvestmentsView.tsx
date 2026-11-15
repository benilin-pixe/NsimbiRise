import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, CheckCircle2, ShieldCheck, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { UserProfile, Wallet, Investment } from '../types';

interface InvestmentsViewProps {
  user: UserProfile;
}

export const InvestmentsView: React.FC<InvestmentsViewProps> = ({ user }) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [principal, setPrincipal] = useState<number>(50000);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const walletSnap = await getDoc(doc(db, 'wallets', user.uid));
      if (walletSnap.exists()) {
        setWallet(walletSnap.data() as Wallet);
      }

      const q = query(collection(db, 'investments'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      setInvestments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Investment)));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'investments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.uid]);

  const handleCreateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (principal < 5000) {
      setError('Minimum investment amount is UGX 5,000.');
      return;
    }

    const currentBalance = wallet?.balanceUgx || 0;
    if (currentBalance < principal) {
      setError(`Insufficient wallet balance (UGX ${currentBalance.toLocaleString()}). Please deposit via Mobile Money first.`);
      return;
    }

    setActionLoading(true);
    try {
      const now = new Date();
      const maturityDate = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours
      const expectedReturn = Math.round(principal * 1.08); // 8% illustrative return

      // 1. Create investment document
      await addDoc(collection(db, 'investments'), {
        userId: user.uid,
        userEmail: user.email,
        principalUgx: Number(principal),
        expectedReturnUgx: expectedReturn,
        returnRate: 0.08,
        maturityHours: 48,
        status: 'active',
        startDate: now.toISOString(),
        maturityDate: maturityDate.toISOString(),
        createdAt: now.toISOString(),
      });

      // 2. Deduct from wallet balance & add to total invested
      const walletRef = doc(db, 'wallets', user.uid);
      const newBalance = currentBalance - Number(principal);
      const currentInvested = wallet?.totalInvestedUgx || 0;
      
      await updateDoc(walletRef, {
        balanceUgx: newBalance,
        totalInvestedUgx: currentInvested + Number(principal),
        updatedAt: now.toISOString(),
      });

      setSuccessMsg(`Successfully deployed UGX ${principal.toLocaleString()} into a 48-hour investment cycle!`);
      await fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'investments');
      setError('Failed to create investment. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaimMatured = async (inv: Investment) => {
    setActionLoading(true);
    setError(null);
    try {
      const now = new Date();
      // 1. Update investment status to withdrawn
      await updateDoc(doc(db, 'investments', inv.id), {
        status: 'withdrawn',
      });

      // 2. Credit expected return back to wallet balance
      const walletRef = doc(db, 'wallets', user.uid);
      const walletSnap = await getDoc(walletRef);
      const currentBalance = walletSnap.exists() ? walletSnap.data().balanceUgx || 0 : 0;
      const currentEarned = walletSnap.exists() ? walletSnap.data().totalEarnedUgx || 0 : 0;
      const profit = inv.expectedReturnUgx - inv.principalUgx;

      await updateDoc(walletRef, {
        balanceUgx: currentBalance + inv.expectedReturnUgx,
        totalEarnedUgx: currentEarned + profit,
        updatedAt: now.toISOString(),
      });

      setSuccessMsg(`Claimed UGX ${inv.expectedReturnUgx.toLocaleString()} to your wallet!`);
      await fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `investments/${inv.id}`);
      setError('Failed to claim matured investment.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const walletBalance = wallet?.balanceUgx || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
              <TrendingUp className="w-4 h-4" /> 48-Hour Investment Cycles
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Investment Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Deploy your capital starting from UGX 5,000. Target 8% illustrative return over 48 hours.
            </p>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Available Balance</span>
            <span className="text-lg font-mono font-bold text-emerald-400">UGX {walletBalance.toLocaleString()}</span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* New Investment Form */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <h3 className="text-lg font-bold text-white">Deploy New Investment</h3>
              <p className="text-xs text-slate-400">
                Minimum principal amount is UGX 5,000. Maturity period is exactly 48 hours with 8% illustrative return.
              </p>

              <form onSubmit={handleCreateInvestment} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Principal Amount (UGX)
                  </label>
                  <input
                    type="number"
                    min={5000}
                    step={5000}
                    required
                    value={principal}
                    onChange={(e) => setPrincipal(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex gap-2 mt-2">
                    {[10000, 50000, 200000, 1000000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPrincipal(val)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-mono"
                      >
                        {val.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Maturity Duration</span>
                    <span className="font-mono text-white">48 Hours</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Illustrative Return Rate</span>
                    <span className="font-mono text-emerald-400 font-bold">8.0%</span>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-900 font-bold text-white">
                    <span>Expected Payout</span>
                    <span className="font-mono text-emerald-400 text-sm">UGX {Math.round(principal * 1.08).toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Deploy Investment Cycle <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            </div>
          </div>

          {/* Investments List */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <h3 className="text-lg font-bold text-white">Your Investment Portfolio</h3>

              {investments.length === 0 ? (
                <p className="text-xs text-slate-500 py-12 text-center">
                  No investments deployed yet. Use the form on the left to start your first 48-hour cycle.
                </p>
              ) : (
                <div className="space-y-4">
                  {investments.map(inv => {
                    const isMatured = new Date().getTime() >= new Date(inv.maturityDate).getTime();
                    const status = inv.status === 'withdrawn' ? 'withdrawn' : (isMatured ? 'matured' : 'active');

                    return (
                      <div key={inv.id} className="p-5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs text-slate-400">Principal: <strong className="font-mono text-white">UGX {inv.principalUgx.toLocaleString()}</strong></span>
                            <div className="text-[10px] text-slate-500 mt-0.5">Started: {new Date(inv.startDate).toLocaleString()}</div>
                          </div>
                          <div>
                            <span className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-bold ${
                              status === 'active' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              status === 'matured' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-900">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Expected Return (8%)</span>
                            <span className="font-mono text-sm font-bold text-emerald-400">UGX {inv.expectedReturnUgx.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Maturity Time</span>
                            <span className="font-mono text-xs text-slate-300">{new Date(inv.maturityDate).toLocaleString()}</span>
                          </div>
                          <div>
                            {status === 'active' && (
                              <div className="text-[11px] text-amber-400 font-mono flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 animate-pulse" /> In Progress
                              </div>
                            )}
                            {status === 'matured' && (
                              <button
                                onClick={() => handleClaimMatured(inv)}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20"
                              >
                                Claim to Wallet
                              </button>
                            )}
                            {status === 'withdrawn' && (
                              <div className="text-[11px] text-slate-500 font-mono">
                                Claimed & Credited
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
