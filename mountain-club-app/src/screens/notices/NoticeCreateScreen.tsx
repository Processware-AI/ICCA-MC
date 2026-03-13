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
import { noticeService } from '../../services/noticeService';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors } from '../../constants/colors';

const CATEGORIES = [
  { value: 'general', label: '일반', color: Colors.info },
  { value: 'important', label: '중요', color: Colors.error },
  { value: 'event', label: '행사', color: Colors.secondary },
  { value: 'safety', label: '안전', color: Colors.warning },
];

export default function NoticeCreateScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'general' | 'important' | 'event' | 'safety'>('general');
  const [isPinned, setIsPinned] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('오류', '제목과 내용을 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      await noticeService.createNotice({
        title: title.trim(),
        content: content.trim(),
        author: user?.name || '관리자',
        authorId: user?.id || '',
        category,
        isPinned,
      });
      Alert.alert('완료', '공지사항이 등록되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('오류', error.message || '등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.label}>제목</Text>
        <TextInput
          style={styles.input}
          placeholder="공지사항 제목을 입력해주세요."
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={Colors.textLight}
        />

        <Text style={styles.label}>카테고리</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.value}
              style={[styles.catBtn, category === cat.value && { backgroundColor: cat.color, borderColor: cat.color }]}
              onPress={() => setCategory(cat.value as any)}
            >
              <Text style={[styles.catBtnText, category === cat.value && { color: Colors.white }]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>상단 고정</Text>
          <Switch
            value={isPinned}
            onValueChange={setIsPinned}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>

        <Text style={styles.label}>내용</Text>
        <TextInput
          style={styles.textarea}
          placeholder="공지사항 내용을 입력해주세요."
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={10}
          placeholderTextColor={Colors.textLight}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={loading}>
        {loading ? <ActivityIndicator color={Colors.white} /> : (
          <>
            <Ionicons name="checkmark-circle-outline" size={22} color={Colors.white} style={{ marginRight: 8 }} />
            <Text style={styles.submitBtnText}>공지사항 등록</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 8, marginTop: 4 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, height: 48, fontSize: 15, color: Colors.text, backgroundColor: Colors.gray[50], marginBottom: 16 },
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  catBtn: { borderWidth: 2, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  catBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  textarea: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, fontSize: 15, color: Colors.text, backgroundColor: Colors.gray[50], minHeight: 200 },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: 14, height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
});
