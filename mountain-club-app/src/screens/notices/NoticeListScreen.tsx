import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { noticeService } from '../../services/noticeService';
import { Notice } from '../../types';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/useAuthStore';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  general: { label: '일반', color: Colors.info },
  important: { label: '중요', color: Colors.error },
  event: { label: '행사', color: Colors.secondary },
  safety: { label: '안전', color: Colors.warning },
};

export default function NoticeListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthStore();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = user?.membershipLevel === 'admin';

  const loadNotices = async () => {
    try {
      const data = await noticeService.getNotices();
      setNotices(data);
    } catch {
      setNotices(SAMPLE_NOTICES);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadNotices(); }, []);

  const onRefresh = () => { setRefreshing(true); loadNotices(); };

  const renderNotice = ({ item }: { item: Notice }) => {
    const cat = CATEGORY_MAP[item.category];
    return (
      <TouchableOpacity
        style={[styles.noticeCard, item.isPinned && styles.pinnedCard]}
        onPress={() => navigation.navigate('NoticeDetail', { noticeId: item.id })}
      >
        <View style={styles.noticeHeader}>
          <View style={styles.badges}>
            {item.isPinned && (
              <View style={styles.pinBadge}>
                <Ionicons name="pin" size={11} color={Colors.white} />
                <Text style={styles.pinBadgeText}> 고정</Text>
              </View>
            )}
            <View style={[styles.catBadge, { backgroundColor: cat.color + '20' }]}>
              <Text style={[styles.catBadgeText, { color: cat.color }]}>{cat.label}</Text>
            </View>
          </View>
          <Text style={styles.viewCount}>
            <Ionicons name="eye-outline" size={12} /> {item.viewCount}
          </Text>
        </View>
        <Text style={[styles.noticeTitle, item.isPinned && styles.pinnedTitle]} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.noticeMeta}>
          <Text style={styles.author}>{item.author}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.date}>{format(new Date(item.createdAt), 'yyyy.MM.dd', { locale: ko })}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={notices}
          renderItem={renderNotice}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="newspaper-outline" size={60} color={Colors.textLight} />
              <Text style={styles.emptyText}>공지사항이 없습니다.</Text>
            </View>
          }
        />
      )}
      {isAdmin && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('NoticeCreate')}>
          <Ionicons name="add" size={30} color={Colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const SAMPLE_NOTICES: Notice[] = [
  {
    id: '1',
    title: '[중요] 2024년 연간 등산 일정 및 연회비 납부 안내',
    content: '2024년 연간 일정을 안내합니다. 연회비는 1월 말까지 납부해 주세요.',
    author: '관리자',
    authorId: 'admin',
    category: 'important',
    isPinned: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 89,
  },
  {
    id: '2',
    title: '3월 북한산 산행 참가자 모집',
    content: '3월 정기 산행 참가자를 모집합니다.',
    author: '총무',
    authorId: 'secretary',
    category: 'event',
    isPinned: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 45,
  },
  {
    id: '3',
    title: '겨울 등산 안전 수칙 안내',
    content: '겨울철 등산 시 주의사항을 공지합니다.',
    author: '안전담당',
    authorId: 'safety',
    category: 'safety',
    isPinned: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 62,
  },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  noticeCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  pinnedCard: { borderLeftWidth: 3, borderLeftColor: Colors.primary },
  noticeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badges: { flexDirection: 'row', gap: 6 },
  pinBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pinBadgeText: { color: Colors.white, fontSize: 11, fontWeight: '600' },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  catBadgeText: { fontSize: 11, fontWeight: '600' },
  viewCount: { fontSize: 12, color: Colors.textLight },
  noticeTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 8, lineHeight: 21 },
  pinnedTitle: { color: Colors.primaryDark },
  noticeMeta: { flexDirection: 'row', alignItems: 'center' },
  author: { fontSize: 12, color: Colors.textSecondary },
  dot: { marginHorizontal: 6, color: Colors.textLight },
  date: { fontSize: 12, color: Colors.textLight },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyText: { marginTop: 12, color: Colors.textLight, fontSize: 16 },
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
});
