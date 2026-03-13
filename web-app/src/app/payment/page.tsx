'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { paymentService } from '@/lib/services';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { MdCreditCard, MdChat, MdLanguage, MdPhoneIphone, MdLock, MdShield, MdCheckCircle } from 'react-icons/md';

const METHODS = [
  { value: 'card', label: '신용/체크카드', desc: '국내외 모든 카드', icon: MdCreditCard, color: 'text-primary-700 bg-primary-50' },
  { value: 'kakao', label: '카카오페이', desc: '카카오페이 간편결제', icon: MdChat, color: 'text-yellow-700 bg-yellow-50' },
  { value: 'naver', label: '네이버페이', desc: '네이버페이 간편결제', icon: MdLanguage, color: 'text-green-700 bg-green-50' },
  { value: 'toss', label: '토스페이', desc: '토스 간편결제', icon: MdPhoneIphone, color: 'text-blue-700 bg-blue-50' },
];

function PaymentContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const type = (params.get('type') || 'membership') as 'membership' | 'event';
  const eventId = params.get('eventId') || undefined;
  const eventTitle = params.get('eventTitle') || '';
  const amount = parseInt(params.get('amount') || '120000');

  const description = type === 'membership' ? `${new Date().getFullYear()}년 연회비` : `등산 참가비: ${eventTitle}`;

  const [method, setMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handlePay = async () => {
    if (!user) { toast.error('로그인이 필요합니다.'); return; }
    setLoading(true);
    try {
      let payment;
      if (type === 'membership') {
        payment = await paymentService.create({ userId: user.id, userName: user.name, type: 'membership', description, amount, status: 'pending', createdAt: new Date().toISOString() });
      } else {
        payment = await paymentService.create({ userId: user.id, userName: user.name, type: 'event', description, amount, status: 'pending', eventId, createdAt: new Date().toISOString() });
      }
      // 결제 성공 처리 (실제 배포 시 Stripe PaymentIntent 연동)
      await paymentService.updateStatus(payment, 'completed', `TXN_${Date.now()}`);
      setDone(true);
    } catch (e: any) {
      toast.error(e.message || '결제 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <MdCheckCircle className="text-5xl text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">결제 완료!</h2>
        <p className="text-gray-500 mb-2">{description}</p>
        <p className="text-3xl font-bold text-primary-700 mb-8">{amount.toLocaleString()}원</p>
        <div className="flex gap-3">
          <button onClick={() => router.push('/payment/history')} className="btn-secondary">결제 내역 보기</button>
          <button onClick={() => router.push('/dashboard')} className="btn-primary">홈으로</button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {/* 왼쪽: 결제 정보 */}
      <div className="space-y-5">
        <div className="bg-gradient-to-br from-primary-800 to-primary-600 rounded-2xl p-8 text-white text-center">
          <p className="text-white/70 text-sm mb-2">{type === 'membership' ? '연회비 납부' : '등산 참가비'}</p>
          <p className="text-xl font-semibold mb-1">{description}</p>
          <p className="text-4xl font-bold mt-4">{amount.toLocaleString()}원</p>
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">결제 요약</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-500">{description}</span><span className="font-medium">{amount.toLocaleString()}원</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">수수료</span><span className="font-medium">0원</span></div>
            <div className="border-t border-gray-100 pt-3 flex justify-between"><span className="font-bold">총 결제 금액</span><span className="font-bold text-primary-700 text-lg">{amount.toLocaleString()}원</span></div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          <p className="font-medium mb-1">안내사항</p>
          <p>결제 완료 후 취소를 원하시면 총무에게 문의해 주세요. 환불은 영업일 기준 3~5일 소요됩니다.</p>
        </div>
      </div>

      {/* 오른쪽: 결제 방법 */}
      <div className="space-y-5">
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">결제 방법 선택</h3>
          <div className="space-y-3">
            {METHODS.map(m => (
              <button key={m.value} onClick={() => setMethod(m.value)} className={clsx('w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all', method === m.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300')}>
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', m.color)}>
                  <m.icon className="text-xl" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900 text-sm">{m.label}</p>
                  <p className="text-xs text-gray-400">{m.desc}</p>
                </div>
                <div className={clsx('w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0', method === m.value ? 'border-primary-500' : 'border-gray-300')}>
                  {method === m.value && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <button onClick={handlePay} disabled={loading} className="btn-primary w-full py-4 text-base">
          {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><MdLock />{amount.toLocaleString()}원 결제하기</>}
        </button>

        <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
          <MdShield />안전한 결제 (SSL 암호화)
        </p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">결제</h1>
        <Suspense fallback={<div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary-700 border-t-transparent rounded-full animate-spin" /></div>}>
          <PaymentContent />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
