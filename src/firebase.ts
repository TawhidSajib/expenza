import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { User, Category, Expense } from './types';

// Initialize Firebase (works automatically with firebase-applet-config.json or Vercel environment variables)
const activeConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
};

const app = initializeApp(activeConfig);
export const db = getFirestore(app, activeConfig.firestoreDatabaseId); /* CRITICAL: Required for named firestore database */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Test Connection on initial boot as required by specification
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Mandatory Firestore Error Handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// User Profile Operations in Firestore
export async function saveUserToFirestore(user: User): Promise<void> {
  const path = `users/${user.id}`;
  try {
    await setDoc(
      doc(db, 'users', user.id),
      {
        id: user.id,
        name: user.name,
        email: user.email || '',
        currency: user.currency || '$',
        monthlyBudget: user.monthlyBudget ?? 2500,
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getUserFromFirestore(userId: string): Promise<User | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as User;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Custom Category Operations in Firestore
export async function saveCategoryToFirestore(userId: string, category: Category): Promise<void> {
  const path = `users/${userId}/categories/${category.id}`;
  try {
    await setDoc(
      doc(db, 'users', userId, 'categories', category.id),
      {
        id: category.id,
        userId: userId,
        name: category.name,
        icon: category.icon,
        color: category.color,
        budget: category.budget ?? 0,
        description: category.description || '',
        createdAt: category.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCategoryFromFirestore(userId: string, categoryId: string): Promise<void> {
  const path = `users/${userId}/categories/${categoryId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'categories', categoryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Expense Operations in Firestore
export async function saveExpenseToFirestore(userId: string, expense: Expense): Promise<void> {
  const path = `users/${userId}/expenses/${expense.id}`;
  try {
    await setDoc(
      doc(db, 'users', userId, 'expenses', expense.id),
      {
        id: expense.id,
        userId: userId,
        title: expense.title,
        amount: Number(expense.amount),
        date: expense.date,
        categoryId: expense.categoryId,
        paymentMethod: expense.paymentMethod,
        notes: expense.notes || '',
        reference: expense.reference || '',
        createdAt: expense.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteExpenseFromFirestore(userId: string, expenseId: string): Promise<void> {
  const path = `users/${userId}/expenses/${expenseId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'expenses', expenseId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Realtime Subscriptions
export function subscribeToCategories(
  userId: string,
  onUpdate: (cats: Category[]) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}/categories`;
  return onSnapshot(
    collection(db, 'users', userId, 'categories'),
    (snapshot) => {
      const cats: Category[] = [];
      snapshot.forEach((d) => cats.push(d.data() as Category));
      onUpdate(cats);
    },
    (error) => {
      console.warn('Realtime category error:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeToExpenses(
  userId: string,
  onUpdate: (exps: Expense[]) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}/expenses`;
  const q = query(collection(db, 'users', userId, 'expenses'), orderBy('date', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const exps: Expense[] = [];
      snapshot.forEach((d) => exps.push(d.data() as Expense));
      onUpdate(exps);
    },
    (error) => {
      console.warn('Realtime expenses error:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// Direct link to Firebase Console so the user can easily see their database on Firebase
export function getFirebaseConsoleUrl(): string {
  return `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data`;
}

export {
  fbSignOut,
  signInWithPopup,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  type FirebaseUser,
};
