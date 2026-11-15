import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ShieldCheck, Smartphone, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { UserProfile, Wallet, Withdrawal } from '../types';

interface WithdrawalsViewProps {
  user: UserProfile;
}

export const WithdrawalsView: React.FC<WithdrawalsViewProps> = ({ user }) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [provider, setProvider] = useState<'MTN' | 'Airtel'>('MTN');
  const [phoneNumber, setPhoneNumber] = useState<string>(user.phone || '077');
  const [amount, setAmount] = useState<number>(20000);
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

      const q = query(collection(db, 'withdrawals'), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      setWithdrawals(snap.docs.map(d => ({ id: d.id, ...d.data() } as Withdrawal)));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'withdrawals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.uid]);

  const feeUgx = Math.round(amount * 0.10); // 10% transparent fee
  const netAmountUgx = amount - feeUgx;

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (amount < 5000) {
      setError('Minimum withdrawal amount is UGX 5,000.');
      return;
    }

    const currentBalance = wallet?.balanceUgx || 0;
    if (currentBalance < amount) {
      setError(`Insufficient wallet balance (UGX ${currentBalance.toLocaleString()}).`);
      return;
    }

    setActionLoading(true);
    try {
      const refCode = `WTH-${provider}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const now = new Date().toISOString();

      // 1. Create withdrawal request
      await addDoc(collection(db, 'withdrawals'), {
        userId: user.uid,
        userEmail: user.email,
        amountUgx: Number(amount),
        feeUgx,
        netAmountUgx,
        provider,
        phoneNumber,
        status: 'pending',
        reference: refCode,
        createdAt: now,
        updatedAt: now,
      });

      // 2. Deduct amount from wallet balance
      const walletRef = doc(db, 'wallets', user.uid);
      const currentWithdrawn = wallet?.totalWithdrawnUgx || 0;
      await updateDoc(walletRef, {
        balanceUgx: currentBalance - Number(amount),
        totalWithdrawnUgx: currentWithdrawn + Number(amount),
        updatedAt: now,
      });

      setSuccessMsg(`Withdrawal request for UGX ${amount.toLocaleString()} submitted successfully! 10% fee applied.`);
      setAmount(20000);
      await fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'withdrawals');
      setError('Failed to submit withdrawal request.');
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
              <ArrowUpRight className="w-4 h-4" /> Mobile Money Payouts
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Withdrawal Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Request instant Mobile Money payouts with a transparently disclosed 10% processing fee.
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
          
          {/* Withdrawal Request Form */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <h3 className="text-lg font-bold text-white">Request Payout</h3>
              <p className="text-xs text-slate-400">
                Transparent 10% fee applies to all withdrawal requests. Payouts are verified and processed securely.
              </p>

              <form onSubmit={handleWithdrawalRequest} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Select Provider
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setProvider('MTN')}
                      className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                        provider === 'MTN'
                          ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-yellow-500" /> MTN MoMo
                    </button>
                    <button
                      type="button"
                      onClick={() => setProvider('Airtel')}
                      className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                        provider === 'Airtel'
                          ? 'bg-red-500/10 border-red-500 text-red-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-red-500" /> Airtel Money
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Recipient Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="077XXXXXXXX"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Withdrawal Amount (UGX)
                  </label>
                  <input
                    type="number"
                    min={5000}
                    step={1000}
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Requested Amount</span>
                    <span className="font-mono text-white">UGX {amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Processing Fee (10%)</span>
                    <span className="font-mono text-red-400">- UGX {feeUgx.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-900 font-bold text-white">
                    <span>Net Payout to Mobile Money</span>
                    <span className="font-mono text-emerald-400 text-sm">UGX {netAmountUgx.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Request Withdrawal <ArrowUpRight className="w-4 h-4" /></>}
                </button>
              </form>
            </div>
          </div>

          {/* Withdrawals List */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <h3 className="text-lg font-bold text-white">Withdrawal History & Status</h3>

              {withdrawals.length === 0 ? (
                <p className="text-xs text-slate-500 py-12 text-center">
                  No withdrawal requests submitted yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {withdrawals.map(wth => (
                    <div key={wth.id} className="p-5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-white font-mono">{wth.provider} Money - {wth.phoneNumber}</span>
                          <div className="text-[10px] text-slate-500 mt-0.5">Ref: {wth.reference} · {new Date(wth.createdAt).toLocaleString()}</div>
                        </div>
                        <div>
                          <span className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-bold ${
                            wth.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            wth.status === 'approved' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            wth.status === 'processed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {wth.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-900 text-xs">
                        <span className="text-slate-400">Gross: <strong className="font-mono text-white">UGX {wth.amountUgx.toLocaleString()}</strong></span>
                        <span className="text-slate-400">Fee (10%): <strong className="font-mono text-red-400">UGX {wth.feeUgx.toLocaleString()}</strong></span>
                        <span className="text-slate-400">Net Payout: <strong className="font-mono text-emerald-400">UGX {wth.netAmountUgx.toLocaleString()}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
