import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { galleryService } from '../../services/galleryService';
import { GalleryPhoto } from '../../types';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/useAuthStore';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 3;

export default function GalleryScreen() {
  const { user } = useAuthStore();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);

  const loadPhotos = async () => {
    try {
      const data = await galleryService.getPhotos();
      setPhotos(data);
    } catch {
      setPhotos(SAMPLE_PHOTOS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadPhotos(); }, []);

  const handleUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 업로드를 위해 갤러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        const asset = result.assets[0];
        const fileName = asset.fileName || `photo_${Date.now()}.jpg`;
        await galleryService.uploadPhoto(
          asset.uri,
          fileName,
          '등산 사진',
          user?.name || '회원',
          user?.id || '',
        );
        await loadPhotos();
        Alert.alert('완료', '사진이 업로드되었습니다.');
      } catch (error) {
        // 업로드 실패 시 샘플로 추가
        const newPhoto: GalleryPhoto = {
          id: Date.now().toString(),
          url: result.assets[0].uri,
          caption: '등산 사진',
          uploadedBy: user?.name || '회원',
          uploadedById: user?.id || '',
          likes: [],
          createdAt: new Date().toISOString(),
        };
        setPhotos(prev => [newPhoto, ...prev]);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleLike = async (photo: GalleryPhoto) => {
    if (!user) return;
    const isLiked = photo.likes.includes(user.id);
    try {
      await galleryService.toggleLike(photo.id, user.id, isLiked);
      setPhotos(prev => prev.map(p => {
        if (p.id !== photo.id) return p;
        return {
          ...p,
          likes: isLiked ? p.likes.filter(id => id !== user.id) : [...p.likes, user.id],
        };
      }));
    } catch {
      // 로컬 상태만 업데이트
      setPhotos(prev => prev.map(p => {
        if (p.id !== photo.id) return p;
        return {
          ...p,
          likes: isLiked ? p.likes.filter(id => id !== user.id) : [...p.likes, user.id],
        };
      }));
    }
  };

  const renderItem = ({ item }: { item: GalleryPhoto }) => (
    <TouchableOpacity style={styles.photoItem} onPress={() => setSelectedPhoto(item)}>
      <Image source={{ uri: item.url }} style={styles.photo} />
      {item.likes.length > 0 && (
        <View style={styles.likeCount}>
          <Ionicons name="heart" size={10} color={Colors.white} />
          <Text style={styles.likeCountText}>{item.likes.length}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={photos}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPhotos(); }} tintColor={Colors.primary} />}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.photoCount}>사진 {photos.length}장</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={60} color={Colors.textLight} />
              <Text style={styles.emptyText}>사진이 없습니다.</Text>
              <Text style={styles.emptySubText}>첫 번째 사진을 올려보세요!</Text>
            </View>
          }
        />
      )}

      {/* 업로드 버튼 */}
      <TouchableOpacity style={styles.fab} onPress={handleUpload} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Ionicons name="camera" size={28} color={Colors.white} />
        )}
      </TouchableOpacity>

      {/* 사진 상세 모달 */}
      <Modal
        visible={!!selectedPhoto}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedPhoto(null)}>
            <Ionicons name="close-circle" size={36} color={Colors.white} />
          </TouchableOpacity>
          {selectedPhoto && (
            <View style={styles.modalContent}>
              <Image source={{ uri: selectedPhoto.url }} style={styles.modalImage} resizeMode="contain" />
              <View style={styles.modalInfo}>
                <Text style={styles.modalCaption}>{selectedPhoto.caption}</Text>
                <Text style={styles.modalMeta}>
                  {selectedPhoto.uploadedBy} · {format(new Date(selectedPhoto.createdAt), 'MM.dd', { locale: ko })}
                </Text>
                <TouchableOpacity style={styles.likeBtn} onPress={() => handleLike(selectedPhoto)}>
                  <Ionicons
                    name={selectedPhoto.likes.includes(user?.id || '') ? 'heart' : 'heart-outline'}
                    size={24}
                    color={selectedPhoto.likes.includes(user?.id || '') ? Colors.error : Colors.white}
                  />
                  <Text style={styles.likeBtnText}>{selectedPhoto.likes.length}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const SAMPLE_PHOTOS: GalleryPhoto[] = Array.from({ length: 9 }, (_, i) => ({
  id: String(i + 1),
  url: `https://picsum.photos/seed/mountain${i + 1}/400/400`,
  caption: `등산 사진 ${i + 1}`,
  uploadedBy: ['김철수', '이영희', '박민준'][i % 3],
  uploadedById: `user${i + 1}`,
  eventTitle: ['북한산 산행', '관악산 산행', '설악산 원정'][i % 3],
  likes: i % 2 === 0 ? ['user1', 'user2'] : [],
  createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
}));

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, paddingBottom: 8 },
  photoCount: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  grid: { padding: 12, paddingBottom: 80 },
  row: { gap: 4 },
  photoItem: { width: ITEM_SIZE, height: ITEM_SIZE, margin: 2, borderRadius: 4, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  likeCount: { position: 'absolute', bottom: 4, right: 4, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  likeCountText: { fontSize: 10, color: Colors.white, marginLeft: 2 },
  emptyContainer: { alignItems: 'center', paddingTop: 100 },
  emptyText: { marginTop: 12, color: Colors.textLight, fontSize: 16 },
  emptySubText: { marginTop: 4, color: Colors.textLight, fontSize: 13 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center' },
  modalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  modalContent: { flex: 1, justifyContent: 'center' },
  modalImage: { width: '100%', height: width },
  modalInfo: { padding: 20, flexDirection: 'row', alignItems: 'center' },
  modalCaption: { flex: 1, fontSize: 16, color: Colors.white, fontWeight: '600' },
  modalMeta: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeBtnText: { fontSize: 16, color: Colors.white, fontWeight: '600' },
});
