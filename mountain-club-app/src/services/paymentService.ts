import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { Payment } from '../types';

// Stripe 결제 처리 (실제 서버 API와 연동 필요)
export const paymentService = {
  async getPaymentHistory(userId: string): Promise<Payment[]> {
    const q = query(
      collection(db, 'payments'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
  },

  async createPaymentRecord(payment: Omit<Payment, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'payments'), {
      ...payment,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  async updatePaymentStatus(
    paymentId: string,
    status: Payment['status'],
    transactionId?: string
  ): Promise<void> {
    await updateDoc(doc(db, 'payments', paymentId), {
      status,
      transactionId,
    });
  },

  // 연회비 결제 처리
  async processMembershipFee(userId: string, userName: string, year: number): Promise<Payment> {
    const MEMBERSHIP_FEE = 120000; // 연회비 12만원
    const payment: Omit<Payment, 'id'> = {
      userId,
      userName,
      type: 'membership',
      description: `${year}년 연회비`,
      amount: MEMBERSHIP_FEE,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    const id = await paymentService.createPaymentRecord(payment);
    return { id, ...payment };
  },

  // 이벤트 참가비 결제 처리
  async processEventFee(
    userId: string,
    userName: string,
    eventId: string,
    eventTitle: string,
    amount: number
  ): Promise<Payment> {
    const payment: Omit<Payment, 'id'> = {
      userId,
      userName,
      type: 'event',
      description: `등산 참가비: ${eventTitle}`,
      amount,
      status: 'pending',
      eventId,
      createdAt: new Date().toISOString(),
    };
    const id = await paymentService.createPaymentRecord(payment);
    return { id, ...payment };
  },

  // Stripe PaymentIntent 생성 (백엔드 API 호출)
  async createStripePaymentIntent(amount: number, currency = 'krw'): Promise<{ clientSecret: string }> {
    // 실제 배포 시 백엔드 서버 URL로 교체
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency }),
    });
    if (!response.ok) throw new Error('결제 처리 중 오류가 발생했습니다.');
    return response.json();
  },
};
