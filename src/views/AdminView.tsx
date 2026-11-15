import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  Users, 
  ArrowUpRight, 
  TrendingUp, 
  History, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  AlertCircle,
  Smartphone,
  Search,
  LogOut,
  Wallet,
  Clock,
  RefreshCw,
  SlidersHorizontal,
  BadgeCheck
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, getDocs, doc, updateDoc, addDoc, query, orderBy } from 'firebase/firestore';
import { UserProfile, Withdrawal, Investment, AuditLog, Deposit } from '../types';

interface AdminViewProps {
  user: UserProfile | null;
  onLockSession: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ user, onLockSession }) => {
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [withdrawalsList, setWithdrawalsList] = useState<Withdrawal[]>([]);
  const [investmentsList, setInvestmentsList] = useState<Investment[]>([]);
  const [depositsList, setDepositsList] = useState<Deposit[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'users' | 'investments' | 'deposits' | 'audit'>('withdrawals');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'approved' | 'processed' | 'rejected'>('all');

  const adminEmail = user?.email || 'admin@nsimbirise.co.ug';
  const adminId = user?.uid || 'super-admin-root';

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Users
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        setUsersList(usersSnap.docs.map(d => ({ ...d.data(), uid: d.id } as UserProfile)));
      } catch (e) {
        console.warn('Users fetch notice:', e);
      }

      // 2. Withdrawals
      try {
        const wthSnap = await getDocs(collection(db, 'withdrawals'));
        setWithdrawalsList(wthSnap.docs.map(d => ({ id: d.id, ...d.data() } as Withdrawal)));
      } catch (e) {
        console.warn('Withdrawals fetch notice:', e);
      }

      // 3. Investments
      try {
        const invSnap = await getDocs(collection(db, 'investments'));
        setInvestmentsList(invSnap.docs.map(d => ({ id: d.id, ...d.data() } as Investment)));
      } catch (e) {
        console.warn('Investments fetch notice:', e);
      }

      // 4. Deposits
      try {
        const depSnap = await getDocs(collection(db, 'deposits'));
        setDepositsList(depSnap.docs.map(d => ({ id: d.id, ...d.data() } as Deposit)));
      } catch (e) {
        console.warn('Deposits fetch notice:', e);
      }

      // 5. Audit Logs
      try {
        const logSnap = await getDocs(query(collection(db, 'audit_logs'), orderBy('createdAt', 'desc')));
        setAuditLogs(logSnap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog)));
      } catch (e) {
        console.warn('Audit logs fetch notice:', e);
      }

    } catch (err) {
      console.error(err);
      setError('Error loading administrative datasets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleProcessWithdrawal = async (withdrawalId: string, newStatus: 'approved' | 'processed' | 'rejected') => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, 'withdrawals', withdrawalId), {
        status: newStatus,
        updatedAt: now,
      });

      // Write immutable audit log
      await addDoc(collection(db, 'audit_logs'), {
        adminId: adminId,
        adminEmail: adminEmail,
        action: `WITHDRAWAL_${newStatus.toUpperCase()}`,
        targetId: withdrawalId,
        details: `Withdrawal ${withdrawalId} state transitioned to ${newStatus}`,
        createdAt: now,
      });

      setSuccessMsg(`Withdrawal order successfully marked as ${newStatus.toUpperCase()}.`);
      await fetchAdminData();
    } catch (err) {
      console.error(err);
      setError('Failed to update withdrawal status. Please verify permissions.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleKyc = async (targetUser: UserProfile) => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const updatedStatus = !targetUser.kycVerified;
      const now = new Date().toISOString();

      await updateDoc(doc(db, 'users', targetUser.uid), {
        kycVerified: updatedStatus,
        updatedAt: now,
      });

      await addDoc(collection(db, 'audit_logs'), {
        adminId: adminId,
        adminEmail: adminEmail,
        action: updatedStatus ? 'KYC_VERIFIED' : 'KYC_REVOKED',
        targetId: targetUser.uid,
        details: `KYC verification for ${targetUser.email} set to ${updatedStatus}`,
        createdAt: now,
      });

      setSuccessMsg(`KYC verification for ${targetUser.email} updated to ${updatedStatus ? 'VERIFIED' : 'UNVERIFIED'}.`);
      await fetchAdminData();
    } catch (err) {
      console.error(err);
      setError('Failed to update KYC status.');
    } finally {
      setActionLoading(false);
    }
  };

  // KPI Calculations
  const totalDepositVolume = depositsList.reduce((acc, d) => acc + (d.amountUgx || 0), 0);
  const totalInvestmentVolume = investmentsList.reduce((acc, i) => acc + (i.principalUgx || 0), 0);
  const pendingWithdrawals = withdrawalsList.filter(w => w.status === 'pending');
  const pendingWithdrawalsTotal = pendingWithdrawals.reduce((acc, w) => acc + (w.amountUgx || 0), 0);
  const processedWithdrawalsTotal = withdrawalsList.filter(w => w.status === 'processed').reduce((acc, w) => acc + (w.netAmountUgx || 0), 0);
  const totalFeesCollected = withdrawalsList.filter(w => w.status === 'processed' || w.status === 'approved').reduce((acc, w) => acc + (w.feeUgx || 0), 0);

  // Filtered Withdrawals
  const filteredWithdrawals = withdrawalsList.filter(w => {
    const matchesStatus = withdrawalFilter === 'all' || w.status === withdrawalFilter;
    const matchesSearch = !searchQuery || 
      w.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.phoneNumber?.includes(searchQuery) ||
      w.reference?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filtered Users
  const filteredUsers = usersList.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.email?.toLowerCase().includes(q) ||
      u.displayName?.toLowerCase().includes(q) ||
      u.phone?.includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Admin Command Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" /> Operations Command Center · Root Security
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              NsimbiRise Operations Command
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Active Console Session: <span className="text-white font-mono">{adminEmail}</span> · Clearance: <span className="text-emerald-400 font-mono">Super Administrator</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAdminData}
              disabled={loading}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl transition-colors border border-slate-700 flex items-center gap-2 text-xs font-semibold"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={onLockSession}
              className="px-5 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-2xl transition-colors text-xs font-bold flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Lock Admin Session
            </button>
          </div>
        </div>

        {/* Global KPI Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          
          <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Users</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white">{usersList.length}</div>
            <div className="text-[10px] text-slate-500 mt-1">Platform Accounts</div>
          </div>

          <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Deposits Vol</span>
              <Smartphone className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-xl font-bold font-mono text-yellow-400">UGX {(totalDepositVolume / 1000).toFixed(0)}k</div>
            <div className="text-[10px] text-slate-500 mt-1">{depositsList.length} Transactions</div>
          </div>

          <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Invested Capital</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400">UGX {(totalInvestmentVolume / 1000).toFixed(0)}k</div>
            <div className="text-[10px] text-slate-500 mt-1">48-Hour Active Cycles</div>
          </div>

          <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Pending Payouts</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-400">{pendingWithdrawals.length} reqs</div>
            <div className="text-[10px] text-slate-500 mt-1">UGX {pendingWithdrawalsTotal.toLocaleString()}</div>
          </div>

          <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Paid Out</span>
              <ArrowUpRight className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold font-mono text-blue-400">UGX {(processedWithdrawalsTotal / 1000).toFixed(0)}k</div>
            <div className="text-[10px] text-slate-500 mt-1">Disbursed via MoMo</div>
          </div>

          <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>10% Fee Revenue</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-300">UGX {totalFeesCollected.toLocaleString()}</div>
            <div className="text-[10px] text-slate-500 mt-1">Platform Reserve</div>
          </div>

        </div>

        {/* Notifications */}
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

        {/* Navigation Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800 text-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'withdrawals' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Withdrawals
              {pendingWithdrawals.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {pendingWithdrawals.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeTab === 'users' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Users ({usersList.length})
            </button>
            <button
              onClick={() => setActiveTab('investments')}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeTab === 'investments' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Investments ({investmentsList.length})
            </button>
            <button
              onClick={() => setActiveTab('deposits')}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeTab === 'deposits' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Deposits ({depositsList.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeTab === 'audit' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Audit Logs ({auditLogs.length})
            </button>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email, phone, ref..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

        </div>

        {/* Tab 1: Withdrawals */}
        {activeTab === 'withdrawals' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-amber-400" /> Mobile Money Payout Management
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Authorize and execute MTN & Airtel withdrawal payouts with 10% fee transparently deducted.
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                {(['all', 'pending', 'approved', 'processed', 'rejected'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setWithdrawalFilter(status)}
                    className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${
                      withdrawalFilter === status ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-amber-400 flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs font-mono text-slate-400">Loading withdrawal queue...</span>
              </div>
            ) : filteredWithdrawals.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                No withdrawal records matching current filters.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredWithdrawals.map(wth => (
                  <div key={wth.id} className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition-colors">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-white font-mono flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${wth.provider === 'MTN' ? 'bg-yellow-400' : 'bg-red-500'}`} />
                          {wth.provider} Mobile Money · {wth.phoneNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                          <span>User: <strong className="text-slate-200">{wth.userEmail}</strong></span>
                          <span>·</span>
                          <span>Ref: <strong className="text-slate-300 font-mono">{wth.reference}</strong></span>
                          <span>·</span>
                          <span>{new Date(wth.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      <div>
                        <span className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-bold ${
                          wth.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                          wth.status === 'approved' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                          wth.status === 'processed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                          'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}>
                          {wth.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-900 text-xs">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="text-slate-400">Gross: <strong className="font-mono text-white">UGX {wth.amountUgx?.toLocaleString()}</strong></span>
                        <span className="text-slate-400">10% Fee: <strong className="font-mono text-red-400">UGX {wth.feeUgx?.toLocaleString()}</strong></span>
                        <span className="text-slate-400">Net Disbursed: <strong className="font-mono text-emerald-400 font-bold text-sm">UGX {wth.netAmountUgx?.toLocaleString()}</strong></span>
                      </div>

                      <div className="flex items-center gap-2">
                        {wth.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleProcessWithdrawal(wth.id, 'approved')}
                              disabled={actionLoading}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleProcessWithdrawal(wth.id, 'processed')}
                              disabled={actionLoading}
                              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" /> Disburse & Payout
                            </button>
                            <button
                              onClick={() => handleProcessWithdrawal(wth.id, 'rejected')}
                              disabled={actionLoading}
                              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {wth.status === 'approved' && (
                          <button
                            onClick={() => handleProcessWithdrawal(wth.id, 'processed')}
                            disabled={actionLoading}
                            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> Complete Mobile Payout
                          </button>
                        )}
                        {wth.status === 'processed' && (
                          <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                            <BadgeCheck className="w-4 h-4" /> Disbursed to {wth.phoneNumber}
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Users */}
        {activeTab === 'users' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" /> Platform User Directory & KYC Management
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono">
                  <tr>
                    <th className="pb-3.5 pl-2">User Email</th>
                    <th className="pb-3.5">Full Name</th>
                    <th className="pb-3.5">Ugandan Phone</th>
                    <th className="pb-3.5">System Role</th>
                    <th className="pb-3.5">KYC Status</th>
                    <th className="pb-3.5">Joined Date</th>
                    <th className="pb-3.5 text-right pr-2">KYC Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  {filteredUsers.map(u => (
                    <tr key={u.uid} className="hover:bg-slate-950/60 transition-colors">
                      <td className="py-4 pl-2 text-white font-semibold">{u.email}</td>
                      <td className="py-4 text-slate-300">{u.displayName || 'Ugandan Saver'}</td>
                      <td className="py-4 text-emerald-400">{u.phone || 'N/A'}</td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'admin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.kycVerified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {u.kycVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td className="py-4 text-slate-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
                      <td className="py-4 text-right pr-2">
                        <button
                          onClick={() => handleToggleKyc(u)}
                          disabled={actionLoading}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-sans font-semibold transition-colors"
                        >
                          {u.kycVerified ? 'Revoke KYC' : 'Verify KYC'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Investments */}
        {activeTab === 'investments' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" /> Active & Matured 48-Hour Investment Portfolio
            </h3>
            
            {investmentsList.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">No investments recorded on platform.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {investmentsList.map(inv => {
                  const isMatured = new Date().getTime() >= new Date(inv.maturityDate).getTime();
                  const effectiveStatus = inv.status === 'withdrawn' ? 'withdrawn' : (isMatured ? 'matured' : 'active');

                  return (
                    <div key={inv.id} className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 font-mono">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-white font-bold">{inv.userEmail}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Started: {new Date(inv.startDate).toLocaleString()}</div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          effectiveStatus === 'active' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                          effectiveStatus === 'matured' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {effectiveStatus}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block">Principal</span>
                          <span className="text-white font-bold">UGX {inv.principalUgx?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block">Return (8%)</span>
                          <span className="text-emerald-400 font-bold">UGX {inv.expectedReturnUgx?.toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 uppercase block">Maturity Target</span>
                          <span className="text-slate-300 text-[11px]">{new Date(inv.maturityDate).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Deposits */}
        {activeTab === 'deposits' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-yellow-400" /> Inbound Mobile Money Deposits (MTN / Airtel)
            </h3>

            {depositsList.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">No deposit transactions found.</div>
            ) : (
              <div className="space-y-3">
                {depositsList.map(dep => (
                  <div key={dep.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between font-mono text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${dep.provider === 'MTN' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-white font-bold">{dep.provider} MoMo · {dep.phoneNumber}</div>
                        <div className="text-[10px] text-slate-500">User: {dep.userEmail} · Ref: {dep.reference} · {new Date(dep.createdAt).toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400">+ UGX {dep.amountUgx?.toLocaleString()}</div>
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">
                        {dep.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Audit Logs */}
        {activeTab === 'audit' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" /> Immutable Administrator Audit Trail
            </h3>

            {auditLogs.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">No audit entries recorded yet.</div>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                {auditLogs.map(log => (
                  <div key={log.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
                    <div className="flex justify-between items-center text-amber-400 font-bold">
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {log.action}
                      </span>
                      <span className="text-slate-500 text-[11px]">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-300">Admin Actor: <strong className="text-white">{log.adminEmail}</strong></div>
                    <div className="text-slate-400 text-[11px] pt-1 border-t border-slate-900">{log.details}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
