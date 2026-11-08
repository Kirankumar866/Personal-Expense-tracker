/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User, 
  handleFirestoreError, 
  OperationType 
} from '../firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  getDocFromServer
} from 'firebase/firestore';
import { Expense, Activity, UserProfile, BudgetConfig } from '../types/expense';
import { loadStoredExpenses } from '../utils/storage';

interface FirebaseContextType {
  user: User | null;
  authLoading: boolean;
  isCloudConnected: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  addExpenseToCloud: (expense: Expense) => Promise<void>;
  updateExpenseInCloud: (expense: Expense) => Promise<void>;
  deleteExpenseFromCloud: (expenseId: string) => Promise<void>;
  logActivityToCloud: (action: Activity['action'], description: string, amount?: number) => Promise<void>;
  cloudExpenses: Expense[];
  cloudActivities: Activity[];
  cloudProfile: UserProfile | null;
  cloudBudget: BudgetConfig | null;
  syncLocalExpensesToCloud: (localExpenses: Expense[]) => Promise<number>;
  resetToDemoDataInCloud: () => Promise<void>;
  saveProfileToCloud: (profile: UserProfile) => Promise<void>;
  saveBudgetToCloud: (budget: BudgetConfig) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [cloudExpenses, setCloudExpenses] = useState<Expense[]>([]);
  const [cloudActivities, setCloudActivities] = useState<Activity[]>([]);
  const [cloudProfile, setCloudProfile] = useState<UserProfile | null>(null);
  const [cloudBudget, setCloudBudget] = useState<BudgetConfig | null>(null);
  const hasSeededRef = useRef<boolean>(false);

