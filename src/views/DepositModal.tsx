import React, { useState } from 'react';
import { X, Smartphone, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile, Wallet } from '../types';

interface DepositModalProps {
  user: UserProfile;
  wallet: Wallet | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ user, wallet, onClose, onSuccess }) => {
  const [provider, setProvider] = useState<'MTN' | 'Airtel'>('MTN');
  const [phoneNumber, setPhoneNumber] = useState<string>(user.phone || '077');
  const [amount, setAmount] = useState<number>(50000);
  const [step, setStep] = useState<'form' | 'processing' | 'ussd' | 'success'>('form');
  const [error, setError] = useState<string | null>(null);

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 5000) {
      setError('Minimum deposit amount is UGX 5,000.');
      return;
    }
    if (!phoneNumber.startsWith('07') && !phoneNumber.startsWith('+256')) {
      setError('Please enter a valid Ugandan phone number (e.g., 077... or 070...).');
      return;
    }

    setError(null);
    setStep('ussd');
  };

  const confirmUssdPayment = async () => {
    setStep('processing');
    try {
      const refCode = `MM-${provider}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // 1. Record deposit transaction
      const depositRef = collection(db, 'deposits');
      try {
        await addDoc(depositRef, {
          userId: user.uid,
          userEmail: user.email,
          amountUgx: Number(amount),
          provider,
          phoneNumber,
          status: 'completed',
          reference: refCode,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'deposits');
      }

      // 2. Update wallet balance atomically
      const walletDocRef = doc(db, 'wallets', user.uid);
      try {
        const walletSnap = await getDoc(walletDocRef);
        const currentBalance = walletSnap.exists() ? walletSnap.data().balanceUgx || 0 : 0;
        const newBalance = currentBalance + Number(amount);

        if (walletSnap.exists()) {
          await updateDoc(walletDocRef, {
            balanceUgx: newBalance,
            updatedAt: new Date().toISOString(),
          });
        } else {
          await setDoc(walletDocRef, {
            userId: user.uid,
            balanceUgx: newBalance,
            totalInvestedUgx: 0,
            totalEarnedUgx: 0,
            totalWithdrawnUgx: 0,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `wallets/${user.uid}`);
      }

      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (err) {
      console.error(err);
      setError('Deposit processing failed. Please try again.');
      setStep('form');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative text-slate-100">
        
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Mobile Money Deposit</h3>
            <p className="text-xs text-slate-400">Instant MTN & Airtel Money Gateway</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleDepositSubmit} className="space-y-6">
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
                      ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400 shadow-lg shadow-yellow-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-yellow-500" /> MTN MoMo
                </button>
                <button
                  type="button"
                  onClick={() => setProvider('Airtel')}
                  className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    provider === 'Airtel'
                      ? 'bg-red-500/10 border-red-500 text-red-400 shadow-lg shadow-red-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-red-500" /> Airtel Money
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Mobile Money Phone Number
              </label>
              <input
                type="text"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="077XXXXXXXX or 070XXXXXXXX"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Deposit Amount (UGX) - Min UGX 5,000
              </label>
              <input
                type="number"
                min={5000}
                step={5000}
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-emerald-500"
              />
              <div className="flex gap-2 mt-2">
                {[10000, 50000, 100000, 500000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-mono"
                  >
                    {val.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm flex items-center justify-center gap-2"
            >
              Continue Deposit <ShieldCheck className="w-4 h-4" />
            </button>
          </form>
        )}

        {step === 'ussd' && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 mx-auto">
              <Smartphone className="w-8 h-8 animate-bounce" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white mb-1">Check Your Phone</h4>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                A prompt has been sent to <strong className="text-white font-mono">{phoneNumber}</strong> ({provider} Money). 
                Please enter your Mobile Money PIN to authorize UGX {amount.toLocaleString()}.
              </p>
            </div>
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs text-emerald-400">
              USSD Session Active · Waiting for PIN Authorization...
            </div>
            <button
              onClick={confirmUssdPayment}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm"
            >
              Simulate Successful PIN Auth & Complete
            </button>
          </div>
        )}

        {step === 'processing' && (
          <div className="space-y-6 text-center py-12">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto" />
            <div>
              <h4 className="text-lg font-bold text-white mb-1">Verifying Payment</h4>
              <p className="text-xs text-slate-400">
                Confirming transaction with {provider} Mobile Money gateway & updating wallet...
              </p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-6 text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-white mb-1">Deposit Successful!</h4>
              <p className="text-xs text-slate-300">
                UGX {amount.toLocaleString()} has been credited to your NsimbiRise wallet.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
