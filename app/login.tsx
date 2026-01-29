import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../constants/config';
import { ApiError } from '../services/api';

// Simple email validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Input validation
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      Alert.alert('오류', '올바른 이메일 형식을 입력해주세요.');
      return;
    }

    if (trimmedPassword.length < 4) {
      Alert.alert('오류', '비밀번호는 4자 이상이어야 합니다.');
      return;
    }

    if (isRegister && !trimmedName) {
      Alert.alert('오류', '이름을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(trimmedEmail, trimmedPassword, trimmedName);
      } else {
        await login(trimmedEmail, trimmedPassword);
      }
      router.replace('/(main)');
    } catch (error: unknown) {
      // Use sanitized error message from ApiError
      const message = error instanceof ApiError
        ? error.message
        : '오류가 발생했습니다. 다시 시도해주세요.';
      Alert.alert('오류', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.logo}>🦎</Text>
            <Text style={styles.title}>Gecko Rack Manager</Text>
            <Text style={styles.subtitle}>도마뱀붙이 관리의 시작</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.formTitle}>
              {isRegister ? '회원가입' : '로그인'}
            </Text>

            {isRegister && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>이름</Text>
                <TextInput
                  style={styles.input}
                  placeholder="이름을 입력하세요"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="none"
                  maxLength={50}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>이메일</Text>
              <TextInput
                style={styles.input}
                placeholder="이메일을 입력하세요"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={100}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>비밀번호</Text>
              <TextInput
                style={styles.input}
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                maxLength={100}
              />
            </View>

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>
                  {isRegister ? '가입하기' : '로그인'}
                </Text>
              )}
            </Pressable>

            <Pressable
              style={styles.switchButton}
              onPress={() => setIsRegister(!isRegister)}
            >
              <Text style={styles.switchText}>
                {isRegister
                  ? '이미 계정이 있으신가요? 로그인'
                  : '계정이 없으신가요? 회원가입'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  form: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: COLORS.primary,
    fontSize: 14,
  },
});
