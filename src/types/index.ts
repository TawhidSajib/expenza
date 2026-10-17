export type PaymentMethod =
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'upi_wallet'
  | 'bank_transfer'
  | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  countryCode?: string;
  currency: string;
  createdAt: string;
  monthlyBudget?: number;
  photoURL?: string;
  authProvider?: 'google' | 'email' | 'demo';
  role?: 'owner' | 'user';
  isOwner?: boolean;
}

export interface Category {
  id: string;
  userId?: string;
  name: string;
  color: string;
  icon: string;
  budget?: number;
  monthlyBudget?: number;
  description?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  title: string;
  amount: number;
  categoryId: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  paymentMethod: PaymentMethod;
  notes?: string;
  receiptNumber?: string;
  reference?: string;
  createdAt: string;
}

export type PeriodType = 'day' | 'month' | 'year' | 'range' | 'all';

export type SortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

export interface FilterState {
  periodType: PeriodType;
  selectedDate: string; // YYYY-MM-DD
  selectedMonth: number; // 0-11
  selectedYear: number;
  startDate?: string;
  endDate?: string;
  selectedCategoryIds: string[];
  paymentMethod?: string;
  searchQuery: string;
  sortBy: SortOption;
}
