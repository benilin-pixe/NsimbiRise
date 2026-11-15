export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone: string;
  kycVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  userId: string;
  balanceUgx: number;
  totalInvestedUgx: number;
  totalEarnedUgx: number;
  totalWithdrawnUgx: number;
  updatedAt: string;
}

export interface Deposit {
  id: string;
  userId: string;
  userEmail: string;
  amountUgx: number;
  provider: 'MTN' | 'Airtel';
  phoneNumber: string;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  createdAt: string;
}

export interface Investment {
  id: string;
  userId: string;
  userEmail: string;
  principalUgx: number;
  expectedReturnUgx: number;
  returnRate: number; // e.g. 0.08 (8%)
  maturityHours: number; // 48
  status: 'active' | 'matured' | 'withdrawn';
  startDate: string;
  maturityDate: string;
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  userEmail: string;
  amountUgx: number;
  feeUgx: number; // 10%
  netAmountUgx: number;
  provider: 'MTN' | 'Airtel';
  phoneNumber: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  reference: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetId: string;
  details: string;
  createdAt: string;
}

export interface Admin {
  id: string;
  email: string;
  role: 'super_admin' | 'support_admin' | 'finance_admin';
  addedBy: string;
  createdAt: string;
}
