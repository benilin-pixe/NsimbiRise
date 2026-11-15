import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile } from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingView } from './views/LandingView';
import { WalletView } from './views/WalletView';
import { InvestmentsView } from './views/InvestmentsView';
import { WithdrawalsView } from './views/WithdrawalsView';
import { HistoryView } from './views/HistoryView';
import { TermsView } from './views/TermsView';
import { AdminView } from './views/AdminView';
import { AdminGateModal } from './components/AdminGateModal';
import { Shield, Loader2, X, CheckCircle, ArrowRight, Lock, Mail, User, Phone, KeyRound, AlertCircle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<string>('landing');
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  
  // Admin Session Gate State (Password ATIM protected)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('nsimbi_admin_session') === 'authenticated';
  });
  const [showAdminGateModal, setShowAdminGateModal] = useState<boolean>(false);
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  useEffect(() => {
    const handleUrlRouting = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash === '#admin' || hash === '#secure-control' || path === '/secure-control') {
        if (sessionStorage.getItem('nsimbi_admin_session') === 'authenticated') {
          setIsAdminAuthenticated(true);
          setCurrentView('admin');
        } else {
          setShowAdminGateModal(true);
        }
      }
    };
    handleUrlRouting();
    window.addEventListener('hashchange', handleUrlRouting);
    return () => window.removeEventListener('hashchange', handleUrlRouting);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setUser(userSnap.data() as UserProfile);
          } else {
            // Bootstrap new user profile if missing
            const isDefaultAdmin = firebaseUser.email === 'benilin76@gmail.com';
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Ugandan Saver',
              role: isDefaultAdmin ? 'admin' : 'user',
              phone: firebaseUser.phoneNumber || '',
              kycVerified: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userRef, newUser);
            setUser(newUser);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const getReadableAuthError = (err: any): string => {
    const code = err?.code || '';
    const message = err?.message || String(err);
    
    if (code.includes('email-already-in-use') || message.includes('email-already-in-use')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (code.includes('invalid-email') || message.includes('invalid-email')) {
      return 'Please enter a valid email address.';
    }
    if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential') || message.includes('invalid-credential') || message.includes('wrong-password') || message.includes('user-not-found')) {
      return 'Incorrect email or password. Please try again.';
    }
    if (code.includes('weak-password') || message.includes('weak-password')) {
      return 'Password should be at least 6 characters long.';
    }
    if (code.includes('too-many-requests') || message.includes('too-many-requests')) {
      return 'Access temporarily blocked due to many failed attempts. Try again later.';
    }
    return message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim() || 'Authentication failed. Please try again.';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setAuthError(null);
    setAuthSuccess(null);
    setSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowLoginModal(false);
      setCurrentView('wallet');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      console.error(err);
      setAuthError(getReadableAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setAuthError(null);
    setAuthSuccess(null);

    if (!fullName.trim()) {
      setAuthError('Please enter your full name.');
      return;
    }
    if (!phone.startsWith('07') && !phone.startsWith('+256')) {
      setAuthError('Please enter a valid Ugandan phone number (e.g. 077... or 070...).');
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const creds = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = creds.user;
      const isDefaultAdmin = email === 'benilin76@gmail.com';

      const newUser: UserProfile = {
        uid: firebaseUser.uid,
        email: email,
        displayName: fullName,
        role: isDefaultAdmin ? 'admin' : 'user',
        phone: phone,
        kycVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      setUser(newUser);
      setShowLoginModal(false);
      setCurrentView('wallet');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
      setPhone('');
    } catch (err: any) {
      console.error(err);
      setAuthError(getReadableAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setAuthError(null);
    setAuthSuccess(null);

    if (!email.trim()) {
      setAuthError('Please enter your email address first.');
      return;
    }

    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setAuthSuccess('Password reset link sent to your email inbox.');
    } catch (err: any) {
      console.error(err);
      setAuthError(getReadableAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setCurrentView('landing');
    } catch (err) {
      console.error(err);
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-emerald-400">
        <Loader2 className="w-10 h-10 animate-spin" />
        <span className="text-xs font-mono text-slate-400">Initializing NsimbiRise Platform...</span>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.email === 'benilin76@gmail.com';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
        onLoginClick={() => {
          if (user) {
            setCurrentView('wallet');
          } else {
            setAuthMode('login');
            setShowLoginModal(true);
          }
        }}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        isAdminAuthenticated={isAdminAuthenticated}
        onOpenAdminGate={() => setShowAdminGateModal(true)}
      />

      <main className="flex-grow">
        {currentView === 'landing' && (
          <LandingView
            onGetStarted={() => {
              if (user) {
                setCurrentView('wallet');
              } else {
                setAuthMode('register');
                setShowLoginModal(true);
              }
            }}
          />
        )}
        {currentView === 'wallet' && user && (
          <WalletView user={user} onNavigate={setCurrentView} />
        )}
        {currentView === 'investments' && user && (
          <InvestmentsView user={user} />
        )}
        {currentView === 'withdrawals' && user && (
          <WithdrawalsView user={user} />
        )}
        {currentView === 'history' && user && (
          <HistoryView user={user} />
        )}
        {currentView === 'terms' && (
          <TermsView />
        )}
        {currentView === 'admin' && (
          isAdminAuthenticated ? (
            <AdminView
              user={user}
              onLockSession={() => {
                sessionStorage.removeItem('nsimbi_admin_session');
                setIsAdminAuthenticated(false);
                setCurrentView('landing');
              }}
            />
          ) : (
            <div className="min-h-[75vh] flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-5 shadow-xl shadow-amber-500/10">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                Restricted Operations Console
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
                Administrative security authentication is required to access user portfolios, withdrawal authorizations, and platform ledgers.
              </p>
              <button
                onClick={() => setShowAdminGateModal(true)}
                className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl text-xs transition-all shadow-xl shadow-amber-500/20 flex items-center gap-2"
              >
                <Lock className="w-4 h-4" /> Authenticate Administrative Key
              </button>
            </div>
          )
        )}
      </main>

      <Footer onOpenAdminGate={() => setShowAdminGateModal(true)} />

      {/* Admin Gate Passcode Modal */}
      <AdminGateModal
        isOpen={showAdminGateModal}
        onClose={() => setShowAdminGateModal(false)}
        onSuccess={() => {
          setIsAdminAuthenticated(true);
          setShowAdminGateModal(false);
          setCurrentView('admin');
        }}
        currentUser={user}
      />

      {/* Auth Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative text-slate-100 space-y-6">
            
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl font-bold mx-auto">
                ₦
              </div>
              <h3 className="text-2xl font-bold text-white">
                {authMode === 'login' && 'Sign In to NsimbiRise'}
                {authMode === 'register' && 'Create Your Account'}
                {authMode === 'forgot' && 'Reset Password'}
              </h3>
              <p className="text-xs text-slate-400">
                {authMode === 'login' && 'Enter your credentials to access your wallet'}
                {authMode === 'register' && 'Start growing your savings with UGX 5,000 min'}
                {authMode === 'forgot' && 'We will email you a secure password reset link'}
              </p>
            </div>

            {/* Mode Selector Tabs */}
            {authMode !== 'forgot' && (
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(null); setAuthSuccess(null); }}
                  className={`py-2 rounded-lg font-semibold transition-all ${authMode === 'login' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setAuthError(null); setAuthSuccess(null); }}
                  className={`py-2 rounded-lg font-semibold transition-all ${authMode === 'register' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                >
                  Register
                </button>
              </div>
            )}

            {authError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* Login Form */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('forgot'); setAuthError(null); setAuthSuccess(null); }}
                      className="text-xs text-emerald-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm flex items-center justify-center gap-2 mt-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In to Wallet <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}

            {/* Register Form */}
            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Mukasa"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Ugandan Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="077XXXXXXXX or 070XXXXXXXX"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm flex items-center justify-center gap-2 mt-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}

            {/* Forgot Password Form */}
            {authMode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Reset Link <ArrowRight className="w-4 h-4" /></>}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setAuthError(null); setAuthSuccess(null); }}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Shield className="w-4 h-4" /> Firebase Secure Authentication
              </div>
              <p>
                By signing up or signing in, you agree to NsimbiRise&apos;s terms, 8% return disclosure, and 10% withdrawal fee policy.
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
