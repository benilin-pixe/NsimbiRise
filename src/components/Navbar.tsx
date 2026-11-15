import React from 'react';
import { Shield, Wallet, TrendingUp, History, FileText, Lock, LogOut, User as UserIcon } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  user: UserProfile | null;
  onLoginClick: () => void;
  onLogout: () => void;
  isAdmin: boolean;
  isAdminAuthenticated: boolean;
  onOpenAdminGate: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  user,
  onLoginClick,
  onLogout,
  isAdmin,
  isAdminAuthenticated,
  onOpenAdminGate,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand Wordmark */}
        <div 
          onClick={() => setCurrentView('landing')} 
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/40 text-white font-bold text-xl group-hover:scale-105 transition-transform">
            ₦
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white font-sans">
              Nsimbi<span className="text-emerald-400">Rise</span>
            </span>
            <span className="block text-[10px] text-emerald-300/80 font-medium tracking-wide uppercase">
              Make Every Shilling Count
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setCurrentView('landing')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-emerald-400 ${
              currentView === 'landing' ? 'text-emerald-400 font-semibold' : ''
            }`}
          >
            Overview
          </button>
          {user && (
            <>
              <button
                onClick={() => setCurrentView('wallet')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-emerald-400 flex items-center gap-1.5 ${
                  currentView === 'wallet' ? 'text-emerald-400 font-semibold' : ''
                }`}
              >
                <Wallet className="w-4 h-4" /> Wallet
              </button>
              <button
                onClick={() => setCurrentView('investments')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-emerald-400 flex items-center gap-1.5 ${
                  currentView === 'investments' ? 'text-emerald-400 font-semibold' : ''
                }`}
              >
                <TrendingUp className="w-4 h-4" /> Investments
              </button>
              <button
                onClick={() => setCurrentView('history')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-emerald-400 flex items-center gap-1.5 ${
                  currentView === 'history' ? 'text-emerald-400 font-semibold' : ''
                }`}
              >
                <History className="w-4 h-4" /> History
              </button>
            </>
          )}
          <button
            onClick={() => setCurrentView('terms')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-emerald-400 flex items-center gap-1.5 ${
              currentView === 'terms' ? 'text-emerald-400 font-semibold' : ''
            }`}
          >
            <FileText className="w-4 h-4" /> Terms & Risks
          </button>
          {(isAdmin || isAdminAuthenticated) && (
            <button
              onClick={() => {
                if (isAdminAuthenticated) {
                  setCurrentView('admin');
                } else {
                  onOpenAdminGate();
                }
              }}
              className={`transition-colors whitespace-nowrap shrink-0 text-amber-400 hover:text-amber-300 flex items-center gap-1.5 font-semibold ${
                currentView === 'admin' ? 'bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30' : ''
              }`}
            >
              <Lock className="w-4 h-4" /> Secure Control
            </button>
          )}
        </nav>

        {/* Zone 3: Primary Action / Auth */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-white">
                  {user.displayName || user.email.split('@')[0]}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  UGX Verified
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap shrink-0 flex items-center gap-2"
            >
              <UserIcon className="w-4 h-4" /> Sign In / Register
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
