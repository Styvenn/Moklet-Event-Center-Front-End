// app/verify-otp.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { ApiErrorResponse } from '../services/api';

const OTP_LENGTH = 6;
const COUNTDOWN_SECONDS = 45;

export default function VerifyOTPScreen() {
  const { email, provider } = useLocalSearchParams<{ email: string; provider?: string }>();
  const displayEmail = email ?? '';
  const { verifyOtp, requestOtp, refreshMe } = useAuth();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Real countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const formatTime = (seconds: number) => {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const handleOtpChange = (value: string, index: number) => {
    setErrorMsg(null);
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    // Auto-advance to next box
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-dismiss keyboard when last digit is filled
    if (digit && index === OTP_LENGTH - 1 && newOtp.every((d) => d !== '')) {
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend || !displayEmail) return;
    setErrorMsg(null);
    try {
      await requestOtp(displayEmail);
      setOtp(Array(OTP_LENGTH).fill(''));
      setCountdown(COUNTDOWN_SECONDS);
      setCanResend(false);
      inputRefs.current[0]?.focus();
      Alert.alert('Sukses', 'Kode OTP baru telah dikirimkan ke email Anda.');
    } catch (err: any) {
      const apiErr = err as ApiErrorResponse;
      setErrorMsg(apiErr.formattedMessage || 'Gagal mengirim ulang OTP.');
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < OTP_LENGTH || !displayEmail) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      await verifyOtp(displayEmail, otpCode);
      const currentUser = await refreshMe();
      setLoading(false);

      if (provider === 'google') {
        router.replace({ pathname: '/setup-password', params: { email: displayEmail } });
      } else if (currentUser?.role === 'ADMIN_KESISWAAN') {
        router.replace('/(admin)/dashboard');
      } else if (currentUser?.role === 'PANITIA') {
        // Panitia bukan siswa, tidak perlu lewat complete-profile
        router.replace('/(tabs)/home');
      } else if (currentUser && currentUser.student) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/complete-profile');
      }
    } catch (err: any) {
      setLoading(false);
      const apiErr = err as ApiErrorResponse;
      setErrorMsg(apiErr.formattedMessage || 'Kode OTP tidak valid atau telah kedaluwarsa.');
    }
  };

  const isComplete = otp.every((d) => d !== '');

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="arrow-back" size={22} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Moklet Event Center</Text>
              <View style={styles.headerSpacer} />
            </View>

            {/* Body */}
            <View style={styles.container}>
              <Text style={styles.title}>Masukkan Kode OTP</Text>
              <Text style={styles.subtitle}>
                Kode verifikasi telah dikirimkan ke email{'\n'}
                <Text style={styles.emailHighlight}>{displayEmail}</Text>
              </Text>

              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              {/* OTP Card */}
              <View style={styles.otpCard}>
                {/* 6 OTP Boxes */}
                <View style={styles.otpRow}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => { inputRefs.current[index] = ref; }}
                      style={[
                        styles.otpBox,
                        digit ? styles.otpBoxFilled : null,
                        errorMsg ? styles.otpBoxError : null,
                      ]}
                      value={digit}
                      onChangeText={(v) => handleOtpChange(v, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                      selectTextOnFocus
                      autoFocus={index === 0}
                    />
                  ))}
                </View>

                {/* Timer & Resend */}
                <View style={styles.resendContainer}>
                  {!canResend ? (
                    <Text style={styles.countdownText}>
                      Kirim ulang dalam <Text style={styles.countdownBold}>{formatTime(countdown)}</Text>
                    </Text>
                  ) : (
                    <Text style={styles.countdownText}>Kode sudah kedaluwarsa</Text>
                  )}
                  <TouchableOpacity onPress={handleResend} disabled={!canResend}>
                    <Text style={[styles.resendLink, canResend ? styles.resendLinkActive : styles.resendLinkDisabled]}>
                      Kirim Ulang OTP
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Sticky Bottom Button */}
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  (!isComplete || loading) && styles.verifyButtonDisabled,
                ]}
                onPress={handleVerify}
                disabled={!isComplete || loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verifikasi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'android' ? 32 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#FEE2E2',
    backgroundColor: Colors.white,
  },
  backButton: {
    padding: 4,
    width: 32,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  headerSpacer: {
    width: 32,
  },
  container: {
    flex: 1,
    padding: Spacing.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textMain,
    marginBottom: Spacing.sm,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSubtitle,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  emailHighlight: {
    color: Colors.primary,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    flex: 1,
  },
  otpCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.white,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textMain,
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
  },
  otpBoxError: {
    borderColor: Colors.error,
  },
  resendContainer: {
    alignItems: 'center',
    gap: 6,
  },
  countdownText: {
    fontSize: 13,
    color: Colors.textSubtitle,
  },
  countdownBold: {
    fontWeight: '700',
    color: Colors.textMain,
  },
  resendLink: {
    fontSize: 13,
    marginTop: 2,
  },
  resendLinkDisabled: {
    color: Colors.textSubtitle,
  },
  resendLinkActive: {
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  bottomBar: {
    padding: Spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.base,
    backgroundColor: Colors.white,
  },
  verifyButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});