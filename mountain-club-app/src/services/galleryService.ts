import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { GalleryPhoto } from '../types';

export const galleryService = {
  async getPhotos(eventId?: string): Promise<GalleryPhoto[]> {
    let q;
    if (eventId) {
      q = query(collection(db, 'gallery'), where('eventId', '==', eventId), orderBy('createdAt', 'desc'));
    } else {
      q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryPhoto));
  },

  async uploadPhoto(
    uri: string,
    fileName: string,
    caption: string,
    uploadedBy: string,
    uploadedById: string,
    eventId?: string,
    eventTitle?: string
  ): Promise<GalleryPhoto> {
    // 이미지 업로드
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `gallery/${Date.now()}_${fileName}`);
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);

    const photo: Omit<GalleryPhoto, 'id'> = {
      url,
      caption,
      uploadedBy,
      uploadedById,
      eventId,
      eventTitle,
      likes: [],
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'gallery'), photo);
    return { id: docRef.id, ...photo };
  },

  async deletePhoto(id: string, url: string): Promise<void> {
    await deleteDoc(doc(db, 'gallery', id));
    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
    } catch (e) {
      // Storage 삭제 실패는 무시
    }
  },

  async toggleLike(photoId: string, userId: string, isLiked: boolean): Promise<void> {
    const photoRef = doc(db, 'gallery', photoId);
    if (isLiked) {
      await updateDoc(photoRef, { likes: arrayRemove(userId) });
    } else {
      await updateDoc(photoRef, { likes: arrayUnion(userId) });
    }
  },
};
