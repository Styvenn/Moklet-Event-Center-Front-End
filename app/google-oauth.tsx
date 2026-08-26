import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Colors, Spacing, Radius } from '../constants/theme';
import { API_URL, tokenStorage, ApiErrorResponse } from '../services/api';
import { useAuth } from '../context/AuthContext';

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default function GoogleOAuthScreen() {
  const params = useLocalSearchParams<{ flow?: string | string[] }>();
  const flow = firstParam(params.flow) || 'login';
  const { requestOtp, refreshMe } = useAuth();
  
  const [errorMsg, setErrorMsg] = useState('');

  const finishWithToken = async (token: string) => {
    await tokenStorage.setItem(token);
    const currentUser = await refreshMe();

    if (currentUser?.role === 'ADMIN_KESISWAAN') {
      router.replace('/(admin)/dashboard');
      return;
    }

    if (currentUser?.role === 'PANITIA') {
      router.replace('/(panitia)/dashboard');
      return;
    }

    if (!currentUser?.student) {
      router.replace('/complete-profile');
      return;
    }

    router.replace('/(tabs)/home');
  };

  const handleMessage = async (event: any) => {
    try {
      const payloadText = String(event?.nativeEvent?.data || '').trim();
      if (!payloadText) return;

      const parsed = JSON.parse(payloadText);
      const data = parsed?.data ?? parsed;

      if (data?.token) {
        await finishWithToken(data.token);
        return;
      }

      if (data?.email && data?.isVerified === false) {
        await requestOtp(data.email);
        router.replace({ pathname: '/verify-otp', params: { email: data.email, provider: 'google' } });
        return;
      }

      setErrorMsg('Respons login Google tidak lengkap. Silakan coba lagi.');
    } catch (err) {
      setErrorMsg('Gagal membaca hasil login Google.');
    }
  };

  const injectedScript = `
    (function() {
      try {
        if (window.location.href.includes('/auth/google/callback')) {
          const bodyText = document.body ? document.body.innerText : '';
          if (bodyText) {
            window.ReactNativeWebView.postMessage(bodyText);
          }
        }
      } catch (e) {}
      true;
    })();
  `;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Google Sign In</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        <View style={styles.webViewCard}>
          <WebView
            source={{ uri: `${API_URL}/auth/google` }}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={["*"]}
            injectedJavaScript={injectedScript}
            onMessage={handleMessage}
            onError={() => setErrorMsg('Gagal membuka halaman Google. Coba lagi.')}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Memproses login Google...</Text>
              </View>
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingTop: Platform.OS === 'android' ? 36 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F7',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  container: {
    flex: 1,
    padding: Spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textMain,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: Spacing.sm,
    fontSize: 14,
    color: Colors.textSubtitle,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.md,
    backgroundColor: '#FFEBEE',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  errorText: {
    flex: 1,
    color: Colors.error,
    fontSize: 13,
  },
  webViewCard: {
    flex: 1,
    marginTop: Spacing.lg,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.sm,
    color: Colors.textSubtitle,
    fontSize: 13,
  },
});