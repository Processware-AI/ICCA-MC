import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { paymentService } from '../../services/paymentService';
import { Payment } from '../../types';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/useAuthStore';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: '처리 중', color: Colors.warning, icon: 'time-outline' },
  completed: { label: '완료', color: Colors.success, icon: 'checkmark-circle-outline' },
  failed: { label: '실패', color: Colors.error, icon: 'close-circle-outline' },
  refunded: { label: '환불', color: Colors.info, icon: 'return-up-back-outline' },
};

const TYPE_MAP: Record<string, { label: string; icon: string; color: string }> = {
  membership: { label: '연회비', icon: 'card', color: Colors.primary },
  event: { label: '참가비', icon: 'trail-sign', color: Colors.secondary },
  equipment: { label: '장비', icon: 'bag', color: Colors.info },
};

export default function PaymentHistoryScreen() {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPayments = async () => {
    try {
      if (user) {
        const data = await paymentService.getPaymentHistory(user.id);
        setPayments(data);
      }
    } catch {
      setPayments(SAMPLE_PAYMENTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadPayments(); }, []);

  const totalPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const renderPayment = ({ item }: { item: Payment }) => {
    const status = STATUS_MAP[item.status];
    const type = TYPE_MAP[item.type];
    return (
      <View style={styles.paymentCard}>
        <View style={[styles.typeIcon, { backgroundColor: type.color + '20' }]}>
          <Ionicons name={type.icon as any} size={24} color={type.color} />
        </View>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentDesc}>{item.description}</Text>
          <Text style={styles.paymentDate}>
            {format(new Date(item.createdAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
            <Ionicons name={status.icon as any} size={12} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}> {status.label}</Text>
          </View>
        </View>
        <Text style={[
          styles.amount,
          item.status === 'refunded' && { color: Colors.info },
          item.status === 'failed' && { color: Colors.textLight },
        ]}>
          {item.status === 'refunded' ? '-' : '+'}{item.amount.toLocaleString()}원
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 요약 카드 */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>총 결제 금액</Text>
          <Text style={styles.summaryAmount}>{totalPaid.toLocaleString()}원</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>결제 건수</Text>
          <Text style={styles.summaryCount}>{payments.filter(p => p.status === 'completed').length}건</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={payments}
          renderItem={renderPayment}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPayments(); }} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color={Colors.textLight} />
              <Text style={styles.emptyText}>결제 내역이 없습니다.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const SAMPLE_PAYMENTS: Payment[] = [
  {
    id: '1',
    userId: 'user1',
    userName: '홍길동',
    type: 'membership',
    description: '2024년 연회비',
    amount: 120000,
    status: 'completed',
    transactionId: 'TXN_001',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    userId: 'user1',
    userName: '홍길동',
    type: 'event',
    description: '등산 참가비: 북한산 정기 산행',
    amount: 15000,
    status: 'completed',
    eventId: 'event1',
    transactionId: 'TXN_002',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    userId: 'user1',
    userName: '홍길동',
    type: 'event',
    description: '등산 참가비: 설악산 원정',
    amount: 80000,
    status: 'completed',
    eventId: 'event2',
    transactionId: 'TXN_003',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    padding: 20,
    justifyContent: 'space-around',
  },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
  summaryAmount: { fontSize: 22, fontWeight: 'bold', color: Colors.white },
  summaryCount: { fontSize: 22, fontWeight: 'bold', color: Colors.white },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  list: { padding: 16 },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  typeIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  paymentInfo: { flex: 1 },
  paymentDesc: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  paymentDate: { fontSize: 12, color: Colors.textSecondary, marginBottom: 6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '600' },
  amount: { fontSize: 17, fontWeight: 'bold', color: Colors.primary },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyText: { marginTop: 12, color: Colors.textLight, fontSize: 16 },
});
