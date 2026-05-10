import 'react-native-url-polyfill/auto';
import 'text-encoding';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';
import * as SplashScreen from 'expo-splash-screen';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might cause this error */
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';
import {
  AppState,
  Platform,
  useColorScheme as useNativeColorScheme,
  View,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomDialog } from '@/shared/components/ui/CustomDialog';
import { AnimatedSplashScreen } from '@/shared/components/ui/AnimatedSplashScreen';
import { Colors } from '@/core/theme/colors';
import * as Linking from 'expo-linking';
import { OfflineBanner } from '@/shared/components/ui/OfflineBanner';
import { OfflineScreen } from '@/shared/components/ui/OfflineScreen';
import { useNetworkStatus } from '@/shared/utils/network';
import { ErrorBoundary } from '@/shared/components/ui/ErrorBoundary';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useThemeStore } from '@/core/theme/themeStore';
import {
  registerForPushNotifications,
  requestPermissions,
  scheduleReminderNotification,
} from '@/features/notifications/services/notificationService';
import { analytics } from '@/core/services/analyticsService';

// Single QueryClient instance for the entire app lifetime
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — matches Zustand cache TTL
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Initialize Sentry — only when a real DSN is provided via environment variable
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    debug: false,
    enableNative: true,
  });
}

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
  const [isSplashAnimationComplete, setIsSplashAnimationComplete] = useState(false);
  const { isConnected } = useNetworkStatus();
  const [showOfflineScreen, setShowOfflineScreen] = useState(false);

  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ visible: false, title: '', message: '' });

  const theme = storedTheme === 'system' ? nativeColorScheme : storedTheme;
  const isDark = theme === 'dark';
  const bgColor = isDark ? Colors.dark.background : Colors.background;

  useEffect(() => {
    const init = async () => {
      // 0. Analytics & Linking init
      await analytics.init();

      // Deep-link on cold start — route to the right screen if the app was
      // opened via a universal link or a notification tap
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        const parsed = Linking.parse(initialUrl);
        // e.g. edurise://course/123  →  { path: 'course/123', ... }
        if (parsed.path) {
          router.push(`/${parsed.path}` as any);
        }
      }

      // 1. Auth check
      await checkAuth();

      // 2. Notification permissions + FCM/APNs push token registration
      const notificationsEnabled = await requestPermissions();
      if (notificationsEnabled) {
        await scheduleReminderNotification();
        // Register and obtain the FCM (Android) / APNs (iOS) push token.
        // In production the token would be sent to your backend here.
        void registerForPushNotifications();
      }

      // 3. Biometric Unlock Check
      const biometricEnabled = await AsyncStorage.getItem('biometric_enabled');
      if (biometricEnabled === 'true' && useAuthStore.getState().isAuthenticated) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock Edurise LMS',
          fallbackLabel: 'Use Passcode',
        });
        if (result.success) {
          setIsUnlocked(true);
        } else {
          await useAuthStore.getState().logout();
          setIsUnlocked(true);
          setDialogConfig({
            visible: true,
            title: 'Authentication Failed',
            message: 'Your identity could not be verified. Please sign in again to continue.',
          });
        }
      } else {
        setIsUnlocked(true);
      }

      setIsReady(true);

      // Check initial network state
      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        setShowOfflineScreen(true);
      }

      // Hide native splash screen once app is ready to show custom animation
      await SplashScreen.hideAsync();
    };
    init();
  }, []);

  // Notification tap deep-link handler (app already open / background)
  // When the user taps a push notification, route them to the correct screen.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as {
          type?: string;
          courseId?: string;
          url?: string;
        };

        if (data.courseId) {
          // e.g. course re-engagement notification → open course detail
          router.push(`/course/${data.courseId}` as any);
        } else if (data.url) {
          // Generic deep-link payload from server-sent push
          const parsed = Linking.parse(data.url);
          if (parsed.path) router.push(`/${parsed.path}` as any);
        }
      }
    );
    return () => subscription.remove();
  }, [router]);

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
    return null; // Native splash screen is still showing
  }

  if (!isSplashAnimationComplete) {
    return <AnimatedSplashScreen onAnimationComplete={() => setIsSplashAnimationComplete(true)} />;
  }

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1, backgroundColor: bgColor }}>
        <CustomDialog
        visible={dialogConfig.visible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        onConfirm={() => {
          dialogConfig.onConfirm?.();
          setDialogConfig(prev => ({ ...prev, visible: false }));
        }}
        onCancel={() => setDialogConfig(prev => ({ ...prev, visible: false }))}
      />
      {!isConnected && showOfflineScreen ? (
        <OfflineScreen 
          onRetry={() => {
            // Network status updates automatically via NetInfo
          }} 
          onContinueOffline={() => setShowOfflineScreen(false)} 
        />
      ) : (
        <OfflineBanner />
      )}
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
      </View>
    </ThemeProvider>
  );
} 


export default Sentry.wrap(function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            maxWidth: Platform.OS === 'web' ? 480 : undefined,
            width: '100%',
            alignSelf: 'center',
            overflow: 'hidden',
            ...(Platform.OS === 'web'
              ? {
                  boxShadow: '0 0 20px rgba(0,0,0,0.05)',
                  borderLeftWidth: 1,
                  borderRightWidth: 1,
                  borderColor: '#e2e8f0',
                }
              : {}),
          }}
        >
          <ErrorBoundary>
            <RootLayoutContent />
          </ErrorBoundary>
        </View>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
});
