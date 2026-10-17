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
import { exportToExcel } from '../utils/exportExcel';
import { getTodayDateString } from '../utils/formatters';
import {
  auth,
  googleProvider,
  signInWithPopup,
  fbSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  saveUserToFirestore,
  getUserFromFirestore,
  saveCategoryToFirestore,
  deleteCategoryFromFirestore,
  saveExpenseToFirestore,
  deleteExpenseFromFirestore,
  subscribeToCategories,
  subscribeToExpenses,
  getFirebaseConsoleUrl,
} from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';

export interface FirebaseSyncStatus {
  connected: boolean;
  projectId: string;
  databaseId: string;
  consoleUrl: string;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error?: string | null;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<User | null>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<User>;
  signInWithEmail: (email: string, password: string) => Promise<User>;
  sendPasswordReset: (email: string) => Promise<void>;
  firebaseStatus: FirebaseSyncStatus;
  syncWithFirebase: () => Promise<boolean>;
  categories: Category[];
  addCategory: (cat: Omit<Category, 'id' | 'createdAt'>) => Promise<Category>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<{ success: boolean; reason?: string }>;
  expenses: Expense[];
  addExpense: (exp: Omit<Expense, 'id' | 'userId' | 'createdAt'>) => Promise<Expense>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  filteredExpenses: Expense[];
  totalFilteredAmount: number;
  averageDailyAmount: number;
  currency: string;
  updateUserPreferences: (prefs: Partial<User>) => Promise<void>;
  seedDemoDataHandler: () => Promise<void>;
  clearUserData: (clearCategories?: boolean) => Promise<void>;
  exportExcel: (filteredOnly?: boolean) => void;
  exportBackup: () => void;
  importBackup: (backupData: any) => Promise<boolean>;
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

  const [firebaseStatus, setFirebaseStatus] = useState<FirebaseSyncStatus>({
    connected: true,
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId,
    consoleUrl: getFirebaseConsoleUrl(),
    isSyncing: false,
    lastSyncedAt: null,
    error: null,
  });

  // Track Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Authenticated with Firebase
        const existingLocal = getStoredUser();
        const firestoreProfile = await getUserFromFirestore(fbUser.uid).catch(() => null);

        const isGoogle = fbUser.providerData?.some((p) => p.providerId === 'google.com');

        const mergedUser: User = {
          id: fbUser.uid,
          name:
            fbUser.displayName ||
            firestoreProfile?.name ||
            existingLocal?.name ||
            fbUser.email?.split('@')[0] ||
            'Expenza User',
          email: fbUser.email || firestoreProfile?.email || existingLocal?.email || '',
          photoURL: fbUser.photoURL || undefined,
          currency: firestoreProfile?.currency || existingLocal?.currency || '$',
          monthlyBudget: firestoreProfile?.monthlyBudget ?? existingLocal?.monthlyBudget ?? 2500,
          createdAt: firestoreProfile?.createdAt || existingLocal?.createdAt || new Date().toISOString(),
          authProvider: isGoogle ? 'google' : 'email',
        };

        setUserState(mergedUser);
        setStoredUser(mergedUser);

        // Save profile in Firestore to ensure it's synced
        saveUserToFirestore(mergedUser).catch(console.warn);
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore real-time collections when user is active
  useEffect(() => {
    if (!user) {
      setCategories([]);
      setExpenses([]);
      return;
    }

    // Hydrate local cache first (starts empty for new user profiles)
    const storedCats = getStoredCategories(user.id);
    const storedExps = getStoredExpenses(user.id);
    setCategories(storedCats);
    setExpenses(storedExps);

    // Attach real-time snapshot listeners to Firestore if authenticated with Firebase
    let unsubCats: (() => void) | undefined;
    let unsubExps: (() => void) | undefined;

    if (auth.currentUser && auth.currentUser.uid === user.id) {
      setFirebaseStatus((prev) => ({ ...prev, isSyncing: true }));

      unsubCats = subscribeToCategories(
        user.id,
        (remoteCats) => {
          const list = remoteCats || [];
          setCategories(list);
          setStoredCategories(user.id, list);
          setFirebaseStatus((prev) => ({
            ...prev,
            isSyncing: false,
            lastSyncedAt: new Date().toLocaleTimeString(),
            error: null,
          }));
        },
        (err) => {
          setFirebaseStatus((prev) => ({ ...prev, isSyncing: false, error: err?.message || 'Sync error' }));
        }
      );

      unsubExps = subscribeToExpenses(
        user.id,
        (remoteExps) => {
          const list = remoteExps || [];
          setExpenses(list);
          setStoredExpenses(user.id, list);
          setFirebaseStatus((prev) => ({
            ...prev,
            isSyncing: false,
            lastSyncedAt: new Date().toLocaleTimeString(),
            error: null,
          }));
        },
        (err) => {
          setFirebaseStatus((prev) => ({ ...prev, isSyncing: false, error: err?.message || 'Sync error' }));
        }
      );
    }

    return () => {
      if (unsubCats) unsubCats();
      if (unsubExps) unsubExps();
    };
  }, [user?.id]);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    setStoredUser(newUser);
    if (newUser && auth.currentUser && auth.currentUser.uid === newUser.id) {
      saveUserToFirestore(newUser).catch(console.warn);
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch {
      // ignore
    }
    setUserState(null);
    setStoredUser(null);
    setCategories([]);
    setExpenses([]);
  };

