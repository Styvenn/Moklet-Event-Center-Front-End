import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { ApiErrorResponse } from '../services/api';

export default function SetupPasswordScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const { setupPassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!password.trim()) {
      setError('Password wajib diisi.');
      return;
    }

    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await setupPassword(password);
      router.replace('/complete-profile');
    } catch (err: any) {
      const apiErr = err as ApiErrorResponse;
      setError(apiErr.formattedMessage || 'Gagal menyimpan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.headerIcon}>
              <Ionicons name="key-outline" size={28} color={Colors.primary} />
            </View>

            <Text style={styles.title}>Atur Password</Text>
            <Text style={styles.subtitle}>
              Buat password untuk akun sekolah kamu{email ? ` (${email})` : ''}.
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password Baru</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Minimal 8 karakter"
                  placeholderTextColor={Colors.textPlaceholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSubtitle} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Konfirmasi Password</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Ulangi password"
                  placeholderTextColor={Colors.textPlaceholder}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSubtitle} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.noteBox}>
              <Ionicons name="information-circle-outline" size={18} color="#1565C0" />
              <Text style={styles.noteText}>
                Password ini dipakai untuk akses akun sekolah setelah akun Google selesai ditautkan.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Simpan dan Lanjutkan</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingTop: Platform.OS === 'android' ? 36 : 0,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textMain,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSubtitle,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    flex: 1,
    color: Colors.error,
    fontSize: 13,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMain,
    marginBottom: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    paddingRight: Spacing.sm,
  },
  input: {
    flex: 1,
    height: 52,
    paddingHorizontal: Spacing.md,
    color: Colors.textMain,
    fontSize: 14,
  },
  eyeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#1565C0',
    lineHeight: 18,
  },
  primaryBtn: {
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});