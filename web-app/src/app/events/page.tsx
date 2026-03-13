'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { eventService } from '@/lib/services';
import { HikingEvent } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { clsx } from 'clsx';
import { MdAdd, MdLocationOn, MdPeople, MdPayment, MdCalendarMonth, MdAccessTime } from 'react-icons/md';

const TABS = ['전체', '예정', '완료'];
const DIFF = {
  easy: { label: '쉬움', cls: 'bg-green-100 text-green-700' },
  medium: { label: '보통', cls: 'bg-amber-100 text-amber-700' },
  hard: { label: '어려움', cls: 'bg-red-100 text-red-700' },
};

const SAMPLE_EVENTS: HikingEvent[] = [
  { id: '1', title: '북한산 백운대 코스', description: '북한산 최고봉 백운대(836.5m)를 오르는 코스입니다.', mountain: '북한산', date: new Date(Date.now() + 7 * 86400000).toISOString(), meetingPoint: '북한산성 탐방지원센터', meetingTime: '오전 8:00', difficulty: 'medium', maxParticipants: 20, currentParticipants: 12, participants: [], fee: 15000, leader: '김철수', status: 'upcoming', images: [], distance: 7.5, elevationGain: 836, estimatedDuration: '5~6시간', createdAt: new Date().toISOString() },
  { id: '2', title: '관악산 연주대 코스', description: '관악산 정상 연주대를 목표로 합니다.', mountain: '관악산', date: new Date(Date.now() + 14 * 86400000).toISOString(), meetingPoint: '관악산 입구', meetingTime: '오전 9:00', difficulty: 'easy', maxParticipants: 15, currentParticipants: 7, participants: [], fee: 10000, leader: '이영희', status: 'upcoming', images: [], createdAt: new Date().toISOString() },
  { id: '3', title: '설악산 대청봉 원정', description: '설악산 최고봉 대청봉(1,708m) 1박 2일 원정 산행.', mountain: '설악산', date: new Date(Date.now() + 21 * 86400000).toISOString(), meetingPoint: '서울역 집결', meetingTime: '오전 6:00', difficulty: 'hard', maxParticipants: 10, currentParticipants: 10, participants: [], fee: 80000, leader: '박민준', status: 'upcoming', images: [], createdAt: new Date().toISOString() },
  { id: '4', title: '도봉산 신년 산행', description: '새해를 맞이하는 도봉산 정기 산행입니다.', mountain: '도봉산', date: new Date(Date.now() - 30 * 86400000).toISOString(), meetingPoint: '도봉산역', meetingTime: '오전 8:30', difficulty: 'medium', maxParticipants: 25, currentParticipants: 22, participants: [], fee: 12000, leader: '김철수', status: 'completed', images: [], createdAt: new Date().toISOString() },
];

export default function EventsPage() {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<HikingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const isAdmin = user?.membershipLevel === 'admin';

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const statusMap: any = { 0: undefined, 1: 'upcoming', 2: 'completed' };
        const data = await eventService.getAll(statusMap[tab]);
        setEvents(data.length ? data : SAMPLE_EVENTS.filter(e => tab === 0 ? true : tab === 1 ? e.status === 'upcoming' : e.status === 'completed'));
      } catch {
        setEvents(SAMPLE_EVENTS.filter(e => tab === 0 ? true : tab === 1 ? e.status === 'upcoming' : e.status === 'completed'));
      } finally {
        setLoading(false);
      }
    })();
  }, [tab]);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">등산 일정</h1>
            <p className="text-gray-500 text-sm mt-1">이카산악회 산행 일정을 확인하세요.</p>
          </div>
          {isAdmin && (
            <Link href="/events/create" className="btn-primary">
              <MdAdd className="text-xl" /> 일정 등록
            </Link>
          )}
        </div>

        {/* 탭 */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} className={clsx('px-5 py-2 rounded-lg text-sm font-semibold transition-all', tab === i ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              {t}
            </button>
          ))}
        </div>

        {/* 목록 */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(3)].map((_, i) => <div key={i} className="card h-48 animate-pulse bg-gray-100" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <MdCalendarMonth className="text-6xl text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">등산 일정이 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map(event => {
              const diff = DIFF[event.difficulty];
              const isJoined = event.participants.includes(user?.id || '');
              const isFull = event.currentParticipants >= event.maxParticipants;
              return (
                <Link key={event.id} href={`/events/${event.id}`} className="card hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer p-0 overflow-hidden">
                  {/* 상단 배지 */}
                  <div className="bg-gradient-to-r from-primary-800 to-primary-600 px-5 py-4 flex items-center gap-3">
                    <div className="text-white text-center">
                      <p className="text-xs opacity-80">{format(new Date(event.date), 'M월', { locale: ko })}</p>
                      <p className="text-3xl font-bold leading-tight">{format(new Date(event.date), 'd')}</p>
                      <p className="text-xs opacity-80">{format(new Date(event.date), 'EEE', { locale: ko })}</p>
                    </div>
                    <div className="text-white flex-1 min-w-0">
                      <p className="font-bold text-lg truncate">{event.title}</p>
                      <p className="text-sm opacity-80 flex items-center gap-1"><MdLocationOn />{event.mountain}</p>
                    </div>
                  </div>
                  {/* 하단 정보 */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <MdAccessTime className="text-gray-400" />{event.meetingTime} · {event.meetingPoint}
                    </div>
                    {event.description && <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span className={clsx('badge', diff.cls)}>{diff.label}</span>
                      <span className="badge bg-gray-100 text-gray-600 flex items-center gap-1"><MdPeople className="text-xs" />{event.currentParticipants}/{event.maxParticipants}명</span>
                      {event.fee > 0 && <span className="badge bg-amber-50 text-amber-700 flex items-center gap-1"><MdPayment className="text-xs" />{event.fee.toLocaleString()}원</span>}
                      {event.status === 'upcoming' && (
                        <span className={clsx('badge ml-auto', isJoined ? 'bg-green-100 text-green-700' : isFull ? 'bg-red-100 text-red-700' : 'bg-primary-100 text-primary-700')}>
                          {isJoined ? '참가 중' : isFull ? '마감' : '신청 가능'}
                        </span>
                      )}
                      {event.status === 'completed' && <span className="badge bg-gray-100 text-gray-500 ml-auto">완료</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