  // 1. Initial connection verification test on boot per skill instructions
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        setIsCloudConnected(true);
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.warn('Firebase connection notice: client is offline or network restricted.');
          setIsCloudConnected(false);
        } else {
          // Connected to Firestore
          setIsCloudConnected(true);
        }
      }
    }
    testConnection();
  }, []);

  // 2. Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      hasSeededRef.current = false;

      // Sync account details upon sign in
      if (currentUser) {
        try {
          const accountRef = doc(db, 'users', currentUser.uid, 'account', 'info');
          await setDoc(
            accountRef,
            {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
              photoURL: currentUser.photoURL || '',
              emailVerified: currentUser.emailVerified || false,
              lastLoginAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (e) {
          console.warn('Account sync notice:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 3. Real-Time Snapshot Listeners for User's Cloud Data in Firestore
  useEffect(() => {
    if (!user) {
      setCloudExpenses([]);
      setCloudActivities([]);
      setCloudProfile(null);
      setCloudBudget(null);
      return;
    }

    // A. Expenses Collection
    const expensesPath = `users/${user.uid}/expenses`;
    const expensesCol = collection(db, 'users', user.uid, 'expenses');
    
    const unsubExpenses = onSnapshot(
      expensesCol,
      async (snapshot) => {
        const items: Expense[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          items.push({
            id: docSnap.id,
            title: d.title || '',
            amount: Number(d.amount) || 0,
            category: d.category || 'other',
            date: d.date || new Date().toISOString(),
            paidBy: d.paidBy || 'me',
            paidByName: d.paidByName || undefined,
            split: d.split || 'none',
            splitWithName: d.splitWithName || undefined,
            splitWithNames: Array.isArray(d.splitWithNames) ? d.splitWithNames : undefined,
            verifiedByFriend: !!d.verifiedByFriend,
            verifiedByNames: Array.isArray(d.verifiedByNames) ? d.verifiedByNames : undefined,
            verifiedAt: d.verifiedAt ? Number(d.verifiedAt) : undefined,
            lastEditedAt: d.lastEditedAt ? Number(d.lastEditedAt) : undefined,
            lastEditedSummary: d.lastEditedSummary || undefined,
            notes: d.notes || '',
            createdAt: Number(d.createdAt) || Date.now(),
          });
        });

        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setCloudExpenses(items);
        setIsCloudConnected(true);

        // If the user has zero cloud docs on first load, seed with current local data
        if (items.length === 0 && !hasSeededRef.current && !snapshot.metadata.hasPendingWrites) {
          hasSeededRef.current = true;
          const defaults = loadStoredExpenses();
          if (defaults.length > 0) {
            for (const exp of defaults) {
              const ref = doc(db, 'users', user.uid, 'expenses', exp.id);
              await setDoc(ref, {
                id: exp.id,
                userId: user.uid,
                title: exp.title,
                amount: Number(exp.amount),
                category: exp.category,
                date: exp.date,
                paidBy: exp.paidBy,
                split: exp.split,
                notes: exp.notes || '',
                createdAt: exp.createdAt || Date.now(),
                updatedAt: new Date().toISOString(),
              }).catch(() => {});
            }
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, expensesPath);
      }
    );

    // B. Activities Feed: users/{uid}/activities
    const activitiesPath = `users/${user.uid}/activities`;
    const activitiesCol = collection(db, 'users', user.uid, 'activities');
    const q = query(activitiesCol, orderBy('timestamp', 'desc'), limit(50));
    const unsubActivities = onSnapshot(
      q,
      (snapshot) => {
        const events: Activity[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          events.push({
            id: docSnap.id,
            userId: d.userId || user.uid,
            userName: d.userName || user.displayName || 'You',
            action: d.action || 'logged_expense',
            description: d.description || '',
            amount: d.amount ? Number(d.amount) : undefined,
            timestamp: d.timestamp || new Date().toISOString(),
          });
        });
        setCloudActivities(events);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, activitiesPath);
      }
    );

    // C. User Profile: users/{uid}/profile/config
    const profileRef = doc(db, 'users', user.uid, 'profile', 'config');
    const unsubProfile = onSnapshot(
      profileRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data();
          setCloudProfile({
            meName: d.meName || user.displayName || 'You',
            friendName: d.friendName || 'Alex',
            meEmail: d.meEmail || user.email || '',
            friendEmail: d.friendEmail || '',
            defaultPaymentMethod: d.defaultPaymentMethod || 'Apple Cash',
          });
        }
      },
      (err) => {
        console.warn('Profile listener notice:', err);
      }
    );

    // D. Budget Config: users/{uid}/profile/budget
    const budgetRef = doc(db, 'users', user.uid, 'profile', 'budget');
    const unsubBudget = onSnapshot(
      budgetRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data();
          setCloudBudget({
            totalMonthlyBudget: Number(d.totalMonthlyBudget) || 1200,
            categoryBudgets: d.categoryBudgets || {},
            currency: d.currency || '$',
            alertThresholdPercent: Number(d.alertThresholdPercent) || 80,
          });
        }
      },
      (err) => {
        console.warn('Budget listener notice:', err);
      }
    );

    return () => {
      unsubExpenses();
      unsubActivities();
      unsubProfile();
      unsubBudget();
    };
  }, [user]);

  // Google Sign-In with popup
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await logActivityToCloud(
          'signed_in',
          `${result.user.displayName || 'User'} connected to Firestore Cloud Database`
        );
      }
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setCloudExpenses([]);
      setCloudActivities([]);
      setCloudProfile(null);
      setCloudBudget(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Add Expense to Firestore
  const addExpenseToCloud = async (expense: Expense) => {
    if (!user) return;
    const path = `users/${user.uid}/expenses/${expense.id}`;
    try {
      const expenseRef = doc(db, 'users', user.uid, 'expenses', expense.id);
      await setDoc(expenseRef, {
        id: expense.id,
        userId: user.uid,
        title: expense.title,
        amount: Number(expense.amount),
        category: expense.category,
        date: expense.date,
        paidBy: expense.paidBy,
        paidByName: expense.paidByName || null,
        split: expense.split,
        splitWithName: expense.splitWithName || null,
        splitWithNames: expense.splitWithNames || null,
        verifiedByFriend: expense.verifiedByFriend || false,
        verifiedByNames: expense.verifiedByNames || null,
        verifiedAt: expense.verifiedAt || null,
        lastEditedAt: expense.lastEditedAt || null,
        lastEditedSummary: expense.lastEditedSummary || null,
        notes: expense.notes || '',
        createdAt: expense.createdAt || Date.now(),
        updatedAt: new Date().toISOString(),
      });

      await logActivityToCloud(
        'logged_expense',
        `Logged "${expense.title}" for $${expense.amount.toFixed(2)} (${expense.paidBy === 'me' ? 'Paid by you' : 'Paid by roommate'})`,
        expense.amount
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  // Update Expense in Firestore
  const updateExpenseInCloud = async (expense: Expense) => {
    if (!user) return;
    const path = `users/${user.uid}/expenses/${expense.id}`;
    try {
      const expenseRef = doc(db, 'users', user.uid, 'expenses', expense.id);
      await setDoc(
        expenseRef,
        {
          id: expense.id,
          userId: user.uid,
          title: expense.title,
          amount: Number(expense.amount),
          category: expense.category,
          date: expense.date,
          paidBy: expense.paidBy,
          paidByName: expense.paidByName || null,
          split: expense.split,
          splitWithName: expense.splitWithName || null,
          splitWithNames: expense.splitWithNames || null,
          verifiedByFriend: expense.verifiedByFriend ?? false,
          verifiedByNames: expense.verifiedByNames || null,
          verifiedAt: expense.verifiedAt ?? null,
          lastEditedAt: expense.lastEditedAt ?? null,
          lastEditedSummary: expense.lastEditedSummary ?? null,
          notes: expense.notes || '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  // Delete Expense from Firestore
  const deleteExpenseFromCloud = async (expenseId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/expenses/${expenseId}`;
    try {
      const expenseRef = doc(db, 'users', user.uid, 'expenses', expenseId);
      await deleteDoc(expenseRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // Log Real-time Activity event
  const logActivityToCloud = async (
    action: Activity['action'],
    description: string,
    amount?: number
  ) => {
    if (!user) return;
    const activityId = `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const path = `users/${user.uid}/activities/${activityId}`;
    try {
      const actRef = doc(db, 'users', user.uid, 'activities', activityId);
      await setDoc(actRef, {
        id: activityId,
        userId: user.uid,
        userName: user.displayName || 'You',
        action,
        description,
        amount: amount !== undefined ? Number(amount) : null,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Activity log notice:', err);
    }
  };

  // Bulk sync local expenses to Firestore
  const syncLocalExpensesToCloud = async (localExpenses: Expense[]): Promise<number> => {
    if (!user || localExpenses.length === 0) return 0;
    let count = 0;
    for (const exp of localExpenses) {
      const path = `users/${user.uid}/expenses/${exp.id}`;
      try {
        const ref = doc(db, 'users', user.uid, 'expenses', exp.id);
        await setDoc(ref, {
          id: exp.id,
          userId: user.uid,
          title: exp.title,
          amount: Number(exp.amount),
          category: exp.category,
          date: exp.date,
          paidBy: exp.paidBy,
          split: exp.split,
          splitWithName: exp.splitWithName || null,
          notes: exp.notes || '',
          createdAt: exp.createdAt || Date.now(),
          updatedAt: new Date().toISOString(),
        });
        count++;
      } catch (err) {
        console.warn(`Failed to sync item ${exp.id}:`, err);
      }
    }

    if (count > 0) {
      await logActivityToCloud(
        'logged_expense',
        `Synced ${count} expenses to Firestore Database`
      );
    }

    return count;
  };

  // Reset to default demo data in cloud
  const resetToDemoDataInCloud = async () => {
    if (!user) return;
    const defaultDummies = loadStoredExpenses();
    await syncLocalExpensesToCloud(defaultDummies);
  };

  // Save User Profile config to Firestore
  const saveProfileToCloud = async (profile: UserProfile) => {
    if (!user) return;
    const path = `users/${user.uid}/profile/config`;
    try {
      const ref = doc(db, 'users', user.uid, 'profile', 'config');
      await setDoc(
        ref,
        {
          userId: user.uid,
          meName: profile.meName,
          friendName: profile.friendName,
          meEmail: profile.meEmail || user.email || '',
          friendEmail: profile.friendEmail,
          defaultPaymentMethod: profile.defaultPaymentMethod,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Profile sync notice:', err);
    }
  };

  // Save Budget config to Firestore
  const saveBudgetToCloud = async (budget: BudgetConfig) => {
    if (!user) return;
    const path = `users/${user.uid}/profile/budget`;
    try {
      const ref = doc(db, 'users', user.uid, 'profile', 'budget');
      await setDoc(
        ref,
        {
          userId: user.uid,
          totalMonthlyBudget: budget.totalMonthlyBudget,
          categoryBudgets: budget.categoryBudgets,
          currency: budget.currency,
          alertThresholdPercent: budget.alertThresholdPercent,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Budget sync notice:', err);
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        authLoading,
        isCloudConnected,
        signInWithGoogle,
        logout,
        addExpenseToCloud,
        updateExpenseInCloud,
        deleteExpenseFromCloud,
        logActivityToCloud,
        cloudExpenses,
        cloudActivities,
        cloudProfile,
        cloudBudget,
        syncLocalExpensesToCloud,
        resetToDemoDataInCloud,
        saveProfileToCloud,
        saveBudgetToCloud,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
