import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const TermsView: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        <div className="text-center space-y-4">
          <div className="text-xs font-semibold text-emerald-400 inline-flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Legal &amp; Disclosures
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Terms of Service &amp; Investment Risk Disclosures
          </h1>
          <p className="text-slate-400 text-sm">
            Last updated: November 2026 · Nsimbi Rise Financial Technologies Ltd. (Kampala, Uganda)
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-8 text-sm leading-relaxed text-slate-300">
          
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white">
              01. Platform Overview &amp; Scope
            </h3>
            <p>
              Nsimbi Rise (&ldquo;Make Every Shilling Count&rdquo;) is a digital savings and investment platform operating under the laws of the Republic of Uganda. 
              By accessing or using our platform, you agree to comply with our Terms of Service, KYC verification protocols, and Mobile Money deposit/payout policies.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white">
              02. 8% Return Assumption &amp; Daily Maturity Period
            </h3>
            <p>
              Investments deployed on Nsimbi Rise operate on structured <strong>daily (24-hour) maturity cycles</strong>. 
              The <strong>8% return rate</strong> is an illustrative, non-guaranteed return assumption calculated over the daily maturity cycle. 
              Past performance and illustrative targets do not constitute financial guarantees of future yields.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white">
              03. Mobile Money Deposits &amp; Server-Side Verification
            </h3>
            <p>
              All deposits must originate from verified MTN Mobile Money or Airtel Money accounts registered in Uganda. 
              Minimum starting amount is UGX 5,000. Transactions are subject to strict server-side verification and atomic database safeguards.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white">
              04. Daily Withdrawal Hours &amp; Transparent 10% Fee
            </h3>
            <p>
              Withdrawal requests are accepted daily between <strong>7:00 AM and 6:00 PM East Africa Time (EAT)</strong>. 
              To cover telecommunication gateway costs, network verification, and liquidity management, all withdrawal requests are subject to a transparently disclosed <strong>10% processing fee</strong> deducted automatically upon submission.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white">
              05. Security &amp; Account Integrity
            </h3>
            <p>
              Users are strictly responsible for maintaining account security, Firebase authentication credentials, and Mobile Money PIN confidentiality. 
              Nsimbi Rise enforces zero-trust Firestore rules and immutable administrative audit logs.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
