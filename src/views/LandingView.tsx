import React, { useState } from 'react';
import { ShieldCheck, Smartphone, ArrowRight, TrendingUp, Wallet, CheckCircle, Lock, Zap } from 'lucide-react';

interface LandingViewProps {
  onGetStarted: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onGetStarted }) => {
  const [calcAmount, setCalcAmount] = useState<number>(50000);
  
  // 8% illustrative return over 48 hours
  const projectedReturn = Math.round(calcAmount * 1.08);
  const profitUgx = projectedReturn - calcAmount;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 lg:pt-32 lg:pb-40 border-b border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-slate-950/80 to-slate-950 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide">
                <Zap className="w-3.5 h-3.5" /> Official MTN & Airtel Mobile Money Gateway
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] text-balance">
                Make Every <span className="text-emerald-400">Shilling Count</span> in Uganda.
              </h1>
              
              <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
                NsimbiRise is Uganda&apos;s premier secure savings and investment platform. 
                Grow your capital with structured 48-hour investment cycles, transparent 8% illustrative returns, 
                and instant Mobile Money deposits & payouts.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <button
                  onClick={onGetStarted}
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 text-base"
                >
                  Start Saving Now (Min UGX 5,000) <ArrowRight className="w-5 h-5" />
                </button>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 px-4 py-3 bg-slate-900/80 rounded-2xl border border-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Firebase Secured & App Check Verified
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-900">
                <div>
                  <div className="text-2xl font-bold font-mono text-white">UGX 5,000</div>
                  <div className="text-xs text-slate-400 mt-0.5">Minimum Starting Capital</div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-emerald-400">8% Target</div>
                  <div className="text-xs text-slate-400 mt-0.5">Illustrative Yield Assumption</div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-white">48 Hours</div>
                  <div className="text-xs text-slate-400 mt-0.5">Standard Maturity Period</div>
                </div>
              </div>
            </div>

            {/* Interactive Calculator Card */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-emerald-500 text-slate-950 font-bold text-xs uppercase px-3 py-1 rounded-full shadow-md">
                  Yield Simulator
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">Simulate Your Investment</h3>
                <p className="text-xs text-slate-400 mb-6">
                  Calculate potential returns with our 48-hour investment cycle structure (8% illustrative return).
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Investment Principal (UGX)
                    </label>
                    <input
                      type="number"
                      min={5000}
                      step={5000}
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(Math.max(5000, Number(e.target.value)))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex justify-between items-center mt-2 text-[11px] text-slate-500">
                      <span>Min: UGX 5,000</span>
                      <div className="flex gap-2">
                        <button onClick={() => setCalcAmount(20000)} className="hover:text-emerald-400">20k</button>
                        <button onClick={() => setCalcAmount(50000)} className="hover:text-emerald-400">50k</button>
                        <button onClick={() => setCalcAmount(200000)} className="hover:text-emerald-400">200k</button>
                        <button onClick={() => setCalcAmount(1000000)} className="hover:text-emerald-400">1M</button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800/80 space-y-3">
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>Principal Amount</span>
                      <span className="font-mono text-white">UGX {calcAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>Maturity Period</span>
                      <span className="font-mono text-white">48 Hours</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-emerald-400 font-semibold pt-2 border-t border-slate-900">
                      <span>Projected Earnings (8%)</span>
                      <span className="font-mono text-lg">+ UGX {profitUgx.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-white pt-2 border-t border-slate-900">
                      <span>Total Projected Payout</span>
                      <span className="font-mono text-xl text-emerald-400">UGX {projectedReturn.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={onGetStarted}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm"
                  >
                    Invest Now via Mobile Money <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-[10px] text-slate-500 text-center">
                    *8% return is an illustrative return assumption. Terms & conditions apply.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features & Mobile Money Integration */}
      <section className="py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
              Engineered for Ugandan Mobile Money & Security
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              NsimbiRise integrates directly with MTN Mobile Money and Airtel Money APIs, backed by enterprise Firebase security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">MTN & Airtel Integration</h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Deposit and withdraw instantly using official MTN Mobile Money and Airtel Money networks with real-time USSD PIN verification and server-side validation.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs text-yellow-400 font-mono">
                <CheckCircle className="w-4 h-4" /> Instant API Callback
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">48-Hour Investment Cycles</h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Deploy your savings starting from UGX 5,000 into structured 48-hour cycles targeting an 8% illustrative return. Clear countdown timers and instant wallet credit upon maturity.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400 font-mono">
                <CheckCircle className="w-4 h-4" /> Automated Maturity Payouts
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white">Bank-Grade Firestore Security</h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Built with strict Firebase Authentication, zero-trust security rules, immutable audit logs, and transparently disclosed 10% withdrawal fees.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs text-blue-400 font-mono">
                <CheckCircle className="w-4 h-4" /> Immutable Audit Trail
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-20 bg-gradient-to-t from-slate-950 to-slate-900 border-t border-slate-800 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready to Make Every Shilling Count?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            Join thousands of smart Ugandan savers and investors growing their wealth today.
          </p>
          <button
            onClick={onGetStarted}
            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl shadow-xl shadow-emerald-500/25 transition-all text-base inline-flex items-center gap-3"
          >
            Create Your Free Account <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

    </div>
  );
};
