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
import { eventService } from '../../services/eventService';
import { HikingEvent } from '../../types';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/useAuthStore';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const TABS = ['전체', '예정', '완료'];
const DIFFICULTIES = { easy: { label: '쉬움', color: Colors.success }, medium: { label: '보통', color: Colors.warning }, hard: { label: '어려움', color: Colors.error } };

export default function EventListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthStore();
  const [events, setEvents] = useState<HikingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const isAdmin = user?.membershipLevel === 'admin';

  const loadEvents = async () => {
    try {
      const statusMap: any = { 0: undefined, 1: 'upcoming', 2: 'completed' };
      const data = await eventService.getEvents(statusMap[activeTab]);
      setEvents(data);
    } catch {
      setEvents(SAMPLE_EVENTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadEvents();
  }, [activeTab]);

  const onRefresh = () => { setRefreshing(true); loadEvents(); };

  const renderEvent = ({ item }: { item: HikingEvent }) => {
    const diff = DIFFICULTIES[item.difficulty];
    const isJoined = item.participants.includes(user?.id || '');
    const isFull = item.currentParticipants >= item.maxParticipants;

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
      >
        <View style={styles.eventHeader}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateMonth}>{format(new Date(item.date), 'MMM', { locale: ko })}</Text>
            <Text style={styles.dateDay}>{format(new Date(item.date), 'd')}</Text>
            <Text style={styles.dateDow}>{format(new Date(item.date), 'EEE', { locale: ko })}</Text>
          </View>
          <View style={styles.eventMain}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <View style={styles.eventRow}>
              <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.eventMountain}> {item.mountain}</Text>
            </View>
            <View style={styles.eventRow}>
              <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.eventMeta}> {item.meetingTime} · {item.meetingPoint}</Text>
            </View>
          </View>
        </View>

        <View style={styles.eventFooter}>
          <View style={[styles.badge, { backgroundColor: diff.color + '15' }]}>
            <Text style={[styles.badgeText, { color: diff.color }]}>{diff.label}</Text>
          </View>

          <View style={styles.participantBadge}>
            <Ionicons name="people-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.participantText}> {item.currentParticipants}/{item.maxParticipants}</Text>
          </View>

          {item.fee > 0 && (
            <View style={styles.feeBadge}>
              <Ionicons name="card-outline" size={13} color={Colors.secondary} />
              <Text style={styles.feeText}> {item.fee.toLocaleString()}원</Text>
            </View>
          )}

          {item.status === 'upcoming' && (
            <View style={[
              styles.statusBadge,
              { backgroundColor: isJoined ? Colors.success + '20' : isFull ? Colors.error + '20' : Colors.primary + '20' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: isJoined ? Colors.success : isFull ? Colors.error : Colors.primary }
              ]}>
                {isJoined ? '참가 중' : isFull ? '마감' : '참가 가능'}
              </Text>
            </View>
          )}
        </View>

        {item.description && (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 탭 필터 */}
      <View style={styles.tabContainer}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.tab, activeTab === i && styles.activeTab]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.tabText, activeTab === i && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={60} color={Colors.textLight} />
              <Text style={styles.emptyText}>등산 일정이 없습니다.</Text>
            </View>
          }
        />
      )}

      {isAdmin && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('EventCreate')}>
          <Ionicons name="add" size={30} color={Colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const SAMPLE_EVENTS: HikingEvent[] = [
  {
    id: '1',
    title: '북한산 백운대 코스',
    description: '북한산 최고봉 백운대(836.5m)를 오르는 코스입니다. 도봉 탐방지원센터에서 출발합니다.',
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
    distance: 7.5,
    elevationGain: 836,
    estimatedDuration: '5~6시간',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: '관악산 연주대 코스',
    description: '관악산 정상 연주대를 목표로 하는 코스입니다.',
    mountain: '관악산',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    meetingPoint: '관악산 입구',
    meetingTime: '오전 9:00',
    difficulty: 'easy',
    maxParticipants: 15,
    currentParticipants: 7,
    participants: [],
    fee: 10000,
    leader: '이영희',
    status: 'upcoming',
    images: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: '설악산 대청봉 원정',
    description: '설악산 최고봉 대청봉(1,708m)을 목표로 하는 1박 2일 원정 산행.',
    mountain: '설악산',
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    meetingPoint: '서울역 집결',
    meetingTime: '오전 6:00',
    difficulty: 'hard',
    maxParticipants: 10,
    currentParticipants: 10,
    participants: [],
    fee: 80000,
    leader: '박민준',
    status: 'upcoming',
    images: [],
    createdAt: new Date().toISOString(),
  },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabContainer: { flexDirection: 'row', backgroundColor: Colors.white, paddingHorizontal: 16, paddingTop: 12 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 15, color: Colors.textSecondary, fontWeight: '500' },
  activeTabText: { color: Colors.primary, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  eventCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  eventHeader: { flexDirection: 'row', marginBottom: 12 },
  dateContainer: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    minWidth: 52,
    marginRight: 14,
  },
  dateMonth: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  dateDay: { fontSize: 24, fontWeight: 'bold', color: Colors.white },
  dateDow: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  eventMain: { flex: 1 },
  eventTitle: { fontSize: 17, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
  eventRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  eventMountain: { fontSize: 13, color: Colors.textSecondary },
  eventMeta: { fontSize: 13, color: Colors.textSecondary },
  eventFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  participantBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, backgroundColor: Colors.gray[100], borderRadius: 8 },
  participantText: { fontSize: 12, color: Colors.textSecondary },
  feeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, backgroundColor: Colors.secondary + '15', borderRadius: 8 },
  feeText: { fontSize: 12, color: Colors.secondary, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '600' },
  description: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
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
