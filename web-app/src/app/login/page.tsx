'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { MdEmail, MdLock, MdTerrain, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('이메일과 비밀번호를 입력해주세요.'); return; }
    try {
      await login(email.trim(), password);
      router.push('/dashboard');
      toast.success('로그인되었습니다!');
    } catch (err: any) {
      toast.error(err.message || '로그인에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* 왼쪽 배너 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500 flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(5)].map((_, i) => (
            <MdTerrain key={i} className="absolute text-white" style={{ fontSize: `${120 + i * 40}px`, top: `${i * 20}%`, left: `${i * 15}%`, transform: `rotate(${i * 5}deg)` }} />
          ))}
        </div>
        <div className="relative text-center text-white">
          <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
            <MdTerrain className="text-white text-6xl" />
          </div>
          <h1 className="text-4xl font-bold mb-3">이카산악회</h1>
          <p className="text-xl text-white/80 mb-8">ICCA Mountain Club</p>
          <div className="grid grid-cols-3 gap-6 text-center">
            {[['45명', '회원'], ['23회', '연간 산행'], ['5년', '운영']].map(([val, lab]) => (
              <div key={lab} className="bg-white/10 rounded-2xl p-4">
                <p className="text-2xl font-bold">{val}</p>
                <p className="text-sm text-white/70">{lab}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 오른쪽 로그인 폼 */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary-700 flex items-center justify-center">
              <MdTerrain className="text-white text-xl" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">이카산악회</h1>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">로그인</h2>
          <p className="text-gray-500 mb-8">산악회 계정으로 로그인해주세요.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
              <div className="relative">
                <MdEmail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input pl-10" placeholder="이메일을 입력해주세요" required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">비밀번호</label>
              <div className="relative">
                <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="input pl-10 pr-10" placeholder="비밀번호를 입력해주세요" required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <MdVisibilityOff className="text-lg" /> : <MdVisibility className="text-lg" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 text-base">
              {isLoading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '로그인'}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="px-4 text-sm text-gray-400">또는</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <Link href="/register" className="btn-secondary w-full py-3.5 text-base">
            회원가입
          </Link>

          <p className="text-center text-sm text-gray-500 mt-6">
            비밀번호를 잊으셨나요?{' '}
            <button className="text-primary-700 font-medium hover:underline">재설정</button>
          </p>
        </div>
      </div>
    </div>
  );
}
