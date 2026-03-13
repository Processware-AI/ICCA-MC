import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '../types';

export const authService = {
  async register(email: string, password: string, userData: Partial<User>): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    await updateProfile(firebaseUser, { displayName: userData.name });

    const newUser: User = {
      id: firebaseUser.uid,
      email: email,
      name: userData.name || '',
      phone: userData.phone || '',
      membershipLevel: 'general',
      joinDate: new Date().toISOString(),
      isActive: true,
      emergencyContact: userData.emergencyContact,
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    return newUser;
  },

  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (!userDoc.exists()) throw new Error('사용자 정보를 찾을 수 없습니다.');
    return userDoc.data() as User;
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  async getUserProfile(uid: string): Promise<User | null> {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return null;
    return userDoc.data() as User;
  },

  async updateUserProfile(uid: string, data: Partial<User>): Promise<void> {
    await updateDoc(doc(db, 'users', uid), data as any);
  },

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },

  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },
};
