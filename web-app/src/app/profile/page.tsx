'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { MdPerson, MdEmail, MdPhone, MdCalendarMonth, MdEmergency, MdCreditCard, MdReceipt, MdPeople, MdEdit, MdSave, MdLogout } from 'react-icons/md';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, updateProfile } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', emName: user?.emergencyContact?.name || '', emPhone: user?.emergencyContact?.phone || '', emRelation: user?.emergencyContact?.relationship || '' });

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({ name: form.name, phone: form.phone, emergencyContact: form.emName ? { name: form.emName, phone: form.emPhone, relationship: form.emRelation } : undefined });
      toast.success('프로필이 수정되었습니다.');
      setEditing(false);
    } catch { toast.error('수정에 실패했습니다.'); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    await logout();
    toast.success('로그아웃되었습니다.');
    router.push('/login');
  };

  const getLevelBadge = (level: string) => {
    if (level === 'admin') return { label: '관리자', cls: 'bg-red-100 text-red-700' };
    if (level === 'senior') return { label: '선임 회원', cls: 'bg-amber-100 text-amber-700' };
    return { label: '일반 회원', cls: 'bg-primary-100 text-primary-700' };
  };
  const badge = getLevelBadge(user?.membershipLevel || 'general');

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">내 정보</h1>

        {/* 프로필 카드 */}
        <div className="bg-gradient-to-r from-primary-800 to-primary-600 rounded-2xl p-8 text-white">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-4xl font-bold">
              {user?.name?.[0] || '?'}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user?.name}</h2>
              <p className="text-white/70 text-sm mt-1">{user?.email}</p>
              <span className={clsx('badge mt-2', badge.cls)}>{badge.label}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[['23회', '참가 산행'], ['15장', '올린 사진'], ['42', '좋아요']].map(([v, l]) => (
              <div key={l} className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-xl font-bold">{v}</p>
                <p className="text-xs text-white/70">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 개인 정보 */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">개인 정보</h2>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm text-primary-700 font-medium hover:underline">
                <MdEdit />수정
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="text-sm text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100">취소</button>
                <button onClick={handleSave} disabled={loading} className="btn-primary py-1.5 px-3 text-sm">
                  {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><MdSave />저장</>}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {editing ? (
              <>
                <EditField icon={MdPerson} label="이름" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} />
                <EditField icon={MdPhone} label="전화번호" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">비상 연락처</p>
                  <EditField icon={MdPerson} label="이름" value={form.emName} onChange={v => setForm(p => ({ ...p, emName: v }))} placeholder="비상 연락처 이름" />
                  <EditField icon={MdPhone} label="전화번호" value={form.emPhone} onChange={v => setForm(p => ({ ...p, emPhone: v }))} placeholder="비상 연락처 번호" />
                  <EditField icon={MdEmergency} label="관계" value={form.emRelation} onChange={v => setForm(p => ({ ...p, emRelation: v }))} placeholder="예: 배우자, 부모님" />
                </div>
              </>
            ) : (
              <>
                <InfoRow icon={MdPerson} label="이름" value={user?.name || '-'} />
                <InfoRow icon={MdEmail} label="이메일" value={user?.email || '-'} />
                <InfoRow icon={MdPhone} label="전화번호" value={user?.phone || '-'} />
                <InfoRow icon={MdCalendarMonth} label="가입일" value={user?.joinDate ? format(new Date(user.joinDate), 'yyyy년 M월 d일', { locale: ko }) : '-'} />
                {user?.emergencyContact && (
                  <>
                    <div className="border-t border-gray-100 pt-4 pb-1"><p className="text-sm font-medium text-gray-500">비상 연락처</p></div>
                    <InfoRow icon={MdPerson} label="이름" value={`${user.emergencyContact.name} (${user.emergencyContact.relationship})`} />
                    <InfoRow icon={MdPhone} label="전화번호" value={user.emergencyContact.phone} />
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* 빠른 메뉴 */}
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">바로가기</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: '/payment', icon: MdCreditCard, label: '연회비 납부', cls: 'bg-primary-50 text-primary-700' },
              { href: '/payment/history', icon: MdReceipt, label: '결제 내역', cls: 'bg-gray-50 text-gray-700' },
              { href: '/members', icon: MdPeople, label: '회원 목록', cls: 'bg-blue-50 text-blue-700' },
            ].map(({ href, icon: Icon, label, cls }) => (
              <Link key={href} href={href} className={clsx('flex flex-col items-center gap-2 p-4 rounded-xl hover:opacity-80 transition-opacity cursor-pointer', cls)}>
                <Icon className="text-2xl" />
                <span className="text-xs font-medium text-center">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 로그아웃 */}
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-red-200 text-red-500 font-semibold hover:bg-red-50 transition-colors">
          <MdLogout />로그아웃
        </button>

        <p className="text-center text-gray-400 text-xs">이카산악회 v1.0.0</p>
      </div>
    </DashboardLayout>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
      <Icon className="text-gray-400 text-lg flex-shrink-0" />
      <span className="text-gray-500 text-sm w-20 flex-shrink-0">{label}</span>
      <span className="font-medium text-gray-900 text-sm">{value}</span>
    </div>
  );
}

function EditField({ icon: Icon, label, value, onChange, placeholder }: { icon: any; label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="mb-3">
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={value} onChange={e => onChange(e.target.value)} className="input pl-9" placeholder={placeholder || label} />
      </div>
    </div>
  );
}
