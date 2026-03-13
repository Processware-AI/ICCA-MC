import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuthStore } from '../../store/useAuthStore';
import { eventService } from '../../services/eventService';
import { noticeService } from '../../services/noticeService';
import { HikingEvent, Notice } from '../../types';
import { Colors } from '../../constants/colors';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthStore();
  const [upcomingEvents, setUpcomingEvents] = useState<HikingEvent[]>([]);
  const [recentNotices, setRecentNotices] = useState<Notice[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [events, notices] = await Promise.all([
        eventService.getUpcomingEvents(3),
        noticeService.getNotices(),
      ]);
      setUpcomingEvents(events);
      setRecentNotices(notices.slice(0, 3));
    } catch (error) {
      // 샘플 데이터로 대체
      setUpcomingEvents(SAMPLE_EVENTS);
      setRecentNotices(SAMPLE_NOTICES);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === 'easy') return Colors.success;
    if (difficulty === 'medium') return Colors.warning;
    return Colors.error;
  };

  const getDifficultyLabel = (difficulty: string) => {
    if (difficulty === 'easy') return '쉬움';
    if (difficulty === 'medium') return '보통';
    return '어려움';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* 환영 배너 */}
      <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.welcomeBanner}>
        <View style={styles.welcomeContent}>
          <View>
            <Text style={styles.welcomeText}>안녕하세요,</Text>
            <Text style={styles.userName}>{user?.name || '회원'}님! 👋</Text>
            <Text style={styles.welcomeSubtext}>오늘도 힘차게 산에 오릅시다!</Text>
          </View>
          <View style={styles.mountainIcon}>
            <Ionicons name="trail-sign" size={50} color="rgba(255,255,255,0.3)" />
          </View>
        </View>

        {/* 통계 카드 */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>23</Text>
            <Text style={styles.statLabel}>총 등산 횟수</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>1,240m</Text>
            <Text style={styles.statLabel}>최고 등반 고도</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>45명</Text>
            <Text style={styles.statLabel}>산악회 회원</Text>
          </View>
        </View>
      </LinearGradient>

      {/* 빠른 메뉴 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>빠른 메뉴</Text>
        <View style={styles.quickMenuGrid}>
          {QUICK_MENUS.map((menu, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickMenuItem}
              onPress={() => navigation.navigate(menu.screen as any, menu.params as any)}
            >
              <View style={[styles.quickMenuIcon, { backgroundColor: menu.color + '20' }]}>
                <Ionicons name={menu.icon as any} size={28} color={menu.color} />
              </View>
              <Text style={styles.quickMenuLabel}>{menu.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 다가오는 등산 일정 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>다가오는 등산 일정</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Main' as any)}>
            <Text style={styles.seeAllText}>전체 보기</Text>
          </TouchableOpacity>
        </View>
        {upcomingEvents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={40} color={Colors.textLight} />
            <Text style={styles.emptyText}>예정된 등산 일정이 없습니다.</Text>
          </View>
        ) : (
          upcomingEvents.map(event => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
            >
              <View style={styles.eventDateBadge}>
                <Text style={styles.eventDateMonth}>
                  {format(new Date(event.date), 'M월', { locale: ko })}
                </Text>
                <Text style={styles.eventDateDay}>
                  {format(new Date(event.date), 'd', { locale: ko })}
                </Text>
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventMountain}>
                  <Ionicons name="location-outline" size={12} /> {event.mountain}
                </Text>
                <View style={styles.eventMeta}>
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(event.difficulty) + '20' }]}>
                    <Text style={[styles.difficultyText, { color: getDifficultyColor(event.difficulty) }]}>
                      {getDifficultyLabel(event.difficulty)}
                    </Text>
                  </View>
                  <Text style={styles.participantText}>
                    {event.currentParticipants}/{event.maxParticipants}명
                  </Text>
                  {event.fee > 0 && (
                    <Text style={styles.feeText}>{event.fee.toLocaleString()}원</Text>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* 최근 공지사항 */}
      <View style={[styles.section, { marginBottom: 24 }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>최근 공지사항</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Main' as any)}>
            <Text style={styles.seeAllText}>전체 보기</Text>
          </TouchableOpacity>
        </View>
        {recentNotices.map(notice => (
          <TouchableOpacity
            key={notice.id}
            style={styles.noticeCard}
            onPress={() => navigation.navigate('NoticeDetail', { noticeId: notice.id })}
          >
            {notice.isPinned && (
              <Ionicons name="pin" size={14} color={Colors.error} style={styles.pinIcon} />
            )}
            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle} numberOfLines={1}>{notice.title}</Text>
              <Text style={styles.noticeDate}>
                {format(new Date(notice.createdAt), 'yyyy.MM.dd', { locale: ko })}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const QUICK_MENUS = [
  { label: '등산 일정', icon: 'calendar', color: Colors.primary, screen: 'Main', params: {} },
  { label: '공지사항', icon: 'newspaper', color: Colors.info, screen: 'Main', params: {} },
  { label: '사진 갤러리', icon: 'images', color: Colors.secondary, screen: 'Main', params: {} },
  { label: '회원 목록', icon: 'people', color: Colors.primaryLight, screen: 'MemberList', params: {} },
  { label: '연회비 납부', icon: 'card', color: Colors.accent, screen: 'Payment', params: { type: 'membership' } },
  { label: '결제 내역', icon: 'receipt', color: Colors.textSecondary, screen: 'PaymentHistory', params: {} },
];

const SAMPLE_EVENTS: HikingEvent[] = [
  {
    id: '1',
    title: '북한산 정기 산행',
    description: '북한산 백운대 코스 등반',
    mountain: '북한산',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    meetingPoint: '북한산성 탐방지원센터',
    meetingTime: '오전 8:00',
    difficulty: 'medium',
    maxParticipants: 20,
    currentParticipants: 12,
    participants: [],
    fee: 15000,
    leader: '김철수',
    status: 'upcoming',
    images: [],
    createdAt: new Date().toISOString(),
  },
];

const SAMPLE_NOTICES: Notice[] = [
  {
    id: '1',
    title: '[중요] 2024년 하반기 등산 일정 안내',
    content: '하반기 등산 일정을 공지합니다.',
    author: '관리자',
    authorId: 'admin',
    category: 'important',
    isPinned: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 45,
  },
  {
    id: '2',
    title: '산악회 월례 모임 안내',
    content: '이번 달 모임 안내입니다.',
    author: '총무',
    authorId: 'secretary',
    category: 'general',
    isPinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 23,
  },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  welcomeBanner: { padding: 20, paddingTop: 24, paddingBottom: 24 },
  welcomeContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  welcomeText: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  userName: { fontSize: 24, fontWeight: 'bold', color: Colors.white, marginVertical: 2 },
  welcomeSubtext: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  mountainIcon: { opacity: 0.6 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
  },
  statCard: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: Colors.white },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 8 },
  section: { padding: 16, paddingBottom: 0 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 12 },
  seeAllText: { fontSize: 14, color: Colors.primary },
  quickMenuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickMenuItem: { width: (width - 56) / 3, alignItems: 'center', marginBottom: 4 },
  quickMenuIcon: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  quickMenuLabel: { fontSize: 12, color: Colors.text, textAlign: 'center', fontWeight: '500' },
  emptyCard: { alignItems: 'center', padding: 32, backgroundColor: Colors.white, borderRadius: 16 },
  emptyText: { color: Colors.textLight, marginTop: 12, fontSize: 14 },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  eventDateBadge: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    minWidth: 50,
    marginRight: 12,
  },
  eventDateMonth: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  eventDateDay: { fontSize: 22, fontWeight: 'bold', color: Colors.primary },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  eventMountain: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  difficultyBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  difficultyText: { fontSize: 11, fontWeight: '600' },
  participantText: { fontSize: 12, color: Colors.textSecondary },
  feeText: { fontSize: 12, color: Colors.secondary, fontWeight: '600' },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pinIcon: { marginRight: 6 },
  noticeContent: { flex: 1 },
  noticeTitle: { fontSize: 15, fontWeight: '500', color: Colors.text },
  noticeDate: { fontSize: 12, color: Colors.textLight, marginTop: 4 },
});
