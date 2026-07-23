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
  Alert,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';
import MokletLogo from '../components/MokletLogo';
import { userState } from '../constants/userState';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Input Focus States
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Forgot Password Modal State
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotEmailError, setForgotEmailError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Validation regex for school domains
  const schoolEmailRegex = /^[a-zA-Z0-9._%+-]+@(moklet\.sch\.id|student\.moklet\.sch\.id|smktelkom-mlg\.sch\.id|student\.smktelkom-mlg\.sch\.id)$/i;
  const generalEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      newErrors.email = 'Email wajib diisi';
    } else if (!generalEmailRegex.test(cleanEmail)) {
      newErrors.email = 'Format email tidak valid';
    } else if (!schoolEmailRegex.test(cleanEmail)) {
      newErrors.email = 'Gunakan email sekolah (@moklet.sch.id / @smktelkom-mlg.sch.id)';
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

    const cleanEmail = email.trim().toLowerCase();
    userState.setEmail(cleanEmail);
    userState.setLoggedIn(true);

    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)/home');
    }, 1200);
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    setTimeout(() => {
      setGoogleLoading(false);
      const sampleGoogleEmail = 'siswa.google@student.moklet.sch.id';
      userState.setEmail(sampleGoogleEmail);
      userState.setLoggedIn(true);
      router.replace('/(tabs)/home');
    }, 1500);
  };

  const handleSendResetPassword = () => {
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
    setTimeout(() => {
      setForgotLoading(false);
      setForgotSuccess(true);
    }, 1200);
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
                  if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
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
                    setErrors((e) => ({ ...e, email: undefined }));
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
                  if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
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
            disabled={loading || googleLoading}
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
            style={[styles.googleButton, googleLoading && styles.primaryButtonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={loading || googleLoading}
            activeOpacity={0.85}
          >
            {googleLoading ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <>
                <GoogleColorIcon />
                <Text style={styles.googleButtonText}>Sign in using Google</Text>
              </>
            )}
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

// Google "G" icon component
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
