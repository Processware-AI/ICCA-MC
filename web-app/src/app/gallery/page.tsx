'use client';
import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { galleryService } from '@/lib/services';
import { GalleryPhoto } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { MdUpload, MdFavorite, MdFavoriteBorder, MdClose, MdPhotoLibrary, MdPerson, MdCalendarMonth } from 'react-icons/md';

const SAMPLE: GalleryPhoto[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  url: `https://picsum.photos/seed/mountain${i + 1}/600/600`,
  caption: ['북한산 백운대에서', '관악산 정상', '설악산 대청봉', '도봉산 신년 산행'][i % 4],
  uploadedBy: ['김철수', '이영희', '박민준', '최지현'][i % 4],
  uploadedById: `user${(i % 4) + 1}`,
  eventTitle: ['북한산 산행', '관악산 산행', '설악산 원정', '도봉산 산행'][i % 4],
  likes: i % 3 === 0 ? ['user1', 'user2'] : i % 3 === 1 ? ['user1'] : [],
  createdAt: new Date(Date.now() - i * 2 * 86400000).toISOString(),
}));

export default function GalleryPage() {
  const { user } = useAuthStore();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<GalleryPhoto | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await galleryService.getAll();
        setPhotos(data.length ? data : SAMPLE);
      } catch { setPhotos(SAMPLE); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const photo = await galleryService.upload(file, file.name.replace(/\.[^/.]+$/, ''), user.name, user.id);
      setPhotos(prev => [photo, ...prev]);
      toast.success('사진이 업로드되었습니다!');
    } catch {
      // 업로드 실패 시 미리보기로 추가
      const url = URL.createObjectURL(file);
      const mock: GalleryPhoto = { id: Date.now().toString(), url, caption: '등산 사진', uploadedBy: user.name, uploadedById: user.id, likes: [], createdAt: new Date().toISOString() };
      setPhotos(prev => [mock, ...prev]);
      toast.success('사진이 추가되었습니다!');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleLike = async (photo: GalleryPhoto) => {
    if (!user) return;
    const isLiked = photo.likes.includes(user.id);
    setPhotos(prev => prev.map(p => p.id !== photo.id ? p : { ...p, likes: isLiked ? p.likes.filter(id => id !== user.id) : [...p.likes, user.id] }));
    if (selected?.id === photo.id) setSelected(prev => prev ? { ...prev, likes: isLiked ? prev.likes.filter(id => id !== user.id) : [...prev.likes, user.id] } : prev);
    try { await galleryService.toggleLike(photo.id, user.id, isLiked); } catch {}
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">사진 갤러리</h1>
            <p className="text-gray-500 text-sm mt-1">총 {photos.length}장의 사진</p>
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary">
              {uploading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><MdUpload className="text-xl" />사진 올리기</>}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {[...Array(10)].map((_, i) => <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : photos.length === 0 ? (
          <div className="card flex flex-col items-center py-16 text-center">
            <MdPhotoLibrary className="text-6xl text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">사진이 없습니다.</p>
            <p className="text-gray-400 text-sm mt-1">첫 번째 사진을 올려보세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {photos.map(photo => {
              const isLiked = photo.likes.includes(user?.id || '');
              return (
                <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden cursor-pointer bg-gray-100" onClick={() => setSelected(photo)}>
                  <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-medium truncate">{photo.caption}</p>
                  </div>
                  {photo.likes.length > 0 && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 rounded-lg px-1.5 py-0.5">
                      <MdFavorite className="text-red-400 text-xs" />
                      <span className="text-white text-xs">{photo.likes.length}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {selected && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-white/70 hover:text-white"><MdClose className="text-3xl" /></button>
          <div className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <img src={selected.url} alt={selected.caption} className="w-full max-h-[70vh] object-contain rounded-xl" />
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">{selected.caption}</p>
                <div className="flex items-center gap-3 text-white/60 text-sm mt-1">
                  <span className="flex items-center gap-1"><MdPerson className="text-xs" />{selected.uploadedBy}</span>
                  <span className="flex items-center gap-1"><MdCalendarMonth className="text-xs" />{format(new Date(selected.createdAt), 'MM.dd', { locale: ko })}</span>
                </div>
              </div>
              <button onClick={() => handleLike(selected)} className="flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-colors">
                {selected.likes.includes(user?.id || '') ? <MdFavorite className="text-red-400 text-xl" /> : <MdFavoriteBorder className="text-xl" />}
                <span className="font-semibold">{selected.likes.length}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
