'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { eventService, paymentService } from '@/lib/services';
import { HikingEvent } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { MdLocationOn, MdAccessTime, MdPerson, MdPeople, MdPayment, MdTrendingUp, MdStraighten, MdTimer, MdWarning, MdArrowBack, MdLogin, MdLogout } from 'react-icons/md';

const DIFF = { easy: { label: '쉬움', cls: 'bg-green-100 text-green-700' }, medium: { label: '보통', cls: 'bg-amber-100 text-amber-700' }, hard: { label: '어려움', cls: 'bg-red-100 text-red-700' } };

const SAMPLE: HikingEvent = { id: '1', title: '북한산 백운대 코스', description: '북한산 최고봉 백운대(836.5m)를 오르는 코스입니다. 도봉 탐방지원센터에서 출발하여 위문을 거쳐 백운대 정상에 오르는 코스입니다. 경치가 매우 아름답고 서울 시내를 한눈에 볼 수 있습니다.', mountain: '북한산', date: new Date(Date.now() + 7 * 86400000).toISOString(), meetingPoint: '북한산성 탐방지원센터', meetingTime: '오전 8:00', difficulty: 'medium', maxParticipants: 20, currentParticipants: 12, participants: [], fee: 15000, leader: '김철수', status: 'upcoming', images: [], distance: 7.5, elevationGain: 836, estimatedDuration: '5~6시간', createdAt: new Date().toISOString() };

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [event, setEvent] = useState<HikingEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await eventService.getOne(id);
        setEvent(data || SAMPLE);
      } catch { setEvent(SAMPLE); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const isJoined = event?.participants.includes(user?.id || '') || false;
  const isFull = (event?.currentParticipants || 0) >= (event?.maxParticipants || 0);

  const handleJoin = async () => {
    if (!event || !user) return;
    if (!isJoined && event.fee > 0) {
      router.push(`/payment?type=event&eventId=${event.id}&eventTitle=${encodeURIComponent(event.title)}&amount=${event.fee}`);
      return;
    }
    setJoining(true);
    try {
      if (isJoined) {
        await eventService.leave(event.id, user.id);
        setEvent(prev => prev ? { ...prev, participants: prev.participants.filter(p => p !== user.id), currentParticipants: prev.currentParticipants - 1 } : prev);
        toast.success('참가를 취소했습니다.');
      } else {
        await eventService.join(event.id, user.id);
        setEvent(prev => prev ? { ...prev, participants: [...prev.participants, user.id], currentParticipants: prev.currentParticipants + 1 } : prev);
        toast.success('참가 신청이 완료되었습니다! 🎉');
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setJoining(false); }
  };

  if (loading) return <DashboardLayout><div className="p-8 flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary-700 border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;
  if (!event) return <DashboardLayout><div className="p-8 text-center text-gray-500">이벤트를 찾을 수 없습니다.</div></DashboardLayout>;

  const diff = DIFF[event.difficulty];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-6">
          <MdArrowBack /> 목록으로
        </button>

        {/* 헤더 */}
        <div className="bg-gradient-to-r from-primary-800 via-primary-700 to-primary-600 rounded-2xl p-8 text-white mb-6">
          <p className="text-white/70 text-sm font-medium mb-2">{event.mountain}</p>
          <h1 className="text-3xl font-bold mb-3">{event.title}</h1>
          <p className="text-white/80 text-lg">{format(new Date(event.date), 'yyyy년 M월 d일 (EEE)', { locale: ko })}</p>
          <div className="flex gap-2 mt-4 flex-wrap">
            <span className={clsx('badge', diff.cls)}>{diff.label}</span>
            {event.status === 'completed' && <span className="badge bg-gray-700 text-gray-200">완료</span>}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 상세 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 기본 정보 */}
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-4">산행 정보</h2>
              <div className="space-y-3">
                {[
                  { icon: MdAccessTime, label: '집결 시간', value: event.meetingTime },
                  { icon: MdLocationOn, label: '집결 장소', value: event.meetingPoint },
                  { icon: MdPerson, label: '산행 리더', value: event.leader },
                  { icon: MdPeople, label: '참가 인원', value: `${event.currentParticipants} / ${event.maxParticipants}명` },
                  ...(event.fee > 0 ? [{ icon: MdPayment, label: '참가비', value: `${event.fee.toLocaleString()}원` }] : []),
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                    <Icon className="text-gray-400 text-lg flex-shrink-0" />
                    <span className="text-gray-500 text-sm w-24 flex-shrink-0">{label}</span>
                    <span className="font-medium text-gray-900 text-sm">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 산행 스펙 */}
            {(event.distance || event.elevationGain || event.estimatedDuration) && (
              <div className="card">
                <h2 className="font-bold text-gray-900 mb-4">코스 정보</h2>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {event.distance && <div className="bg-gray-50 rounded-xl p-4"><MdStraighten className="text-primary-700 text-2xl mx-auto mb-2" /><p className="text-xl font-bold text-gray-900">{event.distance}km</p><p className="text-xs text-gray-500 mt-1">총 거리</p></div>}
                  {event.elevationGain && <div className="bg-gray-50 rounded-xl p-4"><MdTrendingUp className="text-primary-700 text-2xl mx-auto mb-2" /><p className="text-xl font-bold text-gray-900">{event.elevationGain}m</p><p className="text-xs text-gray-500 mt-1">최고 고도</p></div>}
                  {event.estimatedDuration && <div className="bg-gray-50 rounded-xl p-4"><MdTimer className="text-primary-700 text-2xl mx-auto mb-2" /><p className="text-xl font-bold text-gray-900">{event.estimatedDuration}</p><p className="text-xs text-gray-500 mt-1">소요 시간</p></div>}
                </div>
              </div>
            )}

            {/* 설명 */}
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-3">상세 설명</h2>
              <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">{event.description}</p>
            </div>

            {/* 안전 수칙 */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <h2 className="font-bold text-amber-900 flex items-center gap-2 mb-3"><MdWarning /> 안전 주의사항</h2>
              <ul className="space-y-1.5">
                {['등산화 및 적절한 복장을 착용하세요.', '충분한 수분과 간식을 준비하세요.', '응급 연락처를 반드시 확인하세요.', '몸이 좋지 않으면 무리하지 마세요.', '리더의 지시에 따라 행동하세요.'].map(tip => (
                  <li key={tip} className="text-sm text-amber-800 flex items-start gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />{tip}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 사이드바 - 참가 버튼 */}
          <div className="space-y-4">
            {event.status === 'upcoming' && (
              <div className="card sticky top-6">
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-500 mb-1.5">
                    <span>참가 현황</span>
                    <span>{event.currentParticipants}/{event.maxParticipants}명</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${Math.min(100, (event.currentParticipants / event.maxParticipants) * 100)}%` }} />
                  </div>
                </div>

                {event.fee > 0 && (
                  <div className="bg-amber-50 rounded-xl p-4 mb-4 text-center">
                    <p className="text-xs text-amber-600 mb-1">참가비</p>
                    <p className="text-2xl font-bold text-amber-700">{event.fee.toLocaleString()}원</p>
                  </div>
                )}

                <button
                  onClick={handleJoin}
                  disabled={joining || (isFull && !isJoined)}
                  className={clsx('w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors', isJoined ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' : isFull ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'btn-primary')}
                >
                  {joining ? <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : isJoined ? <><MdLogout />참가 취소</> : isFull ? '참가 마감' : <><MdLogin />{event.fee > 0 ? `${event.fee.toLocaleString()}원 결제 후 참가` : '참가 신청'}</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
