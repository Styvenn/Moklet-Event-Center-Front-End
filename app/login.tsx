// app/login.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';
import MokletLogo from '../components/MokletLogo';
import { useAuth } from '../context/AuthContext';
import api, { ApiErrorResponse } from '../services/api';

export default function LoginScreen() {
  const { login, refreshMe } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  // Input Focus States
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Forgot Password Modal State
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotEmailError, setForgotEmailError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const generalEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      newErrors.email = 'Email wajib diisi';
    } else if (!generalEmailRegex.test(cleanEmail)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!password) {
      newErrors.password = 'Password wajib diisi';
    } else if (password.length < 8) {
      newErrors.password = 'Password minimal 8 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    const cleanEmail = email.trim().toLowerCase();

    try {
      await login(cleanEmail, password);
      // Fetch data me terbaru untuk cek status verifikasi & student binding
      const currentUser = await refreshMe();
      setLoading(false);

      // TEMP DEBUG — hapus setelah selesai debugging
      console.log('[DEBUG login] currentUser =', JSON.stringify(currentUser, null, 2));

      if (currentUser) {
        const userRole = String(currentUser.role || '').toUpperCase();
        if (currentUser.isEmailVerified === false) {
          router.replace({ pathname: '/verify-otp', params: { email: cleanEmail } });
        } else if (userRole === 'ADMIN_KESISWAAN') {
          // Admin: arahkan ke dashboard admin
          router.replace('/(admin)/dashboard');
        } else if (userRole === 'PANITIA') {
          // Panitia: arahkan ke dashboard panitia
          router.replace('/(panitia)/dashboard');
        } else if (!currentUser.student) {
          router.replace('/complete-profile');
        } else {
          router.replace('/(tabs)/home');
        }
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      setLoading(false);
      const apiErr = err as ApiErrorResponse;
      const msg = apiErr.formattedMessage || 'Email atau password salah';

      if (msg.toLowerCase().includes('email')) {
        setErrors({ email: msg });
      } else if (msg.toLowerCase().includes('password')) {
        setErrors({ password: msg });
      } else {
        setErrors({ general: msg });
      }
    }
  };

  const handleGoogleSignIn = () => {
    router.push({ pathname: '/google-oauth', params: { flow: 'login' } });
  };

  const handleSendResetPassword = async () => {
    const cleanForgotEmail = forgotEmail.trim();
    if (!cleanForgotEmail) {
      setForgotEmailError('Email wajib diisi');
      return;
    }
    if (!generalEmailRegex.test(cleanForgotEmail)) {
      setForgotEmailError('Format email tidak valid');
      return;
    }

    setForgotLoading(true);
    setForgotEmailError('');

    try {
      await api.post('/auth/password/reset-request', { email: cleanForgotEmail });
      setForgotLoading(false);
      setForgotSuccess(true);
    } catch (err: any) {
      setForgotLoading(false);
      const apiErr = err as ApiErrorResponse;
      setForgotEmailError(apiErr.formattedMessage || 'Gagal mengirim instruksi reset password.');
    }
  };

  const closeForgotModal = () => {
    setForgotModalVisible(false);
    setForgotEmail('');
    setForgotEmailError('');
    setForgotSuccess(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Main Login Card */}
        <View style={styles.card}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <MokletLogo />
          </View>

          {/* Heading */}
          <Text style={styles.title}>Selamat Datang di{'\n'}Moklet Event Center</Text>
          <Text style={styles.subtitle}>Masuk menggunakan email sekolah Anda</Text>

          {errors.general ? (
            <View style={styles.generalErrorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
              <Text style={styles.generalErrorText}>{errors.general}</Text>
            </View>
          ) : null}

          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Email Sekolah</Text>
            <View
              style={[
                styles.inputContainer,
                isEmailFocused && styles.inputFocused,
                errors.email ? styles.inputError : null,
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={isEmailFocused ? Colors.primary : Colors.textSubtitle}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="nama@student.moklet.sch.id"
                placeholderTextColor={Colors.textPlaceholder}
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (errors.email) setErrors((e) => ({ ...e, email: undefined, general: undefined }));
                }}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {email.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setEmail('');
                    setErrors((e) => ({ ...e, email: undefined, general: undefined }));
                  }}
                  style={styles.clearIcon}
                >
                  <Ionicons name="close-circle" size={18} color={Colors.textPlaceholder} />
                </TouchableOpacity>
              )}
            </View>
            {errors.email ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
                <Text style={styles.errorText}>{errors.email}</Text>
              </View>
            ) : null}
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Password</Text>
            <View
              style={[
                styles.inputContainer,
                isPasswordFocused && styles.inputFocused,
                errors.password ? styles.inputError : null,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={isPasswordFocused ? Colors.primary : Colors.textSubtitle}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Masukkan password Anda"
                placeholderTextColor={Colors.textPlaceholder}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  if (errors.password) setErrors((e) => ({ ...e, password: undefined, general: undefined }));
                }}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.textSubtitle}
                />
              </TouchableOpacity>
            </View>
            {errors.password ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
                <Text style={styles.errorText}>{errors.password}</Text>
              </View>
            ) : null}
          </View>

          {/* Remember Me & Forgot Password Row */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxSelected]}>
                {rememberMe && <Ionicons name="checkmark" size={13} color={Colors.white} />}
              </View>
              <Text style={styles.rememberMeText}>Ingat Saya</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setForgotEmail(email);
                setForgotModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotPasswordText}>Lupa Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ATAU</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={loading}
            activeOpacity={0.85}
          >
            <GoogleColorIcon />
            <Text style={styles.googleButtonText}>Sign in using Google</Text>
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Belum punya akun? </Text>
            <TouchableOpacity onPress={() => router.push('/register')} activeOpacity={0.7}>
              <Text style={styles.registerLink}>Daftar di sini</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal
        visible={forgotModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeForgotModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={closeForgotModal}>
              <Ionicons name="close" size={22} color={Colors.textSubtitle} />
            </TouchableOpacity>

            {!forgotSuccess ? (
              <>
                <View style={styles.modalIconBadge}>
                  <Ionicons name="key-outline" size={28} color={Colors.primary} />
                </View>
                <Text style={styles.modalTitle}>Lupa Password?</Text>
                <Text style={styles.modalSubtitle}>
                  Masukkan email sekolah Anda. Kami akan mengirimkan instruksi riset password.
                </Text>

                <View style={styles.modalInputWrapper}>
                  <View style={[styles.inputContainer, forgotEmailError ? styles.inputError : null]}>
                    <Ionicons name="mail-outline" size={20} color={Colors.textSubtitle} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="nama@student.moklet.sch.id"
                      placeholderTextColor={Colors.textPlaceholder}
                      value={forgotEmail}
                      onChangeText={(v) => {
                        setForgotEmail(v);
                        setForgotEmailError('');
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  {forgotEmailError ? (
                    <Text style={styles.modalErrorText}>{forgotEmailError}</Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, forgotLoading && styles.primaryButtonDisabled]}
                  onPress={handleSendResetPassword}
                  disabled={forgotLoading}
                  activeOpacity={0.85}
                >
                  {forgotLoading ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Kirim Instruksi</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={[styles.modalIconBadge, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="checkmark-circle-outline" size={32} color="#2E7D32" />
                </View>
                <Text style={styles.modalTitle}>Email Terkirim!</Text>
                <Text style={styles.modalSubtitle}>
                  Instruksi pemulihan password telah dikirim ke{'\n'}
                  <Text style={{ fontWeight: '700', color: Colors.textMain }}>{forgotEmail}</Text>.
                  Silakan periksa kotak masuk atau folder spam Anda.
                </Text>

                <TouchableOpacity
                  style={[styles.primaryButton, { marginTop: Spacing.base }]}
                  onPress={closeForgotModal}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Kembali ke Login</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function GoogleColorIcon() {
  return (
    <View style={gStyles.wrapper}>
      <Text style={gStyles.blue}>G</Text>
    </View>
  );
}

const gStyles = StyleSheet.create({
  wrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#DADCE0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  blue: { fontSize: 14, fontWeight: '700', color: '#4285F4' },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.base,
    paddingVertical: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textMain,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSubtitle,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  generalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  generalErrorText: {
    fontSize: 13,
    color: Colors.error,
    flex: 1,
  },
  inputWrapper: {
    marginBottom: Spacing.base,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMain,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.md,
    height: 50,
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: '#FFF5F5',
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.textMain,
  },
  eyeIcon: {
    padding: 4,
  },
  clearIcon: {
    padding: 4,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 2,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '500',
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: Spacing.lg,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: Colors.white,
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  rememberMeText: {
    fontSize: 13,
    color: Colors.textMain,
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.divider,
  },
  dividerText: {
    fontSize: 11,
    color: Colors.textSubtitle,
    marginHorizontal: Spacing.md,
    fontWeight: '600',
    letterSpacing: 1,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    height: 50,
    backgroundColor: Colors.white,
  },
  googleButtonText: {
    fontSize: 14,
    color: Colors.textMain,
    fontWeight: '600',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  registerText: {
    fontSize: 13,
    color: Colors.textSubtitle,
  },
  registerLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  modalCloseButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: 6,
  },
  modalIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textMain,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSubtitle,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  modalInputWrapper: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  modalErrorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
});
