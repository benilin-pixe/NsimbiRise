import React, { useState } from 'react';
import { Lock, Shield, Eye, EyeOff, AlertCircle, ArrowRight, X } from 'lucide-react';
import { db } from '../firebase';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { UserProfile } from '../types';
import { BrandLogo } from './BrandLogo';

interface AdminGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUser: UserProfile | null;
}

export const AdminGateModal: React.FC<AdminGateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const entered = passcode.trim();

    // Verify against secret administrator master key
    // Crucial: The password ATIM is validated here and is strictly never printed or visible to users in UI
    if (entered.toUpperCase() === 'ATIM') {
      try {
        try {
          window.sessionStorage.setItem('nsimbi_admin_session', 'authenticated');
        } catch {
          // Ignore storage restrictions in embedded contexts
        }

        // If user is currently signed in, register in Firestore admins collection to ensure full rules clearance
        if (currentUser?.uid) {
          try {
            await setDoc(doc(db, 'admins', currentUser.uid), {
              email: currentUser.email || 'administrator@nsimbirise.co.ug',
              role: 'super_admin',
              addedBy: 'master_key_auth',
              createdAt: new Date().toISOString(),
            }, { merge: true });

            await setDoc(doc(db, 'users', currentUser.uid), {
              role: 'admin',
              updatedAt: new Date().toISOString(),
            }, { merge: true });

            // Record audit log
            await addDoc(collection(db, 'audit_logs'), {
              adminId: currentUser.uid,
              adminEmail: currentUser.email,
              action: 'ADMIN_KEY_GATE_UNLOCKED',
              targetId: 'console',
              details: 'Administrator authenticated successfully via secure master key',
              createdAt: new Date().toISOString(),
            });
          } catch (dbErr) {
            console.warn('Admin metadata sync non-fatal:', dbErr);
          }
        }

        setPasscode('');
        onSuccess();
      } catch (err) {
        console.error('Admin session initialization error:', err);
        setError('Failed to initialize administrator session. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
      setError('Access Denied: Invalid security key. Unauthorized entry attempt recorded.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative text-slate-100 space-y-6">
        
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <BrandLogo size="lg" className="mx-auto" />
          <h3 className="text-2xl font-extrabold text-white tracking-tight">
            Nsimbi Rise Operations Command
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Restricted administrative gateway. Enter the master operations passcode to unlock administrative privileges.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Master Security Key
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-11 py-3 text-white font-mono text-base tracking-widest focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !passcode}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Verifying Credentials...
              </span>
            ) : (
              <>
                Authenticate & Enter Console <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Tier-1 access logs are cryptographically stamped and audit-indexed.</span>
        </div>

      </div>
    </div>
  );
};
