import { Colors } from '@/core/theme/colors';
import { useAuthStore } from '@/features/auth/store/authStore';
import { AnimatedSplashScreen } from '@/shared/components/ui/AnimatedSplashScreen';
import { CustomDialog } from '@/shared/components/ui/CustomDialog';
import { ErrorBoundary } from '@/shared/components/ui/ErrorBoundary';
import { InAppNotificationBanner } from '@/shared/components/ui/InAppNotificationBanner';
import { OfflineBanner } from '@/shared/components/ui/OfflineBanner';
import { OfflineScreen } from '@/shared/components/ui/OfflineScreen';
import { WelcomeScreen } from '@/shared/components/ui/WelcomeScreen';
import {
  getRouteFromNotificationData,
  useRootLayoutController,
} from '@/shared/hooks/useRootLayoutController';
import { useUpdates } from '@/shared/hooks/useUpdates';
import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { BackHandler, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';
import 'text-encoding';
import '../global.css';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might cause this error */
});

// Initialize Sentry — only when a real DSN is provided via environment variable
// Note: clarityService.initialize() is handled inside useRootLayoutController.ts
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    debug: __DEV__,
    enableNative: true,
    tracesSampleRate: __DEV__ ? 1.0 : 0.3,
    profilesSampleRate: 0.5,
    enableAutoPerformanceTracing: true,
    integrations: [Sentry.reactNativeTracingIntegration()],
  });
  if (__DEV__)
    console.log(
      '[Sentry] Initialized with DSN:',
      SENTRY_DSN.slice(0, 30) + '...',
    );
}

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  const {
    isReady,
    isAuthLoading,
    isUnlocked,
    isSplashAnimationComplete,
    setIsSplashAnimationComplete,
    showWelcome,
    setShowWelcome,
    showOfflineScreen,
    setShowOfflineScreen,
    showExitConfirm,
    setShowExitConfirm,
    foregroundNotification,
    setForegroundNotification,
    dialogConfig,
    setDialogConfig,
    isConnected,
    isDark,
    bgColor,
    setPendingRoute,
  } = useRootLayoutController();

  // EAS Updates
  useUpdates();

  if (!isReady || isAuthLoading || !isUnlocked) {
    return null; // Native splash screen is still showing
  }

  if (!isSplashAnimationComplete) {
    return (
      <AnimatedSplashScreen
        onAnimationComplete={() => setIsSplashAnimationComplete(true)}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      {showWelcome && (
        <WelcomeScreen
          username={useAuthStore.getState().user?.username || 'Explorer'}
          onComplete={() => setShowWelcome(false)}
        />
      )}
      <InAppNotificationBanner
        visible={foregroundNotification.visible}
        title={foregroundNotification.title}
        message={foregroundNotification.message}
        onPress={() => {
          const route = getRouteFromNotificationData(
            foregroundNotification.data ?? {},
          );
          if (route) {
            setPendingRoute(route);
          }
          setForegroundNotification((current) => ({
            ...current,
            visible: false,
          }));
        }}
        onDismiss={() =>
          setForegroundNotification((current) => ({
            ...current,
            visible: false,
          }))
        }
      />
      <CustomDialog
        visible={dialogConfig.visible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        onConfirm={() => {
          dialogConfig.onConfirm?.();
          setDialogConfig((prev) => ({ ...prev, visible: false }));
        }}
        onCancel={() =>
          setDialogConfig((prev) => ({ ...prev, visible: false }))
        }
      />
      <CustomDialog
        visible={showExitConfirm}
        title="Exit app?"
        message="Do you want to really exit the app?"
        confirmText="Exit"
        cancelText="Stay"
        type="destructive"
        onConfirm={() => {
          setShowExitConfirm(false);
          BackHandler.exitApp();
        }}
        onCancel={() => setShowExitConfirm(false)}
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
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isDark ? Colors.dark.background : Colors.background,
          },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="course/[id]/index" />
        <Stack.Screen name="course/[id]/content" />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}

export default Sentry.wrap(function RootLayout() {
  return (
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
        <SafeAreaProvider>
          <ErrorBoundary>
            <RootLayoutContent />
          </ErrorBoundary>
        </SafeAreaProvider>
      </View>
    </GestureHandlerRootView>
  );
});
