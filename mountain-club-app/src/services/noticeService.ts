import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { Notice } from '../types';

export const noticeService = {
  async getNotices(): Promise<Notice[]> {
    const q = query(collection(db, 'notices'), orderBy('isPinned', 'desc'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice));
  },

  async getNotice(id: string): Promise<Notice | null> {
    const docSnap = await getDoc(doc(db, 'notices', id));
    if (!docSnap.exists()) return null;
    await updateDoc(doc(db, 'notices', id), { viewCount: increment(1) });
    return { id: docSnap.id, ...docSnap.data() } as Notice;
  },

  async createNotice(notice: Omit<Notice, 'id' | 'viewCount' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, 'notices'), {
      ...notice,
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  },

  async updateNotice(id: string, data: Partial<Notice>): Promise<void> {
    await updateDoc(doc(db, 'notices', id), {
      ...data as any,
      updatedAt: new Date().toISOString(),
    });
  },

  async deleteNotice(id: string): Promise<void> {
    await deleteDoc(doc(db, 'notices', id));
  },
};
