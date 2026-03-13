import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { eventService } from '../../services/eventService';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors } from '../../constants/colors';

export default function EventCreateScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    mountain: '',
    description: '',
    date: '',
    meetingTime: '',
    meetingPoint: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    maxParticipants: '20',
    fee: '0',
    distance: '',
    elevationGain: '',
    estimatedDuration: '',
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleCreate = async () => {
    if (!form.title || !form.mountain || !form.date) {
      Alert.alert('오류', '제목, 산 이름, 날짜는 필수 입력 사항입니다.');
      return;
    }
    setLoading(true);
    try {
      await eventService.createEvent({
        title: form.title,
        description: form.description,
        mountain: form.mountain,
        date: new Date(form.date).toISOString(),
        meetingPoint: form.meetingPoint,
        meetingTime: form.meetingTime,
        difficulty: form.difficulty,
        maxParticipants: parseInt(form.maxParticipants) || 20,
        currentParticipants: 0,
        participants: [],
        fee: parseInt(form.fee) || 0,
        leader: user?.name || '',
        status: 'upcoming',
        images: [],
        distance: form.distance ? parseFloat(form.distance) : undefined,
        elevationGain: form.elevationGain ? parseInt(form.elevationGain) : undefined,
        estimatedDuration: form.estimatedDuration || undefined,
        createdAt: new Date().toISOString(),
      });
      Alert.alert('완료', '등산 일정이 등록되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('오류', error.message || '일정 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const DIFFICULTIES = [
    { value: 'easy', label: '쉬움', color: Colors.success },
    { value: 'medium', label: '보통', color: Colors.warning },
    { value: 'hard', label: '어려움', color: Colors.error },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Section title="기본 정보">
        <Field label="제목 *" placeholder="예: 북한산 정기 산행" value={form.title} onChangeText={v => update('title', v)} />
        <Field label="산 이름 *" placeholder="예: 북한산" value={form.mountain} onChangeText={v => update('mountain', v)} />
        <Field label="날짜 *" placeholder="YYYY-MM-DD" value={form.date} onChangeText={v => update('date', v)} keyboardType="default" />
        <Field label="집결 시간" placeholder="예: 오전 8:00" value={form.meetingTime} onChangeText={v => update('meetingTime', v)} />
        <Field label="집결 장소" placeholder="예: 북한산성 탐방지원센터" value={form.meetingPoint} onChangeText={v => update('meetingPoint', v)} />
      </Section>

      <Section title="난이도">
        <View style={styles.difficultyRow}>
          {DIFFICULTIES.map(d => (
            <TouchableOpacity
              key={d.value}
              style={[styles.diffBtn, form.difficulty === d.value && { backgroundColor: d.color, borderColor: d.color }]}
              onPress={() => update('difficulty', d.value)}
            >
              <Text style={[styles.diffBtnText, form.difficulty === d.value && { color: Colors.white }]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Section>

      <Section title="참가 정보">
        <Field label="최대 참가 인원" placeholder="20" value={form.maxParticipants} onChangeText={v => update('maxParticipants', v)} keyboardType="numeric" />
        <Field label="참가비 (원)" placeholder="0" value={form.fee} onChangeText={v => update('fee', v)} keyboardType="numeric" />
      </Section>

      <Section title="산행 상세 (선택)">
        <Field label="총 거리 (km)" placeholder="예: 7.5" value={form.distance} onChangeText={v => update('distance', v)} keyboardType="decimal-pad" />
        <Field label="고도 (m)" placeholder="예: 836" value={form.elevationGain} onChangeText={v => update('elevationGain', v)} keyboardType="numeric" />
        <Field label="예상 소요 시간" placeholder="예: 5~6시간" value={form.estimatedDuration} onChangeText={v => update('estimatedDuration', v)} />
      </Section>

      <Section title="설명">
        <TextInput
          style={styles.textarea}
          placeholder="산행에 대한 상세 설명을 입력해주세요."
          value={form.description}
          onChangeText={v => update('description', v)}
          multiline
          numberOfLines={5}
          placeholderTextColor={Colors.textLight}
          textAlignVertical="top"
        />
      </Section>

      <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={loading}>
        {loading ? <ActivityIndicator color={Colors.white} /> : (
          <>
            <Ionicons name="checkmark-circle-outline" size={22} color={Colors.white} style={{ marginRight: 8 }} />
            <Text style={styles.submitBtnText}>일정 등록</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function Field({ label, placeholder, value, onChangeText, keyboardType = 'default' }: {
  label: string; placeholder: string; value: string;
  onChangeText: (v: string) => void; keyboardType?: any;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor={Colors.textLight}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 8 },
  sectionContent: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, height: 46, fontSize: 15, color: Colors.text, backgroundColor: Colors.gray[50] },
  difficultyRow: { flexDirection: 'row', gap: 10 },
  diffBtn: { flex: 1, borderWidth: 2, borderColor: Colors.border, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  diffBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  textarea: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, fontSize: 15, color: Colors.text, backgroundColor: Colors.gray[50], minHeight: 100 },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: 14, height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
});
