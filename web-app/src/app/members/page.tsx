'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { memberService } from '@/lib/services';
import { User } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { clsx } from 'clsx';
import { MdSearch, MdPeople, MdPhone } from 'react-icons/md';

const LEVEL: Record<string, { label: string; cls: string }> = {
  admin: { label: '관리자', cls: 'bg-red-100 text-red-700' },
  senior: { label: '선임', cls: 'bg-amber-100 text-amber-700' },
  general: { label: '일반', cls: 'bg-primary-100 text-primary-700' },
};

const SAMPLE: User[] = [
  { id: '1', name: '김철수', email: 'kim@example.com', phone: '010-1234-5678', membershipLevel: 'admin', joinDate: '2020-01-01T00:00:00Z', isActive: true },
  { id: '2', name: '이영희', email: 'lee@example.com', phone: '010-2345-6789', membershipLevel: 'senior', joinDate: '2021-03-15T00:00:00Z', isActive: true },
  { id: '3', name: '박민준', email: 'park@example.com', phone: '010-3456-7890', membershipLevel: 'general', joinDate: '2022-05-20T00:00:00Z', isActive: true },
  { id: '4', name: '최지현', email: 'choi@example.com', phone: '010-4567-8901', membershipLevel: 'general', joinDate: '2023-01-10T00:00:00Z', isActive: true },
  { id: '5', name: '정수아', email: 'jung@example.com', phone: '010-5678-9012', membershipLevel: 'general', joinDate: '2023-06-01T00:00:00Z', isActive: true },
  { id: '6', name: '한도영', email: 'han@example.com', phone: '010-6789-0123', membershipLevel: 'senior', joinDate: '2021-09-12T00:00:00Z', isActive: true },
  { id: '7', name: '오세진', email: 'oh@example.com', phone: '010-7890-1234', membershipLevel: 'general', joinDate: '2022-11-30T00:00:00Z', isActive: true },
  { id: '8', name: '윤미래', email: 'yoon@example.com', phone: '010-8901-2345', membershipLevel: 'general', joinDate: '2024-01-15T00:00:00Z', isActive: true },
];

export default function MembersPage() {
  const { user: currentUser } = useAuthStore();
  const [members, setMembers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const isAdmin = currentUser?.membershipLevel === 'admin';

  useEffect(() => {
    (async () => {
      try {
        const data = await memberService.getAll();
        setMembers(data.length ? data : SAMPLE);
        setFiltered(data.length ? data : SAMPLE);
      } catch { setMembers(SAMPLE); setFiltered(SAMPLE); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(members); return; }
    const q = search.toLowerCase();
    setFiltered(members.filter(m => m.name.toLowerCase().includes(q) || m.phone?.includes(q) || m.email?.toLowerCase().includes(q)));
  }, [search, members]);

  const levelCounts = {
    total: members.length,
    admin: members.filter(m => m.membershipLevel === 'admin').length,
    senior: members.filter(m => m.membershipLevel === 'senior').length,
    general: members.filter(m => m.membershipLevel === 'general').length,
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">회원 목록</h1>

        {/* 통계 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: '전체 회원', value: levelCounts.total, cls: 'text-gray-700' },
            { label: '관리자', value: levelCounts.admin, cls: 'text-red-600' },
            { label: '선임 회원', value: levelCounts.senior, cls: 'text-amber-600' },
            { label: '일반 회원', value: levelCounts.general, cls: 'text-primary-700' },
          ].map(s => (
            <div key={s.label} className="card text-center">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className={clsx('text-2xl font-bold', s.cls)}>{s.value}명</p>
            </div>
          ))}
        </div>

        {/* 검색 */}
        <div className="relative mb-5">
          <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-11" placeholder="이름, 이메일, 전화번호로 검색..."
          />
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-100" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center py-16 text-center">
            <MdPeople className="text-6xl text-gray-300 mb-4" />
            <p className="text-gray-500">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(member => {
              const level = LEVEL[member.membershipLevel];
              return (
                <div key={member.id} className="card flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className={clsx('w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0', member.membershipLevel === 'admin' ? 'bg-red-100 text-red-700' : member.membershipLevel === 'senior' ? 'bg-amber-100 text-amber-700' : 'bg-primary-100 text-primary-700')}>
                    {member.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{member.name}</p>
                      <span className={clsx('badge text-xs', level.cls)}>{level.label}</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {format(new Date(member.joinDate), 'yyyy년 M월 가입', { locale: ko })}
                    </p>
                    {isAdmin && member.phone && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MdPhone className="text-xs" />{member.phone}
                      </p>
                    )}
                  </div>
                  {isAdmin && member.phone && (
                    <a href={`tel:${member.phone}`} className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-700 hover:bg-primary-100 transition-colors flex-shrink-0">
                      <MdPhone />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
