// Custom hook for Firebase Authentication
'use client';

import { auth, db } from '@/lib/firebase';
import {
    User,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'operator' | 'viewer';
  createdAt: Date;
  lastLogin: Date;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login
      await setDoc(
        doc(db, 'users', result.user.uid),
        { lastLogin: new Date() },
        { merge: true }
      );
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email: string, password: string, name: string, role: 'admin' | 'operator' | 'viewer' = 'viewer') => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email,
        name,
        role,
        createdAt: new Date(),
        lastLogin: new Date(),
      });
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: userProfile?.role === 'admin',
    isOperator: userProfile?.role === 'operator' || userProfile?.role === 'admin',
  };
}
