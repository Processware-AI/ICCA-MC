'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { noticeService } from '@/lib/services';
import { Notice } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { clsx } from 'clsx';
import { MdAdd, MdPushPin, MdRemoveRedEye, MdCampaign } from 'react-icons/md';

const CAT: Record<string, { label: string; cls: string }> = {
  general: { label: '일반', cls: 'bg-blue-100 text-blue-700' },
  important: { label: '중요', cls: 'bg-red-100 text-red-700' },
  event: { label: '행사', cls: 'bg-amber-100 text-amber-700' },
  safety: { label: '안전', cls: 'bg-orange-100 text-orange-700' },
};

const SAMPLE: Notice[] = [
  { id: '1', title: '[중요] 2024년 연간 등산 일정 및 연회비 납부 안내', content: '', author: '관리자', authorId: 'admin', category: 'important', isPinned: true, createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString(), viewCount: 89 },
  { id: '2', title: '3월 북한산 산행 참가자 모집 공고', content: '', author: '총무', authorId: 'secretary', category: 'event', isPinned: false, createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), updatedAt: new Date().toISOString(), viewCount: 45 },
  { id: '3', title: '겨울 등산 안전 수칙 안내문', content: '', author: '안전담당', authorId: 'safety', category: 'safety', isPinned: false, createdAt: new Date(Date.now() - 5 * 86400000).toISOString(), updatedAt: new Date().toISOString(), viewCount: 62 },
  { id: '4', title: '4월 월례 모임 안내', content: '', author: '총무', authorId: 'secretary', category: 'general', isPinned: false, createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), updatedAt: new Date().toISOString(), viewCount: 31 },
];

export default function NoticesPage() {
  const { user } = useAuthStore();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.membershipLevel === 'admin';

  useEffect(() => {
    (async () => {
      try {
        const data = await noticeService.getAll();
        setNotices(data.length ? data : SAMPLE);
      } catch { setNotices(SAMPLE); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">공지사항</h1>
            <p className="text-gray-500 text-sm mt-1">산악회 공지사항을 확인하세요.</p>
          </div>
          {isAdmin && <Link href="/notices/create" className="btn-primary"><MdAdd className="text-xl" />공지 작성</Link>}
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="card h-20 animate-pulse bg-gray-100" />)}</div>
        ) : notices.length === 0 ? (
          <div className="card flex flex-col items-center py-16 text-center">
            <MdCampaign className="text-6xl text-gray-300 mb-4" />
            <p className="text-gray-500">공지사항이 없습니다.</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden divide-y divide-gray-100">
            {notices.map(notice => {
              const cat = CAT[notice.category];
              return (
                <Link key={notice.id} href={`/notices/${notice.id}`} className={clsx('flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer', notice.isPinned && 'bg-primary-50/50 hover:bg-primary-50')}>
                  {notice.isPinned && <MdPushPin className="text-primary-500 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={clsx('badge text-xs', cat.cls)}>{cat.label}</span>
                      {notice.isPinned && <span className="badge bg-primary-100 text-primary-700 text-xs">고정</span>}
                    </div>
                    <p className={clsx('font-medium truncate text-sm', notice.isPinned ? 'text-primary-900' : 'text-gray-900')}>{notice.title}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 flex-shrink-0">
                    <span>{notice.author}</span>
                    <span className="flex items-center gap-1"><MdRemoveRedEye />{notice.viewCount}</span>
                    <span>{format(new Date(notice.createdAt), 'MM.dd', { locale: ko })}</span>
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
