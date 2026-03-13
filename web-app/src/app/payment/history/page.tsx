'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { paymentService } from '@/lib/services';
import { Payment } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { clsx } from 'clsx';
import { MdCreditCard, MdTerrain, MdBuild, MdCheckCircle, MdHourglassEmpty, MdError, MdUndo, MdReceipt } from 'react-icons/md';

const STATUS: Record<string, { label: string; cls: string; icon: any }> = {
  pending: { label: '처리 중', cls: 'bg-amber-100 text-amber-700', icon: MdHourglassEmpty },
  completed: { label: '완료', cls: 'bg-green-100 text-green-700', icon: MdCheckCircle },
  failed: { label: '실패', cls: 'bg-red-100 text-red-700', icon: MdError },
  refunded: { label: '환불', cls: 'bg-blue-100 text-blue-700', icon: MdUndo },
};

const TYPE: Record<string, { label: string; icon: any; color: string }> = {
  membership: { label: '연회비', icon: MdCreditCard, color: 'bg-primary-100 text-primary-700' },
  event: { label: '참가비', icon: MdTerrain, color: 'bg-amber-100 text-amber-700' },
  equipment: { label: '장비', icon: MdBuild, color: 'bg-blue-100 text-blue-700' },
};

const SAMPLE: Payment[] = [
  { id: '1', userId: 'u1', userName: '홍길동', type: 'membership', description: '2024년 연회비', amount: 120000, status: 'completed', transactionId: 'TXN_001', createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: '2', userId: 'u1', userName: '홍길동', type: 'event', description: '등산 참가비: 북한산 정기 산행', amount: 15000, status: 'completed', eventId: 'e1', transactionId: 'TXN_002', createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: '3', userId: 'u1', userName: '홍길동', type: 'event', description: '등산 참가비: 설악산 원정', amount: 80000, status: 'completed', eventId: 'e2', transactionId: 'TXN_003', createdAt: new Date(Date.now() - 60 * 86400000).toISOString() },
];

export default function PaymentHistoryPage() {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const data = await paymentService.getHistory(user.id);
        setPayments(data.length ? data : SAMPLE);
      } catch { setPayments(SAMPLE); }
      finally { setLoading(false); }
    })();
  }, [user]);

  const totalPaid = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">결제 내역</h1>

        {/* 요약 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: '총 결제 금액', value: `${totalPaid.toLocaleString()}원`, cls: 'text-primary-700' },
            { label: '완료 건수', value: `${payments.filter(p => p.status === 'completed').length}건`, cls: 'text-green-600' },
            { label: '전체 건수', value: `${payments.length}건`, cls: 'text-gray-700' },
          ].map(s => (
            <div key={s.label} className="card text-center">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={clsx('text-xl font-bold', s.cls)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* 목록 */}
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card h-20 animate-pulse bg-gray-100" />)}</div>
        ) : payments.length === 0 ? (
          <div className="card flex flex-col items-center py-16 text-center">
            <MdReceipt className="text-6xl text-gray-300 mb-4" />
            <p className="text-gray-500">결제 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden divide-y divide-gray-100">
            {payments.map(p => {
              const status = STATUS[p.status];
              const type = TYPE[p.type];
              const StatusIcon = status.icon;
              return (
                <div key={p.id} className="flex items-center gap-4 p-5">
                  <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', type.color)}>
                    <type.icon className="text-xl" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{p.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{format(new Date(p.createdAt), 'yyyy.MM.dd HH:mm', { locale: ko })}</p>
                    <span className={clsx('badge text-xs mt-1.5 flex items-center gap-1 w-fit', status.cls)}>
                      <StatusIcon className="text-xs" />{status.label}
                    </span>
                  </div>
                  <p className={clsx('font-bold text-base flex-shrink-0', p.status === 'refunded' ? 'text-blue-600' : p.status === 'failed' ? 'text-gray-400' : 'text-gray-900')}>
                    {p.amount.toLocaleString()}원
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
