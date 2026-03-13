'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { noticeService } from '@/lib/services';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { MdArrowBack, MdSave, MdPushPin } from 'react-icons/md';

const CATS = [
  { value: 'general', label: '일반', cls: 'border-blue-400 bg-blue-50 text-blue-700', active: 'border-blue-500 bg-blue-500 text-white' },
  { value: 'important', label: '중요', cls: 'border-red-400 bg-red-50 text-red-700', active: 'border-red-500 bg-red-500 text-white' },
  { value: 'event', label: '행사', cls: 'border-amber-400 bg-amber-50 text-amber-700', active: 'border-amber-500 bg-amber-500 text-white' },
  { value: 'safety', label: '안전', cls: 'border-orange-400 bg-orange-50 text-orange-700', active: 'border-orange-500 bg-orange-500 text-white' },
];

export default function NoticeCreatePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'general' | 'important' | 'event' | 'safety'>('general');
  const [isPinned, setIsPinned] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) { toast.error('제목과 내용을 입력해주세요.'); return; }
    setLoading(true);
    try {
      await noticeService.create({ title: title.trim(), content: content.trim(), author: user?.name || '관리자', authorId: user?.id || '', category, isPinned });
      toast.success('공지사항이 등록되었습니다!');
      router.push('/notices');
    } catch (e: any) { toast.error(e.message || '등록에 실패했습니다.'); }
    finally { setLoading(false); }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-6">
          <MdArrowBack /> 돌아가기
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">공지사항 작성</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">제목 <span className="text-red-500">*</span></label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="공지사항 제목을 입력해주세요." required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
              <div className="flex gap-2 flex-wrap">
                {CATS.map(c => (
                  <button key={c.value} type="button" onClick={() => setCategory(c.value as any)} className={clsx('px-4 py-2 rounded-xl border-2 font-semibold text-sm transition-all', category === c.value ? c.active : c.cls)}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <MdPushPin className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700">상단 고정</span>
                <span className="text-xs text-gray-400">고정 공지사항은 목록 상단에 표시됩니다.</span>
              </div>
              <button type="button" onClick={() => setIsPinned(!isPinned)} className={clsx('relative w-11 h-6 rounded-full transition-colors', isPinned ? 'bg-primary-600' : 'bg-gray-300')}>
                <span className={clsx('absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', isPinned && 'translate-x-5')} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">내용 <span className="text-red-500">*</span></label>
              <textarea value={content} onChange={e => setContent(e.target.value)} className="input min-h-[280px] resize-y" placeholder="공지사항 내용을 입력해주세요." required />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base">
            {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><MdSave className="text-xl" />공지사항 등록</>}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
