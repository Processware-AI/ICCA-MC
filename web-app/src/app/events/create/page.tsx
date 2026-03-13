'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { eventService } from '@/lib/services';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { MdArrowBack, MdSave } from 'react-icons/md';

const DIFFS = [
  { value: 'easy', label: '쉬움', cls: 'border-green-400 bg-green-50 text-green-700', active: 'border-green-500 bg-green-500 text-white' },
  { value: 'medium', label: '보통', cls: 'border-amber-400 bg-amber-50 text-amber-700', active: 'border-amber-500 bg-amber-500 text-white' },
  { value: 'hard', label: '어려움', cls: 'border-red-400 bg-red-50 text-red-700', active: 'border-red-500 bg-red-500 text-white' },
];

export default function EventCreatePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', mountain: '', description: '', date: '', meetingTime: '', meetingPoint: '', difficulty: 'medium', maxParticipants: '20', fee: '0', distance: '', elevationGain: '', estimatedDuration: '' });

  const up = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.mountain || !form.date) { toast.error('제목, 산 이름, 날짜는 필수입니다.'); return; }
    setLoading(true);
    try {
      await eventService.create({
        title: form.title, description: form.description, mountain: form.mountain,
        date: new Date(form.date).toISOString(),
        meetingPoint: form.meetingPoint, meetingTime: form.meetingTime,
        difficulty: form.difficulty as any,
        maxParticipants: parseInt(form.maxParticipants) || 20,
        currentParticipants: 0, participants: [],
        fee: parseInt(form.fee) || 0,
        leader: user?.name || '', status: 'upcoming', images: [],
        distance: form.distance ? parseFloat(form.distance) : undefined,
        elevationGain: form.elevationGain ? parseInt(form.elevationGain) : undefined,
        estimatedDuration: form.estimatedDuration || undefined,
        createdAt: new Date().toISOString(),
      });
      toast.success('등산 일정이 등록되었습니다!');
      router.push('/events');
    } catch (e: any) { toast.error(e.message || '등록에 실패했습니다.'); }
    finally { setLoading(false); }
  };

  const Field = ({ label, name, type = 'text', placeholder, required = false }: { label: string; name: string; type?: string; placeholder: string; required?: boolean }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} value={form[name as keyof typeof form]} onChange={e => up(name, e.target.value)} className="input" placeholder={placeholder} required={required} />
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-6">
          <MdArrowBack /> 돌아가기
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">등산 일정 등록</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Section title="기본 정보">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="제목" name="title" placeholder="예: 북한산 정기 산행" required />
              <Field label="산 이름" name="mountain" placeholder="예: 북한산" required />
              <Field label="날짜" name="date" type="date" placeholder="" required />
              <Field label="집결 시간" name="meetingTime" placeholder="예: 오전 8:00" />
              <div className="sm:col-span-2">
                <Field label="집결 장소" name="meetingPoint" placeholder="예: 북한산성 탐방지원센터" />
              </div>
            </div>
          </Section>

          <Section title="난이도">
            <div className="flex gap-3">
              {DIFFS.map(d => (
                <button key={d.value} type="button" onClick={() => up('difficulty', d.value)} className={clsx('flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition-all', form.difficulty === d.value ? d.active : d.cls)}>
                  {d.label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="참가 정보">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="최대 참가 인원" name="maxParticipants" type="number" placeholder="20" />
              <Field label="참가비 (원)" name="fee" type="number" placeholder="0" />
            </div>
          </Section>

          <Section title="코스 정보 (선택)">
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="총 거리 (km)" name="distance" placeholder="예: 7.5" />
              <Field label="최고 고도 (m)" name="elevationGain" placeholder="예: 836" />
              <Field label="예상 소요 시간" name="estimatedDuration" placeholder="예: 5~6시간" />
            </div>
          </Section>

          <Section title="설명">
            <textarea value={form.description} onChange={e => up('description', e.target.value)} className="input min-h-[120px] resize-y" placeholder="산행에 대한 상세 설명을 입력해주세요." />
          </Section>

          <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base">
            {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><MdSave className="text-xl" />일정 등록</>}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h2 className="font-bold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}
