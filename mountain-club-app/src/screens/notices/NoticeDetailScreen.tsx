import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { noticeService } from '../../services/noticeService';
import { Notice } from '../../types';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/useAuthStore';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

type RouteType = RouteProp<RootStackParamList, 'NoticeDetail'>;

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  general: { label: '일반', color: Colors.info },
  important: { label: '중요', color: Colors.error },
  event: { label: '행사', color: Colors.secondary },
  safety: { label: '안전', color: Colors.warning },
};

export default function NoticeDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteType>();
  const { user } = useAuthStore();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.membershipLevel === 'admin';

  useEffect(() => {
    (async () => {
      try {
        const data = await noticeService.getNotice(route.params.noticeId);
        setNotice(data || SAMPLE_NOTICE);
      } catch {
        setNotice(SAMPLE_NOTICE);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = () => {
    Alert.alert('공지사항 삭제', '정말로 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive',
        onPress: async () => {
          try {
            await noticeService.deleteNotice(notice!.id);
            navigation.goBack();
          } catch (e) {
            Alert.alert('오류', '삭제에 실패했습니다.');
          }
        }
      },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (!notice) return <View style={styles.center}><Text>공지사항을 찾을 수 없습니다.</Text></View>;

  const cat = CATEGORY_MAP[notice.category];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={[styles.catBadge, { backgroundColor: cat.color + '20' }]}>
            <Text style={[styles.catText, { color: cat.color }]}>{cat.label}</Text>
          </View>
          {notice.isPinned && (
            <View style={styles.pinBadge}>
              <Ionicons name="pin" size={12} color={Colors.primary} />
              <Text style={styles.pinText}> 고정</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{notice.title}</Text>

        <View style={styles.meta}>
          <Ionicons name="person-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.metaText}> {notice.author}</Text>
          <Text style={styles.dot}>·</Text>
          <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.metaText}> {format(new Date(notice.createdAt), 'yyyy년 M월 d일', { locale: ko })}</Text>
          <Text style={styles.dot}>·</Text>
          <Ionicons name="eye-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.metaText}> {notice.viewCount}회</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.body}>
        <Text style={styles.content}>{notice.content}</Text>
      </View>

      {isAdmin && (
        <View style={styles.adminActions}>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
            <Text style={styles.deleteBtnText}> 삭제</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const SAMPLE_NOTICE: Notice = {
  id: '1',
  title: '[중요] 2024년 연간 등산 일정 및 연회비 납부 안내',
  content: `2024년 이카산악회 연간 산행 일정을 안내드립니다.

1분기 (1~3월)
- 1월: 도봉산 신년 산행
- 2월: 북한산 백운대 코스
- 3월: 관악산 연주대

2분기 (4~6월)
- 4월: 지리산 천왕봉 원정 (1박 2일)
- 5월: 설악산 대청봉 원정 (1박 2일)
- 6월: 덕유산 향적봉

연회비 안내
- 금액: 120,000원/년
- 납부 기한: 2024년 1월 31일까지
- 납부 방법: 앱 내 결제 기능 이용

늦지 않게 납부 부탁드립니다. 감사합니다.

이카산악회 관리자 드림`,
  author: '관리자',
  authorId: 'admin',
  category: 'important',
  isPinned: true,
  createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
  viewCount: 89,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20 },
  headerTop: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  catText: { fontSize: 13, fontWeight: '600' },
  pinBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: Colors.primary + '15' },
  pinText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: 'bold', color: Colors.text, lineHeight: 30, marginBottom: 14 },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  metaText: { fontSize: 13, color: Colors.textSecondary },
  dot: { marginHorizontal: 8, color: Colors.textLight },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 20 },
  body: { padding: 20 },
  content: { fontSize: 16, color: Colors.text, lineHeight: 26 },
  adminActions: { padding: 20, borderTopWidth: 1, borderTopColor: Colors.border, alignItems: 'flex-end' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  deleteBtnText: { fontSize: 15, color: Colors.error, fontWeight: '500' },
});
