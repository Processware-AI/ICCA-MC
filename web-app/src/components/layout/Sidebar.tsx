'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { clsx } from 'clsx';
import {
  MdHome, MdCalendarMonth, MdCampaign, MdPhotoLibrary,
  MdPeople, MdPerson, MdPayment, MdReceipt, MdTerrain, MdLogout,
} from 'react-icons/md';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { href: '/dashboard', icon: MdHome, label: '홈' },
  { href: '/events', icon: MdCalendarMonth, label: '등산 일정' },
  { href: '/notices', icon: MdCampaign, label: '공지사항' },
  { href: '/gallery', icon: MdPhotoLibrary, label: '사진 갤러리' },
  { href: '/members', icon: MdPeople, label: '회원 목록' },
  { href: '/payment', icon: MdPayment, label: '연회비 납부' },
  { href: '/payment/history', icon: MdReceipt, label: '결제 내역' },
  { href: '/profile', icon: MdPerson, label: '내 정보' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    toast.success('로그아웃되었습니다.');
    window.location.href = '/login';
  };

  const getMembershipBadge = (level: string) => {
    if (level === 'admin') return { label: '관리자', cls: 'bg-red-100 text-red-700' };
    if (level === 'senior') return { label: '선임', cls: 'bg-amber-100 text-amber-700' };
    return { label: '일반', cls: 'bg-primary-100 text-primary-700' };
  };

  const badge = getMembershipBadge(user?.membershipLevel || 'general');

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* 로고 */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-700 flex items-center justify-center">
            <MdTerrain className="text-white text-xl" />
          </div>
          <div>
            <p className="font-bold text-gray-900 leading-tight">이카산악회</p>
            <p className="text-xs text-gray-500">ICCA Mountain Club</p>
          </div>
        </div>
      </div>

      {/* 프로필 */}
      {user && (
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
              {user.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
              <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', badge.cls)}>{badge.label}</span>
            </div>
          </div>
        </div>
      )}

      {/* 내비게이션 */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className={clsx('text-lg flex-shrink-0', active ? 'text-primary-700' : 'text-gray-400')} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 로그아웃 */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
        >
          <MdLogout className="text-lg text-gray-400" />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
