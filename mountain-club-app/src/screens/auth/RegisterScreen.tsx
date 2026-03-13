import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const { register, isLoading } = useAuthStore();

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    const { name, email, phone, password, confirmPassword, emergencyName, emergencyPhone, emergencyRelationship } = formData;

    if (!name || !email || !phone || !password) {
      Alert.alert('오류', '필수 항목을 모두 입력해주세요.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('오류', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    try {
      await register(email.trim(), password, {
        name,
        phone,
        emergencyContact: emergencyName ? {
          name: emergencyName,
          phone: emergencyPhone,
          relationship: emergencyRelationship,
        } : undefined,
      });
      Alert.alert('가입 완료', '이카산악회에 오신 것을 환영합니다!');
    } catch (error: any) {
      Alert.alert('가입 실패', error.message || '회원가입에 실패했습니다.');
    }
  };

  const InputField = ({
    icon, placeholder, field, keyboardType = 'default', secureTextEntry = false,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    placeholder: string;
    field: string;
    keyboardType?: any;
    secureTextEntry?: boolean;
  }) => (
    <View style={styles.inputContainer}>
      <Ionicons name={icon} size={20} color={Colors.textSecondary} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.textLight}
        value={formData[field as keyof typeof formData]}
        onChangeText={v => updateField(field, v)}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
      />
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>기본 정보</Text>

        <InputField icon="person-outline" placeholder="이름 *" field="name" />
        <InputField icon="mail-outline" placeholder="이메일 *" field="email" keyboardType="email-address" />
        <InputField icon="call-outline" placeholder="전화번호 *" field="phone" keyboardType="phone-pad" />

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="비밀번호 * (6자 이상)"
            placeholderTextColor={Colors.textLight}
            value={formData.password}
            onChangeText={v => updateField('password', v)}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <InputField icon="lock-closed-outline" placeholder="비밀번호 확인 *" field="confirmPassword" secureTextEntry={!showPassword} />

        <View style={styles.sectionDivider} />
        <Text style={styles.sectionTitle}>비상 연락처 (선택)</Text>
        <Text style={styles.sectionDesc}>등산 중 응급 상황 시 연락할 분의 정보를 입력해주세요.</Text>

        <InputField icon="person-outline" placeholder="비상 연락처 이름" field="emergencyName" />
        <InputField icon="call-outline" placeholder="비상 연락처 전화번호" field="emergencyPhone" keyboardType="phone-pad" />
        <InputField icon="people-outline" placeholder="관계 (예: 배우자, 부모님)" field="emergencyRelationship" />

        <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.registerButtonText}>회원가입 완료</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginLink} onPress={() => navigation.goBack()}>
          <Text style={styles.loginLinkText}>이미 회원이신가요? 로그인</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 12, marginTop: 8 },
  sectionDesc: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
  sectionDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 20 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
    height: 50,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 16, color: Colors.text },
  registerButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  registerButtonText: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
  loginLink: { alignItems: 'center', marginTop: 16, padding: 8 },
  loginLinkText: { color: Colors.primary, fontSize: 16 },
});
