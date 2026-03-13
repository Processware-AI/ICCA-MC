'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { MdEmail, MdLock, MdPerson, MdPhone, MdFavorite, MdArrowBack } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPw: '',
    emName: '', emPhone: '', emRelation: '',
  });

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPw) { toast.error('비밀번호가 일치하지 않습니다.'); return; }
    if (form.password.length < 6) { toast.error('비밀번호는 6자 이상이어야 합니다.'); return; }
    try {
      await register(form.email.trim(), form.password, {
        name: form.name, phone: form.phone,
        emergencyContact: form.emName ? { name: form.emName, phone: form.emPhone, relationship: form.emRelation } : undefined,
      });
      toast.success('가입이 완료되었습니다! 이카산악회에 오신 것을 환영합니다 🏔️');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || '회원가입에 실패했습니다.');
    }
  };

  const Field = ({ icon: Icon, label, name, type = 'text', placeholder, required = false }: {
    icon: any; label: string; name: string; type?: string; placeholder: string; required?: boolean;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}{required && ' *'}</label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
        <input
          type={type} value={form[name as keyof typeof form]} onChange={e => update(name, e.target.value)}
          className="input pl-10" placeholder={placeholder} required={required}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-lg p-8">
        <Link href="/login" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-6 w-fit">
          <MdArrowBack /> 로그인으로 돌아가기
        </Link>

        <h2 className="text-2xl font-bold text-gray-900 mb-1">회원가입</h2>
        <p className="text-gray-500 text-sm mb-6">이카산악회에 가입하세요.</p>

        {/* 진행 표시 */}
        <div className="flex items-center mb-8">
          {[1, 2].map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-400'}`}>{s}</div>
              {i < 1 && <div className={`flex-1 h-1 mx-2 rounded ${step > 1 ? 'bg-primary-700' : 'bg-gray-100'}`} />}
            </div>
          ))}
          <span className="text-xs text-gray-400 ml-3">{step === 1 ? '기본 정보' : '비상 연락처'}</span>
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 ? (
            <div className="space-y-4">
              <Field icon={MdPerson} label="이름" name="name" placeholder="홍길동" required />
              <Field icon={MdEmail} label="이메일" name="email" type="email" placeholder="example@email.com" required />
              <Field icon={MdPhone} label="전화번호" name="phone" placeholder="010-0000-0000" required />
              <Field icon={MdLock} label="비밀번호" name="password" type="password" placeholder="6자 이상 입력" required />
              <Field icon={MdLock} label="비밀번호 확인" name="confirmPw" type="password" placeholder="비밀번호를 다시 입력" required />
              <button type="button" onClick={() => { if (!form.name || !form.email || !form.phone || !form.password) { toast.error('필수 항목을 입력해주세요.'); return; } setStep(2); }} className="btn-primary w-full py-3.5">
                다음
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <strong>비상 연락처 (선택)</strong><br />
                등산 중 응급 상황 시 연락할 분의 정보입니다.
              </div>
              <Field icon={MdPerson} label="비상 연락처 이름" name="emName" placeholder="홍부인" />
              <Field icon={MdPhone} label="비상 연락처 전화번호" name="emPhone" placeholder="010-0000-0000" />
              <Field icon={MdFavorite} label="관계" name="emRelation" placeholder="배우자, 부모님, 자녀 등" />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3.5">이전</button>
                <button type="submit" disabled={isLoading} className="btn-primary flex-1 py-3.5">
                  {isLoading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '가입 완료'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
