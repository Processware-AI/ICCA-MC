import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { eventService } from '../../services/eventService';
import { HikingEvent } from '../../types';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/useAuthStore';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

type RouteType = RouteProp<RootStackParamList, 'EventDetail'>;

const DIFF_MAP = { easy: { label: '쉬움', color: Colors.success }, medium: { label: '보통', color: Colors.warning }, hard: { label: '어려움', color: Colors.error } };

export default function EventDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteType>();
  const { user } = useAuthStore();
  const [event, setEvent] = useState<HikingEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [route.params.eventId]);

  const loadEvent = async () => {
    try {
      const data = await eventService.getEvent(route.params.eventId);
      setEvent(data || SAMPLE_EVENT);
    } catch {
      setEvent(SAMPLE_EVENT);
    } finally {
      setLoading(false);
    }
  };

  const isJoined = event?.participants.includes(user?.id || '') || false;
  const isFull = (event?.currentParticipants || 0) >= (event?.maxParticipants || 0);

  const handleJoinLeave = async () => {
    if (!event || !user) return;

    if (event.fee > 0 && !isJoined) {
      navigation.navigate('Payment', {
        type: 'event',
        eventId: event.id,
        eventTitle: event.title,
        amount: event.fee,
      });
      return;
    }

    setJoining(true);
    try {
      if (isJoined) {
        await eventService.leaveEvent(event.id, user.id);
        Alert.alert('취소 완료', '등산 참가를 취소했습니다.');
      } else {
        await eventService.joinEvent(event.id, user.id);
        Alert.alert('참가 완료', '등산에 참가 신청이 완료되었습니다!');
      }
      await loadEvent();
    } catch (error: any) {
      Alert.alert('오류', error.message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }
  if (!event) {
    return <View style={styles.center}><Text>이벤트를 찾을 수 없습니다.</Text></View>;
  }

  const diff = DIFF_MAP[event.difficulty];

  return (
    <ScrollView style={styles.container}>
      {/* 헤더 배너 */}
      <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.headerBanner}>
        <Text style={styles.mountainText}>{event.mountain}</Text>
        <Text style={styles.titleText}>{event.title}</Text>
        <Text style={styles.dateText}>
          {format(new Date(event.date), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
        </Text>
        <View style={styles.statusRow}>
          <View style={[styles.diffBadge, { backgroundColor: diff.color }]}>
            <Text style={styles.diffBadgeText}>{diff.label}</Text>
          </View>
          {event.status === 'completed' && (
            <View style={[styles.diffBadge, { backgroundColor: Colors.textSecondary }]}>
              <Text style={styles.diffBadgeText}>완료</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* 상세 정보 */}
      <View style={styles.content}>
        {/* 주요 정보 카드 */}
        <View style={styles.infoCard}>
          <InfoRow icon="time-outline" label="집결 시간" value={event.meetingTime} />
          <InfoRow icon="location-outline" label="집결 장소" value={event.meetingPoint} />
          <InfoRow icon="person-outline" label="산행 리더" value={event.leader} />
          {event.fee > 0 && (
            <InfoRow icon="card-outline" label="참가비" value={`${event.fee.toLocaleString()}원`} valueColor={Colors.secondary} />
          )}
          <InfoRow icon="people-outline" label="참가 인원" value={`${event.currentParticipants}/${event.maxParticipants}명`} />
        </View>

        {/* 산행 정보 */}
        {(event.distance || event.elevationGain || event.estimatedDuration) && (
          <View style={styles.statsCard}>
            <Text style={styles.cardTitle}>산행 정보</Text>
            <View style={styles.statsRow}>
              {event.distance && (
                <View style={styles.statItem}>
                  <Ionicons name="navigate-outline" size={24} color={Colors.primary} />
                  <Text style={styles.statValue}>{event.distance}km</Text>
                  <Text style={styles.statLabel}>총 거리</Text>
                </View>
              )}
              {event.elevationGain && (
                <View style={styles.statItem}>
                  <Ionicons name="trending-up-outline" size={24} color={Colors.primary} />
                  <Text style={styles.statValue}>{event.elevationGain}m</Text>
                  <Text style={styles.statLabel}>고도</Text>
                </View>
              )}
              {event.estimatedDuration && (
                <View style={styles.statItem}>
                  <Ionicons name="timer-outline" size={24} color={Colors.primary} />
                  <Text style={styles.statValue}>{event.estimatedDuration}</Text>
                  <Text style={styles.statLabel}>소요 시간</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* 설명 */}
        <View style={styles.descCard}>
          <Text style={styles.cardTitle}>상세 설명</Text>
          <Text style={styles.descText}>{event.description}</Text>
        </View>

        {/* 안전 주의사항 */}
        <View style={styles.safetyCard}>
          <Text style={styles.cardTitle}>
            <Ionicons name="warning-outline" size={16} color={Colors.warning} /> 안전 주의사항
          </Text>
          {SAFETY_TIPS.map((tip, i) => (
            <Text key={i} style={styles.safetyTip}>• {tip}</Text>
          ))}
        </View>

        {/* 참가 버튼 */}
        {event.status === 'upcoming' && (
          <TouchableOpacity
            style={[
              styles.joinButton,
              isJoined && styles.leaveButton,
              isFull && !isJoined && styles.fullButton,
            ]}
            onPress={handleJoinLeave}
            disabled={joining || (isFull && !isJoined)}
          >
            {joining ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons
                  name={isJoined ? 'exit-outline' : 'enter-outline'}
                  size={22}
                  color={Colors.white}
                  style={styles.btnIcon}
                />
                <Text style={styles.joinButtonText}>
                  {isJoined ? '참가 취소' : isFull ? '마감되었습니다' : event.fee > 0 ? `${event.fee.toLocaleString()}원 결제 후 참가` : '참가 신청'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value, valueColor }: { icon: any; label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={Colors.textSecondary} style={styles.infoIcon} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const SAFETY_TIPS = [
  '등산화 및 적절한 복장을 착용하세요.',
  '충분한 수분과 간식을 준비하세요.',
  '응급 연락처를 반드시 확인하세요.',
  '몸이 좋지 않으면 무리하지 마세요.',
  '리더의 지시에 따라 행동하세요.',
];

const SAMPLE_EVENT: HikingEvent = {
  id: '1',
  title: '북한산 백운대 코스',
  description: '북한산 최고봉 백운대(836.5m)를 오르는 코스입니다. 도봉 탐방지원센터에서 출발하여 위문을 거쳐 백운대 정상에 오르는 코스입니다. 경치가 매우 아름답고 서울 시내를 한눈에 볼 수 있습니다.',
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
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBanner: { padding: 24, paddingTop: 20, paddingBottom: 28 },
  mountainText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginBottom: 4 },
  titleText: { fontSize: 26, fontWeight: 'bold', color: Colors.white, marginBottom: 8, lineHeight: 32 },
  dateText: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 12 },
  statusRow: { flexDirection: 'row', gap: 8 },
  diffBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  diffBadgeText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  content: { padding: 16 },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  infoIcon: { marginRight: 10 },
  infoLabel: { flex: 1, fontSize: 14, color: Colors.textSecondary },
  infoValue: { fontSize: 15, fontWeight: '600', color: Colors.text },
  statsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginTop: 6 },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  descCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  descText: { fontSize: 15, color: Colors.text, lineHeight: 22 },
  safetyCard: {
    backgroundColor: Colors.warning + '15',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  safetyTip: { fontSize: 13, color: Colors.text, marginVertical: 3, lineHeight: 20 },
  joinButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  leaveButton: { backgroundColor: Colors.error },
  fullButton: { backgroundColor: Colors.textLight },
  btnIcon: { marginRight: 8 },
  joinButtonText: { color: Colors.white, fontSize: 17, fontWeight: 'bold' },
});
