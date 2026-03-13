import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { User } from '../../types';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/useAuthStore';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const LEVEL_MAP: Record<string, { label: string; color: string }> = {
  admin: { label: '관리자', color: Colors.error },
  senior: { label: '선임', color: Colors.secondary },
  general: { label: '일반', color: Colors.primary },
};

export default function MemberListScreen() {
  const { user: currentUser } = useAuthStore();
  const [members, setMembers] = useState<User[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadMembers = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('name'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => doc.data() as User);
      setMembers(data);
      setFilteredMembers(data);
    } catch {
      setMembers(SAMPLE_MEMBERS);
      setFilteredMembers(SAMPLE_MEMBERS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadMembers(); }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredMembers(members);
    } else {
      const lower = search.toLowerCase();
      setFilteredMembers(members.filter(m =>
        m.name.toLowerCase().includes(lower) ||
        m.phone.includes(lower)
      ));
    }
  }, [search, members]);

  const handleCall = (phone: string, name: string) => {
    Alert.alert(`${name}에게 전화`, phone, [
      { text: '취소', style: 'cancel' },
      { text: '전화하기', onPress: () => Linking.openURL(`tel:${phone}`) },
    ]);
  };

  const renderMember = ({ item, index }: { item: User; index: number }) => {
    const level = LEVEL_MAP[item.membershipLevel];
    const initials = item.name.slice(0, 1);

    return (
      <View style={styles.memberCard}>
        <View style={[styles.avatar, { backgroundColor: level.color + '20' }]}>
          <Text style={[styles.avatarText, { color: level.color }]}>{initials}</Text>
        </View>
        <View style={styles.memberInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.memberName}>{item.name}</Text>
            <View style={[styles.levelBadge, { backgroundColor: level.color + '20' }]}>
              <Text style={[styles.levelText, { color: level.color }]}>{level.label}</Text>
            </View>
          </View>
          <Text style={styles.joinDate}>
            <Ionicons name="calendar-outline" size={12} /> {' '}
            {format(new Date(item.joinDate), 'yyyy년 M월 가입', { locale: ko })}
          </Text>
        </View>
        {currentUser?.membershipLevel === 'admin' && item.phone && (
          <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(item.phone, item.name)}>
            <Ionicons name="call-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 검색 바 */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="이름 또는 전화번호로 검색"
          placeholderTextColor={Colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color={Colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.countBar}>
        <Text style={styles.countText}>총 {filteredMembers.length}명의 회원</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={filteredMembers}
          renderItem={renderMember}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadMembers(); }} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={60} color={Colors.textLight} />
              <Text style={styles.emptyText}>회원을 찾을 수 없습니다.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const SAMPLE_MEMBERS: User[] = [
  { id: '1', name: '김철수', email: 'kim@example.com', phone: '010-1234-5678', membershipLevel: 'admin', joinDate: '2020-01-01', isActive: true },
  { id: '2', name: '이영희', email: 'lee@example.com', phone: '010-2345-6789', membershipLevel: 'senior', joinDate: '2021-03-15', isActive: true },
  { id: '3', name: '박민준', email: 'park@example.com', phone: '010-3456-7890', membershipLevel: 'general', joinDate: '2022-05-20', isActive: true },
  { id: '4', name: '최지현', email: 'choi@example.com', phone: '010-4567-8901', membershipLevel: 'general', joinDate: '2023-01-10', isActive: true },
  { id: '5', name: '정수아', email: 'jung@example.com', phone: '010-5678-9012', membershipLevel: 'general', joinDate: '2023-06-01', isActive: true },
  { id: '6', name: '한도영', email: 'han@example.com', phone: '010-6789-0123', membershipLevel: 'senior', joinDate: '2021-09-12', isActive: true },
  { id: '7', name: '오세진', email: 'oh@example.com', phone: '010-7890-1234', membershipLevel: 'general', joinDate: '2022-11-30', isActive: true },
  { id: '8', name: '윤미래', email: 'yoon@example.com', phone: '010-8901-2345', membershipLevel: 'general', joinDate: '2024-01-15', isActive: true },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    margin: 16,
    marginBottom: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 48, fontSize: 15, color: Colors.text },
  countBar: { paddingHorizontal: 20, paddingBottom: 8 },
  countText: { fontSize: 13, color: Colors.textSecondary },
  list: { padding: 16, paddingTop: 8 },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 20, fontWeight: 'bold' },
  memberInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  memberName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  levelText: { fontSize: 11, fontWeight: '700' },
  joinDate: { fontSize: 12, color: Colors.textSecondary },
  callBtn: { padding: 8 },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyText: { marginTop: 12, color: Colors.textLight, fontSize: 16 },
});
