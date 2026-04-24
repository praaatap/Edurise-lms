import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  ActivityIndicator,
  Alert,
  AppState,
  useColorScheme as useNativeColorScheme,
  View,
} from 'react-native';

import { Colors } from '@/core/theme/colors';
import { OfflineBanner } from '@/shared/components/ui/OfflineBanner';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useThemeStore } from '@/core/theme/themeStore';
import { requestPermissions, scheduleReminderNotification } from '@/features/notifications/services/notificationService';

// Initialize Sentry
Sentry.init({
  dsn: "https://examplePublicKey@o0.ingest.sentry.io/0", // Replace with actual DSN
  debug: false,
  enableNative: true,
});

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  const nativeColorScheme = useNativeColorScheme();
  const { theme: storedTheme } = useThemeStore();
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, checkAuth, isLoading: isAuthLoading } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const theme = storedTheme === 'system' ? nativeColorScheme : storedTheme;
  const isDark = theme === 'dark';

  useEffect(() => {
    const init = async () => {
      // 1. Auth check
      await checkAuth();

      // 2. Notification permissions
      const notificationsEnabled = await requestPermissions();
      if (notificationsEnabled) {
        await scheduleReminderNotification();
      }

      // 4. Biometric Unlock Check
      const biometricEnabled = await AsyncStorage.getItem('biometric_enabled');
      if (biometricEnabled === 'true' && useAuthStore.getState().isAuthenticated) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock Mini LMS',
          fallbackLabel: 'Use Passcode',
        });
        if (result.success) {
          setIsUnlocked(true);
        } else {
          await useAuthStore.getState().logout();
          setIsUnlocked(true);
          Alert.alert('Authentication Failed', 'Please sign in again.');
        }
      } else {
        setIsUnlocked(true);
      }

      setIsReady(true);
    };
    init();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void scheduleReminderNotification();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!isReady || isAuthLoading || !isUnlocked) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isReady, isAuthLoading, isUnlocked, segments]);

  if (!isReady || isAuthLoading || !isUnlocked) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? 'bg-dark-background' : 'bg-background'}`}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <OfflineBanner />
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDark ? Colors.dark.background : Colors.background }
      }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="course/[id]/index" />
        <Stack.Screen name="course/[id]/content" />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}


export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <RootLayoutContent />
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}



