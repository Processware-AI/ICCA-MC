'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { eventService, noticeService } from '@/lib/services';
import { HikingEvent, Notice } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  MdCalendarMonth, MdCampaign, MdPhotoLibrary, MdPeople,
  MdPayment, MdArrowForward, MdLocationOn, MdSchedule,
  MdPushPin, MdTerrain,
} from 'react-icons/md';
import { clsx } from 'clsx';

const DIFFICULTY_MAP = {
  easy: { label: '쉬움', cls: 'bg-green-100 text-green-700' },
  medium: { label: '보통', cls: 'bg-amber-100 text-amber-700' },
  hard: { label: '어려움', cls: 'bg-red-100 text-red-700' },
};

const QUICK_MENUS = [
  { href: '/events', icon: MdCalendarMonth, label: '등산 일정', desc: '다가오는 산행 일정', color: 'bg-emerald-50 text-emerald-700' },
  { href: '/notices', icon: MdCampaign, label: '공지사항', desc: '최신 공지 확인', color: 'bg-blue-50 text-blue-700' },
  { href: '/gallery', icon: MdPhotoLibrary, label: '사진 갤러리', desc: '등산 사진 공유', color: 'bg-amber-50 text-amber-700' },
  { href: '/members', icon: MdPeople, label: '회원 목록', desc: '회원 정보 조회', color: 'bg-purple-50 text-purple-700' },
  { href: '/payment', icon: MdPayment, label: '연회비 납부', desc: '120,000원/년', color: 'bg-rose-50 text-rose-700' },
];

const SAMPLE_EVENTS: HikingEvent[] = [
  { id: '1', title: '북한산 백운대 코스', mountain: '북한산', date: new Date(Date.now() + 7 * 86400000).toISOString(), meetingPoint: '북한산성 탐방지원센터', meetingTime: '오전 8:00', difficulty: 'medium', maxParticipants: 20, currentParticipants: 12, participants: [], fee: 15000, leader: '김철수', status: 'upcoming', images: [], description: '', createdAt: new Date().toISOString() },
  { id: '2', title: '관악산 연주대 코스', mountain: '관악산', date: new Date(Date.now() + 14 * 86400000).toISOString(), meetingPoint: '관악산 입구', meetingTime: '오전 9:00', difficulty: 'easy', maxParticipants: 15, currentParticipants: 7, participants: [], fee: 10000, leader: '이영희', status: 'upcoming', images: [], description: '', createdAt: new Date().toISOString() },
];

const SAMPLE_NOTICES: Notice[] = [
  { id: '1', title: '[중요] 2024년 연간 등산 일정 및 연회비 납부 안내', author: '관리자', authorId: 'admin', category: 'important', isPinned: true, createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString(), viewCount: 89, content: '' },
  { id: '2', title: '3월 북한산 산행 참가자 모집', author: '총무', authorId: 'secretary', category: 'event', isPinned: false, createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), updatedAt: new Date().toISOString(), viewCount: 45, content: '' },
  { id: '3', title: '겨울 등산 안전 수칙 안내', author: '안전담당', authorId: 'safety', category: 'safety', isPinned: false, createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), updatedAt: new Date().toISOString(), viewCount: 62, content: '' },
];

