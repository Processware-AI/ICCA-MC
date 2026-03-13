import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors } from '../../constants/colors';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logout } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃', style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await logout();
          setLoggingOut(false);
        },
      },
    ]);
  };

  const getMembershipLabel = (level: string) => {
    if (level === 'admin') return '관리자';
    if (level === 'senior') return '선임 회원';
    return '일반 회원';
  };

  const getMembershipColor = (level: string) => {
    if (level === 'admin') return Colors.error;
    if (level === 'senior') return Colors.secondary;
    return Colors.primary;
  };

  const MENU_ITEMS = [
    { icon: 'receipt-outline', label: '결제 내역', onPress: () => navigation.navigate('PaymentHistory'), color: Colors.primary },
    { icon: 'card-outline', label: '연회비 납부', onPress: () => navigation.navigate('Payment', { type: 'membership' }), color: Colors.secondary },
    { icon: 'people-outline', label: '회원 목록', onPress: () => navigation.navigate('MemberList'), color: Colors.info },
    { icon: 'notifications-outline', label: '알림 설정', onPress: () => Alert.alert('준비 중', '알림 설정 기능을 준비 중입니다.'), color: Colors.warning },
    { icon: 'shield-checkmark-outline', label: '개인정보 처리방침', onPress: () => Alert.alert('개인정보 처리방침', '개인정보는 안전하게 보호됩니다.'), color: Colors.textSecondary },
    { icon: 'help-circle-outline', label: '문의하기', onPress: () => Alert.alert('문의', '이카산악회 총무에게 연락해 주세요.'), color: Colors.textSecondary },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* 프로필 헤더 */}
      <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.header}>
        <View style={styles.avatarContainer}>
          {user?.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{user?.name?.[0] || '?'}</Text>
            </View>
          )}
        </View>
        <Text style={styles.userName}>{user?.name || '회원'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>

        <View style={[styles.membershipBadge, { backgroundColor: getMembershipColor(user?.membershipLevel || 'general') }]}>
          <Ionicons name="ribbon-outline" size={14} color={Colors.white} />
          <Text style={styles.membershipText}> {getMembershipLabel(user?.membershipLevel || 'general')}</Text>
        </View>
      </LinearGradient>

      {/* 회원 정보 카드 */}
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>회원 정보</Text>
        <InfoRow icon="call-outline" label="전화번호" value={user?.phone || '-'} />
        <InfoRow icon="calendar-outline" label="가입일" value={user?.joinDate ? format(new Date(user.joinDate), 'yyyy년 M월 d일', { locale: ko }) : '-'} />
        {user?.emergencyContact && (
          <>
            <InfoRow icon="alert-circle-outline" label="비상 연락처" value={`${user.emergencyContact.name} (${user.emergencyContact.relationship})`} />
            <InfoRow icon="call-outline" label="비상 연락처 번호" value={user.emergencyContact.phone} />
          </>
        )}
      </View>

      {/* 나의 활동 요약 */}
      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>나의 활동</Text>
        <View style={styles.statsRow}>
          <StatItem icon="trail-sign-outline" value="23" label="참가 산행" color={Colors.primary} />
          <StatItem icon="images-outline" value="15" label="올린 사진" color={Colors.secondary} />
          <StatItem icon="heart-outline" value="42" label="좋아요" color={Colors.error} />
        </View>
      </View>

      {/* 메뉴 목록 */}
      <View style={styles.menuCard}>
        {MENU_ITEMS.map((item, index) => (
          <TouchableOpacity key={index} style={[styles.menuItem, index < MENU_ITEMS.length - 1 && styles.menuItemBorder]} onPress={item.onPress}>
            <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
              <Ionicons name={item.icon as any} size={22} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </TouchableOpacity>
        ))}
      </View>

      {/* 로그아웃 */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} disabled={loggingOut}>
        {loggingOut ? (
          <ActivityIndicator color={Colors.error} />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={22} color={Colors.error} style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>로그아웃</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.version}>이카산악회 v1.0.0</Text>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={Colors.textSecondary} style={styles.infoIcon} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function StatItem({ icon, value, label, color }: { icon: any; value: string; label: string; color: string }) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={26} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', padding: 28, paddingBottom: 32 },
  avatarContainer: { marginBottom: 12 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: Colors.white },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: Colors.white },
  userName: { fontSize: 24, fontWeight: 'bold', color: Colors.white, marginBottom: 4 },
  userEmail: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  membershipBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  membershipText: { fontSize: 14, color: Colors.white, fontWeight: '600' },
  infoCard: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  infoIcon: { marginRight: 10 },
  infoLabel: { flex: 1, fontSize: 14, color: Colors.textSecondary },
  infoValue: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  statsCard: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: Colors.text, marginTop: 6 },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  menuCard: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  menuIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
    marginTop: 12,
    padding: 16,
    backgroundColor: Colors.error + '15',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  logoutText: { fontSize: 16, color: Colors.error, fontWeight: '600' },
  version: { textAlign: 'center', color: Colors.textLight, fontSize: 12, marginBottom: 32 },
});
