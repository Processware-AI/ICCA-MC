import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { HikingEvent } from '../types';

export const eventService = {
  async getEvents(status?: string): Promise<HikingEvent[]> {
    let q = query(collection(db, 'events'), orderBy('date', 'asc'));
    if (status) {
      q = query(collection(db, 'events'), where('status', '==', status), orderBy('date', 'asc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HikingEvent));
  },

  async getUpcomingEvents(count = 5): Promise<HikingEvent[]> {
    const today = new Date().toISOString();
    const q = query(
      collection(db, 'events'),
      where('date', '>=', today),
      where('status', '==', 'upcoming'),
      orderBy('date', 'asc'),
      limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HikingEvent));
  },

  async getEvent(id: string): Promise<HikingEvent | null> {
    const docSnap = await getDoc(doc(db, 'events', id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as HikingEvent;
  },

  async createEvent(event: Omit<HikingEvent, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'events'), {
      ...event,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  async updateEvent(id: string, data: Partial<HikingEvent>): Promise<void> {
    await updateDoc(doc(db, 'events', id), data as any);
  },

  async deleteEvent(id: string): Promise<void> {
    await deleteDoc(doc(db, 'events', id));
  },

  async joinEvent(eventId: string, userId: string): Promise<void> {
    const eventRef = doc(db, 'events', eventId);
    const eventDoc = await getDoc(eventRef);
    if (!eventDoc.exists()) throw new Error('이벤트를 찾을 수 없습니다.');
    const event = eventDoc.data() as HikingEvent;
    if (event.currentParticipants >= event.maxParticipants) {
      throw new Error('참가 인원이 초과되었습니다.');
    }
    await updateDoc(eventRef, {
      participants: arrayUnion(userId),
      currentParticipants: event.currentParticipants + 1,
    });
  },

  async leaveEvent(eventId: string, userId: string): Promise<void> {
    const eventRef = doc(db, 'events', eventId);
    const eventDoc = await getDoc(eventRef);
    if (!eventDoc.exists()) throw new Error('이벤트를 찾을 수 없습니다.');
    const event = eventDoc.data() as HikingEvent;
    await updateDoc(eventRef, {
      participants: arrayRemove(userId),
      currentParticipants: Math.max(0, event.currentParticipants - 1),
    });
  },
};