const NOTICE_CAT: Record<string, string> = {
  general: 'bg-blue-100 text-blue-700',
  important: 'bg-red-100 text-red-700',
  event: 'bg-amber-100 text-amber-700',
  safety: 'bg-orange-100 text-orange-700',
};
const NOTICE_LABEL: Record<string, string> = { general: '일반', important: '중요', event: '행사', safety: '안전' };

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<HikingEvent[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ev, no] = await Promise.all([eventService.getUpcoming(3), noticeService.getAll()]);
        setEvents(ev.length ? ev : SAMPLE_EVENTS);
        setNotices(no.length ? no.slice(0, 4) : SAMPLE_NOTICES);
      } catch {
        setEvents(SAMPLE_EVENTS);
        setNotices(SAMPLE_NOTICES);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? '좋은 아침입니다' : hour < 18 ? '안녕하세요' : '좋은 저녁입니다';

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* 환영 배너 */}
        <div className="bg-gradient-to-r from-primary-800 via-primary-700 to-primary-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
            <MdTerrain className="text-white" style={{ fontSize: '300px', marginTop: '-60px', marginRight: '-40px' }} />
          </div>
          <div className="relative">
            <p className="text-white/80 text-sm font-medium mb-1">{greeting},</p>
            <h1 className="text-3xl font-bold mb-2">{user?.name || '회원'}님 👋</h1>
            <p className="text-white/80">오늘도 힘차게 산에 오릅시다!</p>
          </div>
          <div className="relative mt-6 grid grid-cols-3 gap-4 max-w-md">
            {[['23회', '총 참가 산행'], ['1,240m', '최고 등반 고도'], ['45명', '산악회 회원']].map(([val, lab]) => (
              <div key={lab} className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
                <p className="text-xl font-bold">{val}</p>
                <p className="text-xs text-white/70 mt-0.5">{lab}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 빠른 메뉴 */}
        <div>
          <h2 className="section-title">빠른 메뉴</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {QUICK_MENUS.map(({ href, icon: Icon, label, desc, color }) => (
              <Link key={href} href={href} className="card hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer p-5 flex flex-col items-center text-center gap-3">
                <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center', color)}>
                  <Icon className="text-2xl" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 다가오는 일정 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">다가오는 등산 일정</h2>
              <Link href="/events" className="text-sm text-primary-700 font-medium flex items-center gap-1 hover:underline">
                전체 보기 <MdArrowForward />
              </Link>
            </div>
            <div className="space-y-3">
              {loading ? (
                [...Array(2)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-100" />)
              ) : events.map(event => {
                const diff = DIFFICULTY_MAP[event.difficulty];
                return (
                  <Link key={event.id} href={`/events/${event.id}`} className="card hover:shadow-md transition-all hover:-translate-y-0.5 flex gap-4 items-center p-4 cursor-pointer">
                    <div className="bg-primary-700 rounded-xl px-3 py-2 text-center text-white min-w-[52px]">
                      <p className="text-xs opacity-80">{format(new Date(event.date), 'M월', { locale: ko })}</p>
                      <p className="text-2xl font-bold leading-tight">{format(new Date(event.date), 'd')}</p>
                      <p className="text-xs opacity-80">{format(new Date(event.date), 'EEE', { locale: ko })}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{event.title}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        <MdLocationOn className="text-xs flex-shrink-0" />{event.mountain}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={clsx('badge text-xs', diff.cls)}>{diff.label}</span>
                        <span className="text-xs text-gray-400">{event.currentParticipants}/{event.maxParticipants}명</span>
                        {event.fee > 0 && <span className="text-xs text-amber-600 font-semibold">{event.fee.toLocaleString()}원</span>}
                      </div>
                    </div>
                    <MdArrowForward className="text-gray-300 flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 최근 공지사항 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">최근 공지사항</h2>
              <Link href="/notices" className="text-sm text-primary-700 font-medium flex items-center gap-1 hover:underline">
                전체 보기 <MdArrowForward />
              </Link>
            </div>
            <div className="card divide-y divide-gray-100 p-0 overflow-hidden">
              {loading ? (
                [...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse bg-gray-100 border-b border-white" />)
              ) : notices.map(notice => (
                <Link key={notice.id} href={`/notices/${notice.id}`} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  {notice.isPinned && <MdPushPin className="text-primary-500 flex-shrink-0 text-sm" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{notice.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={clsx('badge text-xs', NOTICE_CAT[notice.category])}>{NOTICE_LABEL[notice.category]}</span>
                      <span className="text-xs text-gray-400">{format(new Date(notice.createdAt), 'MM.dd', { locale: ko })}</span>
                    </div>
                  </div>
                  <MdArrowForward className="text-gray-300 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
