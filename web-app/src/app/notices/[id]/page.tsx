'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { noticeService } from '@/lib/services';
import { Notice } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { MdArrowBack, MdPushPin, MdPerson, MdCalendarMonth, MdRemoveRedEye, MdDelete } from 'react-icons/md';

const CAT: Record<string, { label: string; cls: string }> = {
  general: { label: '일반', cls: 'bg-blue-100 text-blue-700' },
  important: { label: '중요', cls: 'bg-red-100 text-red-700' },
  event: { label: '행사', cls: 'bg-amber-100 text-amber-700' },
  safety: { label: '안전', cls: 'bg-orange-100 text-orange-700' },
};

const SAMPLE: Notice = { id: '1', title: '[중요] 2024년 연간 등산 일정 및 연회비 납부 안내', content: `2024년 이카산악회 연간 산행 일정을 안내드립니다.\n\n1분기 (1~3월)\n- 1월: 도봉산 신년 산행\n- 2월: 북한산 백운대 코스\n- 3월: 관악산 연주대\n\n2분기 (4~6월)\n- 4월: 지리산 천왕봉 원정 (1박 2일)\n- 5월: 설악산 대청봉 원정 (1박 2일)\n- 6월: 덕유산 향적봉\n\n연회비 안내\n- 금액: 120,000원/년\n- 납부 기한: 2024년 1월 31일까지\n- 납부 방법: 앱 내 결제 기능 이용\n\n늦지 않게 납부 부탁드립니다. 감사합니다.\n\n이카산악회 관리자 드림`, author: '관리자', authorId: 'admin', category: 'important', isPinned: true, createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString(), viewCount: 89 };

export default function NoticeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.membershipLevel === 'admin';

  useEffect(() => {
    (async () => {
      try {
        const data = await noticeService.getOne(id);
        setNotice(data || SAMPLE);
      } catch { setNotice(SAMPLE); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleDelete = async () => {
    if (!notice || !confirm('정말로 삭제하시겠습니까?')) return;
    try {
      await noticeService.delete(notice.id);
      toast.success('삭제되었습니다.');
      router.push('/notices');
    } catch { toast.error('삭제에 실패했습니다.'); }
  };

  if (loading) return <DashboardLayout><div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-primary-700 border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;
  if (!notice) return <DashboardLayout><div className="p-8 text-center text-gray-500">공지사항을 찾을 수 없습니다.</div></DashboardLayout>;

  const cat = CAT[notice.category];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-6">
          <MdArrowBack /> 목록으로
        </button>

        <div className="card">
          {/* 헤더 */}
          <div className="border-b border-gray-100 pb-6 mb-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={clsx('badge', cat.cls)}>{cat.label}</span>
              {notice.isPinned && <span className="badge bg-primary-100 text-primary-700 flex items-center gap-1"><MdPushPin className="text-xs" />고정</span>}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">{notice.title}</h1>
            <div className="flex items-center gap-5 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1.5"><MdPerson className="text-base" />{notice.author}</span>
              <span className="flex items-center gap-1.5"><MdCalendarMonth className="text-base" />{format(new Date(notice.createdAt), 'yyyy년 M월 d일', { locale: ko })}</span>
              <span className="flex items-center gap-1.5"><MdRemoveRedEye className="text-base" />{notice.viewCount}회</span>
            </div>
          </div>

          {/* 본문 */}
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line text-base">
            {notice.content}
          </div>

          {/* 관리자 액션 */}
          {isAdmin && (
            <div className="border-t border-gray-100 mt-8 pt-6 flex justify-end">
              <button onClick={handleDelete} className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">
                <MdDelete />삭제
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