  // Google Sign-In
  const signInWithGoogle = async (): Promise<User | null> => {
    try {
      setFirebaseStatus((prev) => ({ ...prev, isSyncing: true, error: null }));
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      const existingProfile = await getUserFromFirestore(fbUser.uid).catch(() => null);

      const profile: User = {
        id: fbUser.uid,
        name: fbUser.displayName || existingProfile?.name || 'Google User',
        email: fbUser.email || existingProfile?.email || '',
        photoURL: fbUser.photoURL || undefined,
        currency: existingProfile?.currency || '$',
        monthlyBudget: existingProfile?.monthlyBudget ?? 2500,
        createdAt: existingProfile?.createdAt || new Date().toISOString(),
        authProvider: 'google',
      };

      setUserState(profile);
      setStoredUser(profile);
      await saveUserToFirestore(profile);

      setFirebaseStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncedAt: new Date().toLocaleTimeString(),
      }));
      return profile;
    } catch (err: any) {
      setFirebaseStatus((prev) => ({
        ...prev,
        isSyncing: false,
        error: err.message || 'Google sign-in failed',
      }));
      throw err;
    }
  };

  // Email & Password Sign Up
  const signUpWithEmail = async (name: string, email: string, password: string): Promise<User> => {
    try {
      setFirebaseStatus((prev) => ({ ...prev, isSyncing: true, error: null }));
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = cred.user;

      // Update Firebase Auth profile displayName
      if (name.trim()) {
        await updateProfile(fbUser, { displayName: name.trim() }).catch(() => {});
      }

      const profile: User = {
        id: fbUser.uid,
        name: name.trim() || fbUser.email?.split('@')[0] || 'Expenza User',
        email: fbUser.email || email.trim(),
        currency: '$',
        monthlyBudget: 2500,
        createdAt: new Date().toISOString(),
        authProvider: 'email',
      };

      setUserState(profile);
      setStoredUser(profile);
      await saveUserToFirestore(profile);

      setFirebaseStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncedAt: new Date().toLocaleTimeString(),
      }));
      return profile;
    } catch (err: any) {
      setFirebaseStatus((prev) => ({
        ...prev,
        isSyncing: false,
        error: err.message || 'Sign up failed',
      }));
      throw err;
    }
  };

  // Email & Password Sign In
  const signInWithEmail = async (email: string, password: string): Promise<User> => {
    try {
      setFirebaseStatus((prev) => ({ ...prev, isSyncing: true, error: null }));
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = cred.user;

      const existingProfile = await getUserFromFirestore(fbUser.uid).catch(() => null);

      const profile: User = {
        id: fbUser.uid,
        name:
          existingProfile?.name ||
          fbUser.displayName ||
          fbUser.email?.split('@')[0] ||
          'Expenza User',
        email: fbUser.email || email.trim(),
        photoURL: fbUser.photoURL || undefined,
        currency: existingProfile?.currency || '$',
        monthlyBudget: existingProfile?.monthlyBudget ?? 2500,
        createdAt: existingProfile?.createdAt || new Date().toISOString(),
        authProvider: 'email',
      };

      setUserState(profile);
      setStoredUser(profile);
      await saveUserToFirestore(profile);

      setFirebaseStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncedAt: new Date().toLocaleTimeString(),
      }));
      return profile;
    } catch (err: any) {
      setFirebaseStatus((prev) => ({
        ...prev,
        isSyncing: false,
        error: err.message || 'Login failed',
      }));
      throw err;
    }
  };

  // Password Reset Email
  const sendPasswordReset = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const updateUserPreferences = async (prefs: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...prefs };
    setUserState(updated);
    setStoredUser(updated);

    if (auth.currentUser && auth.currentUser.uid === user.id) {
      await saveUserToFirestore(updated).catch(console.warn);
    }
  };

  const addCategory = async (catData: Omit<Category, 'id' | 'createdAt'>): Promise<Category> => {
    if (!user) throw new Error('User not logged in');
    const newCategory: Category = {
      ...catData,
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };
    const updated = [...categories, newCategory];
    setCategories(updated);
    setStoredCategories(user.id, updated);

    // Save to Firestore
    if (auth.currentUser && auth.currentUser.uid === user.id) {
      try {
        await saveCategoryToFirestore(user.id, newCategory);
      } catch (err) {
        console.warn('Failed to sync added category to Firestore', err);
      }
    }

    return newCategory;
  };

  const updateCategory = async (id: string, updates: Partial<Category>): Promise<void> => {
    if (!user) return;
    const updated = categories.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setCategories(updated);
    setStoredCategories(user.id, updated);

    const target = updated.find((c) => c.id === id);
    if (target && auth.currentUser && auth.currentUser.uid === user.id) {
      try {
        await saveCategoryToFirestore(user.id, target);
      } catch (err) {
        console.warn('Failed to sync updated category to Firestore', err);
      }
    }
  };

  const deleteCategory = async (id: string): Promise<{ success: boolean; reason?: string }> => {
    if (!user) return { success: false, reason: 'Not logged in' };
    const hasExpenses = expenses.some((e) => e.categoryId === id);
    if (hasExpenses) {
      return { success: false, reason: 'Category has associated expenses. Reassign or delete expenses first.' };
    }

    const updated = categories.filter((c) => c.id !== id);
    setCategories(updated);
    setStoredCategories(user.id, updated);

    if (auth.currentUser && auth.currentUser.uid === user.id) {
      try {
        await deleteCategoryFromFirestore(user.id, id);
      } catch (err) {
        console.warn('Failed to delete category from Firestore', err);
      }
    }

    return { success: true };
  };

  const addExpense = async (expData: Omit<Expense, 'id' | 'userId' | 'createdAt'>): Promise<Expense> => {
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

    // Save to Firestore
    if (auth.currentUser && auth.currentUser.uid === user.id) {
      try {
        await saveExpenseToFirestore(user.id, newExpense);
      } catch (err) {
        console.warn('Failed to sync added expense to Firestore', err);
      }
    }

    return newExpense;
  };

  const updateExpense = async (id: string, updates: Partial<Expense>): Promise<void> => {
    if (!user) return;
    const updated = expenses.map((e) => (e.id === id ? { ...e, ...updates } : e));
    setExpenses(updated);
    setStoredExpenses(user.id, updated);

    const target = updated.find((e) => e.id === id);
    if (target && auth.currentUser && auth.currentUser.uid === user.id) {
      try {
        await saveExpenseToFirestore(user.id, target);
      } catch (err) {
        console.warn('Failed to sync updated expense to Firestore', err);
      }
    }
  };

  const deleteExpense = async (id: string): Promise<void> => {
    if (!user) return;
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    setStoredExpenses(user.id, updated);

    if (auth.currentUser && auth.currentUser.uid === user.id) {
      try {
        await deleteExpenseFromFirestore(user.id, id);
      } catch (err) {
        console.warn('Failed to delete expense from Firestore', err);
      }
    }
  };

  const syncWithFirebase = async (): Promise<boolean> => {
    if (!user || !auth.currentUser) return false;
    setFirebaseStatus((prev) => ({ ...prev, isSyncing: true, error: null }));
    try {
      await saveUserToFirestore(user);
      for (const cat of categories) {
        await saveCategoryToFirestore(user.id, cat);
      }
      for (const exp of expenses) {
        await saveExpenseToFirestore(user.id, exp);
      }
      setFirebaseStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncedAt: new Date().toLocaleTimeString(),
      }));
      return true;
    } catch (err: any) {
      setFirebaseStatus((prev) => ({ ...prev, isSyncing: false, error: err.message }));
      return false;
    }
  };

  const seedDemoDataHandler = async () => {
    if (!user) return;
    const seeded = seedInitialDemoData(user.id);
    setCategories(seeded.categories);
    setExpenses(seeded.expenses);
    setStoredCategories(user.id, seeded.categories);
    setStoredExpenses(user.id, seeded.expenses);

    if (auth.currentUser && auth.currentUser.uid === user.id) {
      await syncWithFirebase();
    }
  };

  const clearUserData = async (clearCategories: boolean = false): Promise<void> => {
    if (!user) return;
    const currentExpenses = [...expenses];
    const currentCategories = [...categories];

    setExpenses([]);
    setStoredExpenses(user.id, []);

    if (clearCategories) {
      setCategories([]);
      setStoredCategories(user.id, []);
    }

    if (auth.currentUser && auth.currentUser.uid === user.id) {
      try {
        for (const exp of currentExpenses) {
          await deleteExpenseFromFirestore(user.id, exp.id).catch(() => {});
        }
        if (clearCategories) {
          for (const cat of currentCategories) {
            await deleteCategoryFromFirestore(user.id, cat.id).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Failed to clear user data from Firestore', err);
      }
    }
  };

  const exportExcel = (filteredOnly: boolean = false) => {
    if (!user) return;
    const targetExpenses = filteredOnly ? filteredExpenses : expenses;
    exportToExcel(
      targetExpenses,
      categories,
      user,
      filteredOnly ? 'expenza_filtered_transactions' : 'expenza_all_transactions'
    );
  };

  const exportBackup = () => {
    if (!user) return;
    exportDataBackup(user, categories, expenses);
  };

  const importBackup = async (backupData: ExpenzaBackupData): Promise<boolean> => {
    if (!user) return false;
    try {
      const importedCategories = backupData.categories.map((c) => ({
        ...c,
        userId: user.id,
      }));
      const importedExpenses = backupData.expenses.map((e) => ({
        ...e,
        userId: user.id,
      }));

      setCategories(importedCategories);
      setExpenses(importedExpenses);
      setStoredCategories(user.id, importedCategories);
      setStoredExpenses(user.id, importedExpenses);

      if (backupData.user.currency || backupData.user.monthlyBudget) {
        await updateUserPreferences({
          currency: backupData.user.currency || user.currency,
          monthlyBudget: backupData.user.monthlyBudget || user.monthlyBudget,
        });
      }

      if (auth.currentUser && auth.currentUser.uid === user.id) {
        await syncWithFirebase();
      }

      return true;
    } catch (err) {
      console.error('Import failed', err);
      return false;
    }
  };

  const resetFilters = () => {
    setFilterState({
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
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      if (filterState.selectedCategoryIds.length > 0) {
        if (!filterState.selectedCategoryIds.includes(exp.categoryId)) return false;
      }
      if (filterState.paymentMethod && exp.paymentMethod !== filterState.paymentMethod) {
        return false;
      }
      if (filterState.searchQuery.trim()) {
        const query = filterState.searchQuery.toLowerCase();
        const matchesTitle = exp.title.toLowerCase().includes(query);
        const matchesNotes = exp.notes?.toLowerCase().includes(query);
        const matchesRef = exp.reference?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesNotes && !matchesRef) return false;
      }

      const expDate = new Date(exp.date + 'T00:00:00');

      if (filterState.periodType === 'day') {
        return exp.date === filterState.selectedDate;
      }
      if (filterState.periodType === 'month') {
        return (
          expDate.getMonth() === filterState.selectedMonth &&
          expDate.getFullYear() === filterState.selectedYear
        );
      }
      if (filterState.periodType === 'year') {
        return expDate.getFullYear() === filterState.selectedYear;
      }
      if (filterState.periodType === 'range') {
        if (filterState.startDate && exp.date < filterState.startDate) return false;
        if (filterState.endDate && exp.date > filterState.endDate) return false;
        return true;
      }
      return true;
    }).sort((a, b) => {
      if (filterState.sortBy === 'date_desc') return b.date.localeCompare(a.date);
      if (filterState.sortBy === 'date_asc') return a.date.localeCompare(b.date);
      if (filterState.sortBy === 'amount_desc') return b.amount - a.amount;
      if (filterState.sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });
  }, [expenses, filterState]);

  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredExpenses]);

  const averageDailyAmount = useMemo(() => {
    if (filteredExpenses.length === 0) return 0;
    const uniqueDays = new Set(filteredExpenses.map((e) => e.date)).size;
    return uniqueDays > 0 ? totalFilteredAmount / uniqueDays : 0;
  }, [filteredExpenses, totalFilteredAmount]);

  const currency = user?.currency || '$';

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        logout,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        sendPasswordReset,
        firebaseStatus,
        syncWithFirebase,
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
        exportExcel,
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
