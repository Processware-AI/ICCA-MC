import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, arrayUnion, arrayRemove, increment,
  setDoc,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, updateProfile, sendPasswordResetEmail,
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import { User, HikingEvent, Notice, Payment, GalleryPhoto } from '../types';

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const authService = {
  async register(email: string, password: string, userData: Partial<User>): Promise<User> {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: userData.name });
    const user: User = {
      id: cred.user.uid, email,
      name: userData.name || '',
      phone: userData.phone || '',
      membershipLevel: 'general',
      joinDate: new Date().toISOString(),
      isActive: true,
      emergencyContact: userData.emergencyContact,
    };
    await setDoc(doc(db, 'users', cred.user.uid), user);
    return user;
  },

  async login(email: string, password: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if (!snap.exists()) throw new Error('사용자 정보를 찾을 수 없습니다.');
    return snap.data() as User;
  },

  async logout() { await signOut(auth); },

  async getProfile(uid: string): Promise<User | null> {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as User) : null;
  },

  async updateProfile(uid: string, data: Partial<User>) {
    await updateDoc(doc(db, 'users', uid), data as any);
  },

  async resetPassword(email: string) { await sendPasswordResetEmail(auth, email); },
};

// ─── EVENTS ──────────────────────────────────────────────────────────────────
export const eventService = {
  async getAll(status?: string): Promise<HikingEvent[]> {
    let q = status
      ? query(collection(db, 'events'), where('status', '==', status), orderBy('date', 'asc'))
      : query(collection(db, 'events'), orderBy('date', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as HikingEvent));
  },

  async getUpcoming(count = 5): Promise<HikingEvent[]> {
    const q = query(
      collection(db, 'events'),
      where('status', '==', 'upcoming'),
      where('date', '>=', new Date().toISOString()),
      orderBy('date', 'asc'),
      limit(count),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as HikingEvent));
  },

  async getOne(id: string): Promise<HikingEvent | null> {
    const snap = await getDoc(doc(db, 'events', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as HikingEvent) : null;
  },

  async create(data: Omit<HikingEvent, 'id'>): Promise<string> {
    const ref = await addDoc(collection(db, 'events'), { ...data, createdAt: new Date().toISOString() });
    return ref.id;
  },

  async update(id: string, data: Partial<HikingEvent>) {
    await updateDoc(doc(db, 'events', id), data as any);
  },

  async delete(id: string) { await deleteDoc(doc(db, 'events', id)); },

  async join(eventId: string, userId: string) {
    const ref = doc(db, 'events', eventId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('이벤트를 찾을 수 없습니다.');
    const ev = snap.data() as HikingEvent;
    if (ev.currentParticipants >= ev.maxParticipants) throw new Error('참가 인원이 초과되었습니다.');
    await updateDoc(ref, { participants: arrayUnion(userId), currentParticipants: ev.currentParticipants + 1 });
  },

  async leave(eventId: string, userId: string) {
    const ref = doc(db, 'events', eventId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('이벤트를 찾을 수 없습니다.');
    const ev = snap.data() as HikingEvent;
    await updateDoc(ref, { participants: arrayRemove(userId), currentParticipants: Math.max(0, ev.currentParticipants - 1) });
  },
};

// ─── NOTICES ─────────────────────────────────────────────────────────────────
export const noticeService = {
  async getAll(): Promise<Notice[]> {
    const q = query(collection(db, 'notices'), orderBy('isPinned', 'desc'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Notice));
  },

  async getOne(id: string): Promise<Notice | null> {
    const snap = await getDoc(doc(db, 'notices', id));
    if (!snap.exists()) return null;
    await updateDoc(doc(db, 'notices', id), { viewCount: increment(1) });
    return { id: snap.id, ...snap.data() } as Notice;
  },

  async create(data: Omit<Notice, 'id' | 'viewCount' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const ref = await addDoc(collection(db, 'notices'), { ...data, viewCount: 0, createdAt: now, updatedAt: now });
    return ref.id;
  },

  async delete(id: string) { await deleteDoc(doc(db, 'notices', id)); },
};

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
export const paymentService = {
  async getHistory(userId: string): Promise<Payment[]> {
    const q = query(collection(db, 'payments'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
  },

  async create(data: Omit<Payment, 'id'>): Promise<string> {
    const ref = await addDoc(collection(db, 'payments'), { ...data, createdAt: new Date().toISOString() });
    return ref.id;
  },

  async updateStatus(id: string, status: Payment['status'], transactionId?: string) {
    await updateDoc(doc(db, 'payments', id), { status, ...(transactionId && { transactionId }) });
  },
};

// ─── GALLERY ─────────────────────────────────────────────────────────────────
export const galleryService = {
  async getAll(eventId?: string): Promise<GalleryPhoto[]> {
    const q = eventId
      ? query(collection(db, 'gallery'), where('eventId', '==', eventId), orderBy('createdAt', 'desc'))
      : query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryPhoto));
  },

  async upload(file: File, caption: string, uploadedBy: string, uploadedById: string, eventId?: string, eventTitle?: string): Promise<GalleryPhoto> {
    const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    const photo: Omit<GalleryPhoto, 'id'> = { url, caption, uploadedBy, uploadedById, eventId, eventTitle, likes: [], createdAt: new Date().toISOString() };
    const docRef = await addDoc(collection(db, 'gallery'), photo);
    return { id: docRef.id, ...photo };
  },

  async delete(id: string, url: string) {
    await deleteDoc(doc(db, 'gallery', id));
    try { await deleteObject(ref(storage, url)); } catch {}
  },

  async toggleLike(photoId: string, userId: string, isLiked: boolean) {
    await updateDoc(doc(db, 'gallery', photoId), {
      likes: isLiked ? arrayRemove(userId) : arrayUnion(userId),
    });
  },

  async getMembers(): Promise<User[]> {
    const q = query(collection(db, 'users'), orderBy('name'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as User);
  },
};

export const memberService = {
  async getAll(): Promise<User[]> {
    const q = query(collection(db, 'users'), orderBy('name'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as User);
  },
};
