import React from 'react';
import { Wallet, TrendingUp, ArrowUpRight, History, FileText, Lock, LogOut, User as UserIcon } from 'lucide-react';
import { UserProfile } from '../types';
import { BrandLogo } from './BrandLogo';
import { PWAInstallButton } from './PWAInstallButton';

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
    <header className="sticky top-0 z-50 bg-[#071126]/95 backdrop-blur-md border-b border-slate-800/80 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => setCurrentView('landing')}
          className="flex items-center gap-3 cursor-pointer group shrink-0 text-left whitespace-nowrap"
        >
          <BrandLogo size="md" className="group-hover:scale-105 transition-transform" />
          <span className="text-xl font-extrabold tracking-tight text-white font-sans">
            Nsimbi <span className="bg-gradient-to-r from-cyan-400 via-amber-400 to-yellow-300 bg-clip-text text-transparent">Rise</span>
          </span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setCurrentView('landing')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-cyan-400 ${
              currentView === 'landing' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Overview
          </button>
          {user && (
            <>
              <button
                onClick={() => setCurrentView('wallet')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-cyan-400 flex items-center gap-1.5 ${
                  currentView === 'wallet' ? 'text-cyan-400 font-semibold' : ''
                }`}
              >
                <Wallet className="w-4 h-4" /> Wallet
              </button>
              <button
                onClick={() => setCurrentView('investments')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-cyan-400 flex items-center gap-1.5 ${
                  currentView === 'investments' ? 'text-cyan-400 font-semibold' : ''
                }`}
              >
                <TrendingUp className="w-4 h-4" /> Investments
              </button>
              <button
                onClick={() => setCurrentView('withdrawals')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-cyan-400 flex items-center gap-1.5 ${
                  currentView === 'withdrawals' ? 'text-cyan-400 font-semibold' : ''
                }`}
              >
                <ArrowUpRight className="w-4 h-4" /> Withdraw
              </button>
              <button
                onClick={() => setCurrentView('history')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-cyan-400 flex items-center gap-1.5 ${
                  currentView === 'history' ? 'text-cyan-400 font-semibold' : ''
                }`}
              >
                <History className="w-4 h-4" /> History
              </button>
            </>
          )}
          <button
            onClick={() => setCurrentView('terms')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-cyan-400 flex items-center gap-1.5 ${
              currentView === 'terms' ? 'text-cyan-400 font-semibold' : ''
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
          <PWAInstallButton />
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-white">
                  {user.displayName || (user.email ? user.email.split('@')[0] : 'Member')}
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

      {/* Compact Mobile Navigation for Authenticated Users */}
      {user && (
        <div className="lg:hidden border-t border-slate-800/80 px-4 py-2 flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setCurrentView('wallet')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 ${
              currentView === 'wallet' ? 'bg-cyan-500/15 text-cyan-300 font-semibold' : 'text-slate-300'
            }`}
          >
            Wallet
          </button>
          <button
            onClick={() => setCurrentView('investments')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 ${
              currentView === 'investments' ? 'bg-cyan-500/15 text-cyan-300 font-semibold' : 'text-slate-300'
            }`}
          >
            Investments
          </button>
          <button
            onClick={() => setCurrentView('withdrawals')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 ${
              currentView === 'withdrawals' ? 'bg-cyan-500/15 text-cyan-300 font-semibold' : 'text-slate-300'
            }`}
          >
            Withdraw
          </button>
          <button
            onClick={() => setCurrentView('history')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 ${
              currentView === 'history' ? 'bg-cyan-500/15 text-cyan-300 font-semibold' : 'text-slate-300'
            }`}
          >
            History
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
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 text-amber-400 ${
                currentView === 'admin' ? 'bg-amber-500/15 font-semibold' : ''
              }`}
            >
              Secure Control
            </button>
          )}
        </div>
      )}
    </header>
  );
};
