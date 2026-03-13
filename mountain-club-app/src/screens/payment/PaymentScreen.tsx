import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { paymentService } from '../../services/paymentService';
import { eventService } from '../../services/eventService';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors } from '../../constants/colors';

type RouteType = RouteProp<RootStackParamList, 'Payment'>;

const MEMBERSHIP_FEE = 120000;

export default function PaymentScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteType>();
  const { user } = useAuthStore();
  const { type, eventId, eventTitle, amount } = route.params;

  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('card');

  const finalAmount = type === 'membership' ? MEMBERSHIP_FEE : (amount || 0);
  const description = type === 'membership'
    ? `${new Date().getFullYear()}년 연회비`
    : `${eventTitle} 참가비`;

  const handlePayment = async () => {
    if (!user) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    Alert.alert(
      '결제 확인',
      `${description}\n결제 금액: ${finalAmount.toLocaleString()}원\n결제 방법: ${PAYMENT_METHODS.find(m => m.value === selectedMethod)?.label}\n\n결제를 진행하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { text: '결제', onPress: processPayment },
      ]
    );
  };

  const processPayment = async () => {
    setLoading(true);
    try {
      // 결제 레코드 생성
      let payment;
      if (type === 'membership') {
        payment = await paymentService.processMembershipFee(user!.id, user!.name, new Date().getFullYear());
      } else {
        payment = await paymentService.processEventFee(user!.id, user!.name, eventId!, eventTitle!, finalAmount);
      }

      // Stripe 결제 처리 (실제 연동 시 주석 해제)
      // const { clientSecret } = await paymentService.createStripePaymentIntent(finalAmount);
      // const { error, paymentIntent } = await confirmPayment(clientSecret, { ... });

      // 시뮬레이션: 결제 성공 처리
      await paymentService.updatePaymentStatus(payment.id, 'completed', `TXN_${Date.now()}`);

      // 이벤트 참가 처리
      if (type === 'event' && eventId && user) {
        await eventService.joinEvent(eventId, user.id);
      }

      Alert.alert(
        '결제 완료! 🎉',
        `${description} 결제가 완료되었습니다.\n결제 금액: ${finalAmount.toLocaleString()}원`,
        [{ text: '확인', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('결제 실패', error.message || '결제 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 결제 정보 카드 */}
      <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.paymentCard}>
        <Ionicons name={type === 'membership' ? 'card' : 'trail-sign'} size={40} color="rgba(255,255,255,0.8)" />
        <Text style={styles.paymentType}>{type === 'membership' ? '연회비 납부' : '등산 참가비'}</Text>
        <Text style={styles.paymentDescription}>{description}</Text>
        <Text style={styles.paymentAmount}>{finalAmount.toLocaleString()}원</Text>
      </LinearGradient>

      {/* 결제 방법 선택 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>결제 방법 선택</Text>
        {PAYMENT_METHODS.map(method => (
          <TouchableOpacity
            key={method.value}
            style={[styles.methodCard, selectedMethod === method.value && styles.selectedMethod]}
            onPress={() => setSelectedMethod(method.value)}
          >
            <View style={[styles.methodIcon, { backgroundColor: method.color + '20' }]}>
              <Ionicons name={method.icon as any} size={24} color={method.color} />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{method.label}</Text>
              <Text style={styles.methodDesc}>{method.description}</Text>
            </View>
            <View style={[styles.radio, selectedMethod === method.value && styles.radioSelected]}>
              {selectedMethod === method.value && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* 결제 요약 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>결제 요약</Text>
        <View style={styles.summaryCard}>
          <SummaryRow label={description} value={`${finalAmount.toLocaleString()}원`} />
          <SummaryRow label="수수료" value="0원" />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>총 결제 금액</Text>
            <Text style={styles.totalValue}>{finalAmount.toLocaleString()}원</Text>
          </View>
        </View>
      </View>

      {/* 안내 문구 */}
      <View style={styles.noticeBox}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
        <Text style={styles.noticeText}>
          결제 완료 후 취소를 원하시면 총무에게 문의해 주세요.{'\n'}
          환불은 영업일 기준 3~5일 소요됩니다.
        </Text>
      </View>

      {/* 결제 버튼 */}
      <TouchableOpacity style={styles.payBtn} onPress={handlePayment} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.white} style={{ marginRight: 8 }} />
            <Text style={styles.payBtnText}>
              {finalAmount.toLocaleString()}원 결제하기
            </Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.secureText}>
        <Ionicons name="shield-checkmark-outline" size={12} /> 안전한 결제 (SSL 암호화)
      </Text>
    </ScrollView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const PAYMENT_METHODS = [
  {
    value: 'card',
    label: '신용/체크카드',
    description: '국내외 모든 카드 사용 가능',
    icon: 'card-outline',
    color: Colors.primary,
  },
  {
    value: 'kakao',
    label: '카카오페이',
    description: '카카오페이로 간편 결제',
    icon: 'chatbubble-outline',
    color: '#FEE500',
  },
  {
    value: 'naver',
    label: '네이버페이',
    description: '네이버페이로 간편 결제',
    icon: 'globe-outline',
    color: '#03C75A',
  },
  {
    value: 'toss',
    label: '토스페이',
    description: '토스로 간편 결제',
    icon: 'phone-portrait-outline',
    color: '#0064FF',
  },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  paymentCard: { padding: 32, alignItems: 'center', marginBottom: 4 },
  paymentType: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 12, fontWeight: '500' },
  paymentDescription: { fontSize: 18, color: Colors.white, fontWeight: '600', marginTop: 4 },
  paymentAmount: { fontSize: 36, fontWeight: 'bold', color: Colors.white, marginTop: 8 },
  section: { padding: 16, paddingBottom: 0 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 12 },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  selectedMethod: { borderColor: Colors.primary },
  methodIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  methodInfo: { flex: 1 },
  methodName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  methodDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  summaryCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.gray[100] },
  summaryLabel: { fontSize: 14, color: Colors.textSecondary },
  summaryValue: { fontSize: 14, color: Colors.text },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: Colors.primary },
  noticeBox: { flexDirection: 'row', margin: 16, backgroundColor: Colors.info + '15', borderRadius: 12, padding: 12, alignItems: 'flex-start', gap: 8 },
  noticeText: { fontSize: 13, color: Colors.text, flex: 1, lineHeight: 20 },
  payBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 58,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  payBtnText: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
  secureText: { textAlign: 'center', color: Colors.textSecondary, fontSize: 12, marginBottom: 32 },
});
