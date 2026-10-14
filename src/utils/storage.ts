import { User, Category, Expense } from '../types';

const USER_KEY = 'expenza_active_user';
const CATEGORIES_PREFIX = 'expenza_categories_';
const EXPENSES_PREFIX = 'expenza_expenses_';

export const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: User | null): void => {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch (err) {
    console.error('Failed to store active user', err);
  }
};

export const getStoredCategories = (userId: string): Category[] => {
  try {
    const raw = localStorage.getItem(`${CATEGORIES_PREFIX}${userId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const setStoredCategories = (userId: string, categories: Category[]): void => {
  try {
    localStorage.setItem(`${CATEGORIES_PREFIX}${userId}`, JSON.stringify(categories));
  } catch (err) {
    console.error('Failed to store categories', err);
  }
};

export const getStoredExpenses = (userId: string): Expense[] => {
  try {
    const raw = localStorage.getItem(`${EXPENSES_PREFIX}${userId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const setStoredExpenses = (userId: string, expenses: Expense[]): void => {
  try {
    localStorage.setItem(`${EXPENSES_PREFIX}${userId}`, JSON.stringify(expenses));
  } catch (err) {
    console.error('Failed to store expenses', err);
  }
};

export const seedInitialDemoData = (userId: string): { categories: Category[]; expenses: Expense[] } => {
  const categories: Category[] = [
    {
      id: `cat_food_${Date.now()}`,
      name: 'Dining & Coffee',
      color: '#00FF66',
      icon: 'Coffee',
      monthlyBudget: 350,
      description: 'Daily espresso, lunches, takeout and dinners',
      createdAt: new Date().toISOString()
    },
    {
      id: `cat_tech_${Date.now() + 1}`,
      name: 'Tech & Hardware',
      color: '#06B6D4',
      icon: 'Laptop',
      monthlyBudget: 500,
      description: 'Gadgets, peripherals, monitors and cloud tools',
      createdAt: new Date().toISOString()
    },
    {
      id: `cat_transport_${Date.now() + 2}`,
      name: 'Rides & Transit',
      color: '#FACC15',
      icon: 'Car',
      monthlyBudget: 180,
      description: 'Uber, fuel, public transit, and parking',
      createdAt: new Date().toISOString()
    },
    {
      id: `cat_fitness_${Date.now() + 3}`,
      name: 'Gym & Fitness',
      color: '#A855F7',
      icon: 'Dumbbell',
      monthlyBudget: 120,
      description: 'Gym membership, protein shakes, sportswear',
      createdAt: new Date().toISOString()
    }
  ];

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

  const twoDaysAgoDate = new Date();
  twoDaysAgoDate.setDate(twoDaysAgoDate.getDate() - 2);
  const twoDaysAgo = `${twoDaysAgoDate.getFullYear()}-${String(twoDaysAgoDate.getMonth() + 1).padStart(2, '0')}-${String(twoDaysAgoDate.getDate()).padStart(2, '0')}`;

  const expenses: Expense[] = [
    {
      id: `exp_1_${Date.now()}`,
      userId,
      title: 'Artisan Espresso & Croissant',
      amount: 8.50,
      categoryId: categories[0].id,
      date: today,
      time: '08:45',
      paymentMethod: 'upi_wallet',
      notes: 'Morning fuel at Neon Roasters',
      createdAt: new Date().toISOString()
    },
    {
      id: `exp_2_${Date.now() + 1}`,
      userId,
      title: 'Ergonomic Desk Mat & Cable Sleeves',
      amount: 42.00,
      categoryId: categories[1].id,
      date: today,
      time: '14:20',
      paymentMethod: 'credit_card',
      notes: 'Workspace upgrade',
      receiptNumber: 'REC-9021',
      createdAt: new Date().toISOString()
    },
    {
      id: `exp_3_${Date.now() + 2}`,
      userId,
      title: 'Metro Weekly Pass',
      amount: 32.50,
      categoryId: categories[2].id,
      date: yesterday,
      time: '09:10',
      paymentMethod: 'debit_card',
      notes: 'Commute reload',
      createdAt: new Date().toISOString()
    },
    {
      id: `exp_4_${Date.now() + 3}`,
      userId,
      title: 'Whey Protein Isolate 2kg',
      amount: 68.00,
      categoryId: categories[3].id,
      date: yesterday,
      time: '18:30',
      paymentMethod: 'credit_card',
      notes: 'Vanilla flavor discount sale',
      receiptNumber: 'SUP-4412',
      createdAt: new Date().toISOString()
    },
    {
      id: `exp_5_${Date.now() + 4}`,
      userId,
      title: 'Dinner at Ramen Izakaya',
      amount: 36.80,
      categoryId: categories[0].id,
      date: twoDaysAgo,
      time: '20:15',
      paymentMethod: 'cash',
      notes: 'Tonkotsu Ramen + Gyoza',
      createdAt: new Date().toISOString()
    }
  ];

  setStoredCategories(userId, categories);
  setStoredExpenses(userId, expenses);

  return { categories, expenses };
};

export interface ExpenzaBackupData {
  version: string;
  exportedAt: string;
  user: User;
  categories: Category[];
  expenses: Expense[];
}

export const exportDataBackup = (user: User, categories: Category[], expenses: Expense[]) => {
  const backup: ExpenzaBackupData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    user,
    categories,
    expenses,
  };
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `expenza-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const parseAndValidateBackup = (jsonString: string): ExpenzaBackupData | null => {
  try {
    const data = JSON.parse(jsonString);
    if (!data || !Array.isArray(data.categories) || !Array.isArray(data.expenses)) {
      return null;
    }
    return data as ExpenzaBackupData;
  } catch {
    return null;
  }
};

