import React from 'react';
import { ShieldAlert, Lock, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  onOpenAdminGate?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdminGate }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Risk Disclaimer Box */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 mb-12 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">
                Important Regulatory & Investment Risk Disclosure
              </h4>
              <p className="text-xs leading-relaxed text-slate-300">
                NsimbiRise operates as a secure Ugandan savings and investment management platform. 
                The <strong>8% return rate</strong> is an illustrative, non-guaranteed return assumption calculated over a standard <strong>48-hour maturity period</strong>. 
                All Mobile Money transactions (MTN and Airtel) are processed with strict server-side verification and atomic safety guarantees. 
                Withdrawals are subject to a transparently disclosed <strong>10% processing and network fee</strong>. 
                Past performance or illustrative return assumptions do not guarantee future financial yields. Please invest responsibly.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                ₦
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Nsimbi<span className="text-emerald-400">Rise</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Empowering Ugandans to make every shilling count through disciplined savings, transparent 48-hour investment cycles, and seamless mobile money infrastructure.
            </p>
            <div className="flex items-center gap-3 text-xs text-emerald-400 font-mono">
              <CheckCircle2 className="w-4 h-4" /> Bank-Grade Firestore Security
            </div>
          </div>

          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Platform Features
            </h5>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>MTN & Airtel Mobile Money</li>
              <li>Minimum UGX 5,000 Deposits</li>
              <li>48-Hour Investment Cycles</li>
              <li>8% Illustrative Yield Target</li>
              <li>Transparent 10% Withdrawal Fee</li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Security & Compliance
            </h5>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>Firebase Authentication & App Check</li>
              <li>Strict Firestore Access Rules</li>
              <li>Immutable Admin Audit Logs</li>
              <li>KYC & Phone Number Verification</li>
              <li>Real-time Server-side Verification</li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Kampala Operations
            </h5>
            <p className="text-xs text-slate-300 mb-2">
              NsimbiRise Financial Technologies Ltd.<br />
              Nakasero Road, Kampala, Uganda
            </p>
            <p className="text-xs text-emerald-400 font-mono">
              Support: support@nsimbirise.co.ug
            </p>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} NsimbiRise Technologies. All rights reserved.</p>
          <div className="flex items-center gap-6 mt-4 sm:mt-0">
            <span>Make Every Shilling Count</span>
            <span>·</span>
            <span>UGX Denominated</span>
            <span>·</span>
            <button
              onClick={onOpenAdminGate}
              className="flex items-center gap-1.5 text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
              title="Restricted Staff Portal"
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Staff Portal</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
