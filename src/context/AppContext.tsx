import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { User, Category, Expense, FilterState, PeriodType } from '../types';
import {
  getStoredUser,
  setStoredUser,
  getStoredCategories,
  setStoredCategories,
  getStoredExpenses,
  setStoredExpenses,
  seedInitialDemoData,
  exportDataBackup,
  ExpenzaBackupData,
} from '../utils/storage';
import { getTodayDateString } from '../utils/formatters';

export interface DbStatus {
  connected: boolean;
  uriConfigured: boolean;
  dbName: string;
  error?: string | null;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  dbStatus: DbStatus;
  syncWithMongo: () => Promise<boolean>;
  categories: Category[];
  addCategory: (cat: Omit<Category, 'id' | 'createdAt'>) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => { success: boolean; reason?: string };
  expenses: Expense[];
  addExpense: (exp: Omit<Expense, 'id' | 'userId' | 'createdAt'>) => Expense;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  filteredExpenses: Expense[];
  totalFilteredAmount: number;
  averageDailyAmount: number;
  currency: string;
  updateUserPreferences: (prefs: Partial<User>) => void;
  seedDemoDataHandler: () => void;
  clearUserData: () => void;
  exportBackup: () => void;
  importBackup: (backupData: any) => boolean;
  activeTab: 'expenses' | 'analytics' | 'categories';
  setActiveTab: (tab: 'expenses' | 'analytics' | 'categories') => void;
  isAddExpenseOpen: boolean;
  setIsAddExpenseOpen: (open: boolean) => void;
  isAddCategoryOpen: boolean;
  setIsAddCategoryOpen: (open: boolean) => void;
  editingExpense: Expense | null;
  setEditingExpense: (exp: Expense | null) => void;
  editingCategory: Category | null;
  setEditingCategory: (cat: Category | null) => void;
  isCategoryManagerOpen: boolean;
  setIsCategoryManagerOpen: (open: boolean) => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialToday = getTodayDateString();
const initialDateObj = new Date();

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(() => getStoredUser());
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activeTab, setActiveTab] = useState<'expenses' | 'analytics' | 'categories'>('expenses');

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [filterState, setFilterState] = useState<FilterState>({
    periodType: 'month',
    selectedDate: initialToday,
    selectedMonth: initialDateObj.getMonth(),
    selectedYear: initialDateObj.getFullYear(),
    startDate: '',
    endDate: '',
    selectedCategoryIds: [],
    paymentMethod: '',
    searchQuery: '',
    sortBy: 'date_desc',
  });

  const [dbStatus, setDbStatus] = useState<DbStatus>({
    connected: false,
    uriConfigured: false,
    dbName: 'expenza',
    error: null,
  });

  const checkDbStatus = async () => {
    try {
      const res = await fetch('/api/db-status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch {
      // offline
    }
  };

  useEffect(() => {
    checkDbStatus();
  }, []);

  // Load user data on change of user state and hydrate from MongoDB if connected
  useEffect(() => {
    if (user) {
      const storedCats = getStoredCategories(user.id);
      const storedExps = getStoredExpenses(user.id);
      setCategories(storedCats);
      setExpenses(storedExps);

      // Hydrate from MongoDB remote collections
      fetch(`/api/user-data?userId=${user.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((remoteData) => {
          if (remoteData && remoteData.fromMongo) {
            if (Array.isArray(remoteData.categories) && remoteData.categories.length > 0) {
              setCategories(remoteData.categories);
              setStoredCategories(user.id, remoteData.categories);
            }
            if (Array.isArray(remoteData.expenses) && remoteData.expenses.length > 0) {
              setExpenses(remoteData.expenses);
              setStoredExpenses(user.id, remoteData.expenses);
            }
            if (remoteData.user) {
              updateUserPreferences({
                name: remoteData.user.name || user.name,
                currency: remoteData.user.currency || user.currency,
                monthlyBudget: remoteData.user.monthlyBudget ?? user.monthlyBudget,
              });
            }
          }
        })
        .catch(() => {});
    } else {
      setCategories([]);
      setExpenses([]);
    }
  }, [user?.id]);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    setStoredUser(newUser);
  };

  const logout = () => {
    setUser(null);
  };

  const updateUserPreferences = (prefs: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...prefs };
    setUser(updated);
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, user: updated }),
    }).catch(() => {});
  };

  const addCategory = (catData: Omit<Category, 'id' | 'createdAt'>): Category => {
    if (!user) throw new Error('User not logged in');
    const newCategory: Category = {
      ...catData,
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...categories, newCategory];
    setCategories(updated);
    setStoredCategories(user.id, updated);

    // Persist to MongoDB in background
    fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newCategory, userId: user.id }),
    }).catch(() => {});

    return newCategory;
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    if (!user) return;
    const updated = categories.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat));
    setCategories(updated);
    setStoredCategories(user.id, updated);

    const changed = updated.find((c) => c.id === id);
    if (changed) {
      fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...changed, userId: user.id }),
      }).catch(() => {});
    }
  };

  const deleteCategory = (id: string): { success: boolean; reason?: string } => {
    if (!user) return { success: false, reason: 'Not logged in' };
    const hasExpenses = expenses.some((e) => e.categoryId === id);
    if (hasExpenses) {
      return {
        success: false,
        reason: 'This category is used by existing expenses. Please reassign or delete those expenses first.',
      };
    }
    const updated = categories.filter((c) => c.id !== id);
    setCategories(updated);
    setStoredCategories(user.id, updated);

    // Delete in MongoDB
    fetch(`/api/categories/${id}?userId=${user.id}`, { method: 'DELETE' }).catch(() => {});

    return { success: true };
  };

  const addExpense = (expData: Omit<Expense, 'id' | 'userId' | 'createdAt'>): Expense => {
    if (!user) throw new Error('User not logged in');
    const newExpense: Expense = {
      ...expData,
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };
    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    setStoredExpenses(user.id, updated);

    // Persist to MongoDB in background
    fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newExpense),
    }).catch(() => {});

    return newExpense;
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    if (!user) return;
    const updated = expenses.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp));
    setExpenses(updated);
    setStoredExpenses(user.id, updated);

    const changed = updated.find((e) => e.id === id);
    if (changed) {
      fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changed),
      }).catch(() => {});
    }
  };

  const deleteExpense = (id: string) => {
    if (!user) return;
    const updated = expenses.filter((exp) => exp.id !== id);
    setExpenses(updated);
    setStoredExpenses(user.id, updated);

    // Delete in MongoDB
    fetch(`/api/expenses/${id}?userId=${user.id}`, { method: 'DELETE' }).catch(() => {});
  };

  const syncWithMongo = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          categories,
          expenses,
          user,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        await checkDbStatus();
        return Boolean(data.synced);
      }
      return false;
    } catch {
      return false;
    }
  };

  const resetFilters = () => {
    const today = getTodayDateString();
    const d = new Date();
    setFilterState({
      periodType: 'month',
      selectedDate: today,
      selectedMonth: d.getMonth(),
      selectedYear: d.getFullYear(),
      startDate: '',
      endDate: '',
      selectedCategoryIds: [],
      paymentMethod: '',
      searchQuery: '',
      sortBy: 'date_desc',
    });
  };

  const seedDemoDataHandler = () => {
    if (!user) return;
    const { categories: newCats, expenses: newExps } = seedInitialDemoData(user.id);
    setCategories(newCats);
    setExpenses(newExps);
  };

  const clearUserData = () => {
    if (!user) return;
    setCategories([]);
    setExpenses([]);
    setStoredCategories(user.id, []);
    setStoredExpenses(user.id, []);
  };

  const exportBackup = () => {
    if (!user) return;
    exportDataBackup(user, categories, expenses);
  };

  const importBackup = (backupData: any): boolean => {
    if (!user || !backupData) return false;
    try {
      if (Array.isArray(backupData.categories)) {
        setCategories(backupData.categories);
        setStoredCategories(user.id, backupData.categories);
      }
      if (Array.isArray(backupData.expenses)) {
        setExpenses(backupData.expenses);
        setStoredExpenses(user.id, backupData.expenses);
      }
      if (backupData.user && backupData.user.currency) {
        updateUserPreferences({
          currency: backupData.user.currency,
          monthlyBudget: backupData.user.monthlyBudget,
        });
      }
      return true;
    } catch (err) {
      console.error('Failed to import backup:', err);
      return false;
    }
  };

  // Filter and sort expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      // 1. Period filter
      if (filterState.periodType === 'day') {
        if (exp.date !== filterState.selectedDate) return false;
      } else if (filterState.periodType === 'month') {
        const [y, m] = exp.date.split('-').map(Number);
        if (y !== filterState.selectedYear || m - 1 !== filterState.selectedMonth) {
          return false;
        }
      } else if (filterState.periodType === 'year') {
        const [y] = exp.date.split('-').map(Number);
        if (y !== filterState.selectedYear) return false;
      } else if (filterState.periodType === 'range') {
        if (filterState.startDate && exp.date < filterState.startDate) return false;
        if (filterState.endDate && exp.date > filterState.endDate) return false;
      }

      // 2. Category filter
      if (
        filterState.selectedCategoryIds.length > 0 &&
        !filterState.selectedCategoryIds.includes(exp.categoryId)
      ) {
        return false;
      }

      // 3. Payment method filter
      if (filterState.paymentMethod && exp.paymentMethod !== filterState.paymentMethod) {
        return false;
      }

      // 4. Search query
      if (filterState.searchQuery.trim()) {
        const query = filterState.searchQuery.toLowerCase();
        const titleMatch = exp.title.toLowerCase().includes(query);
        const notesMatch = exp.notes?.toLowerCase().includes(query);
        const refMatch = exp.receiptNumber?.toLowerCase().includes(query);
        if (!titleMatch && !notesMatch && !refMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      if (filterState.sortBy === 'date_desc') {
        return b.date.localeCompare(a.date) || (b.time || '').localeCompare(a.time || '');
      }
      if (filterState.sortBy === 'date_asc') {
        return a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '');
      }
      if (filterState.sortBy === 'amount_desc') {
        return b.amount - a.amount;
      }
      if (filterState.sortBy === 'amount_asc') {
        return a.amount - b.amount;
      }
      return 0;
    });
  }, [expenses, filterState]);

  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredExpenses]);

  const averageDailyAmount = useMemo(() => {
    if (filteredExpenses.length === 0) return 0;
    const uniqueDates = new Set(filteredExpenses.map((e) => e.date));
    const dayCount = Math.max(uniqueDates.size, 1);
    return totalFilteredAmount / dayCount;
  }, [filteredExpenses, totalFilteredAmount]);

  const currency = user?.currency || '$';

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        logout,
        dbStatus,
        syncWithMongo,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        filterState,
        setFilterState,
        resetFilters,
        filteredExpenses,
        totalFilteredAmount,
        averageDailyAmount,
        currency,
        updateUserPreferences,
        seedDemoDataHandler,
        clearUserData,
        exportBackup,
        importBackup,
        activeTab,
        setActiveTab,
        isAddExpenseOpen,
        setIsAddExpenseOpen,
        isAddCategoryOpen,
        setIsAddCategoryOpen,
        editingExpense,
        setEditingExpense,
        editingCategory,
        setEditingCategory,
        isCategoryManagerOpen,
        setIsCategoryManagerOpen,
        isProfileOpen,
        setIsProfileOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
