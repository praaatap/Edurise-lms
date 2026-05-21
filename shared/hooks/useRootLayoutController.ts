import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as Linking from "expo-linking";
import * as LocalAuthentication from "expo-local-authentication";
import * as Notifications from "expo-notifications";
import { usePathname, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import {
  AppState,
  BackHandler,
  Platform,
  useColorScheme as useNativeColorScheme,
} from "react-native";

import { analytics } from "@/core/services/analyticsService";
import { clarityService } from "@/core/services/clarityService";
import { trackScreenView } from "@/core/services/sentryPerformance";
import { Colors } from "@/core/theme/colors";
import { useThemeStore } from "@/core/theme/themeStore";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
  requestPermissions,
  scheduleReminderNotification,
} from "@/features/notifications/services/notificationService";
import { useNetworkStatus } from "@/shared/utils/network";

type DialogConfig = {
  visible: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
};

type ForegroundNotification = {
  visible: boolean;
  title: string;
  message: string;
  data?: Record<string, any>;
};

function getRouteFromUrl(url?: string | null) {
  if (typeof url !== "string" || !url) {
    return null;
  }

  const normalized = url.replace(/^https?:\/\//, "");
  const match = normalized.match(
    /(?:^|\/|edurise:\/\/)(course)\/([^/?#]+)(?:\/(content))?/,
  );

  if (!match?.[2]) {
    return null;
  }

  return match[3] === "content"
    ? `/course/${match[2]}/content`
    : `/course/${match[2]}`;
}

export function getRouteFromNotificationData(data: Record<string, any>) {
  const courseId = data?.courseId as string | undefined;
  if (courseId) {
    if (data?.screen === "content" || data?.path === "content") {
      return `/course/${courseId}/content`;
    }
    return `/course/${courseId}`;
  }

  const route = getRouteFromUrl(data?.route as string | undefined);
  if (route) {
    return route;
  }

  const url = getRouteFromUrl(data?.url as string | undefined);
  if (url) {
    return url;
  }

  return null;
}

export function useRootLayoutController() {
  const nativeColorScheme = useNativeColorScheme();
  const { theme: storedTheme } = useThemeStore();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const {
    isAuthenticated,
    checkAuth,
    isLoading: isAuthLoading,
  } = useAuthStore();
  const { isConnected } = useNetworkStatus();

  const [isReady, setIsReady] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isSplashAnimationComplete, setIsSplashAnimationComplete] =
    useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [wasAuthenticatedOnInit, setWasAuthenticatedOnInit] = useState(false);
  const [showOfflineScreen, setShowOfflineScreen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [foregroundNotification, setForegroundNotification] =
    useState<ForegroundNotification>({
      visible: false,
      title: "",
      message: "",
    });
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [dialogConfig, setDialogConfig] = useState<DialogConfig>({
    visible: false,
    title: "",
    message: "",
  });

  const theme = storedTheme === "system" ? nativeColorScheme : storedTheme;
  const isDark = theme === "dark";
  const bgColor = isDark ? Colors.dark.background : Colors.background;

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<
          string,
          any
        >;
        const actionId = response.actionIdentifier;

        if (
          actionId === "NO" ||
          actionId === "LATER" ||
          (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER &&
            !data?.courseId)
        ) {
          return;
        }

        const route = getRouteFromNotificationData(data);
        if (route) {
          setPendingRoute(route);
        }
      },
    );

    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body, data } = notification.request.content;

        setForegroundNotification({
          visible: true,
          title: title ?? "New notification",
          message: body ?? "",
          data: (data ?? {}) as Record<string, any>,
        });
      },
    );

    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!pendingRoute) return;
    if (!isReady || isAuthLoading || !isUnlocked) return;

    if (isAuthenticated) {
      router.replace(pendingRoute as any);
      setPendingRoute(null);
    }
  }, [
    pendingRoute,
    isReady,
    isAuthLoading,
    isUnlocked,
    isAuthenticated,
    router,
  ]);

  useEffect(() => {
    if (!foregroundNotification.visible) return;

    const timeout = setTimeout(() => {
      setForegroundNotification((current) =>
        current.visible ? { ...current, visible: false } : current,
      );
    }, 5000);

    return () => clearTimeout(timeout);
  }, [
    foregroundNotification.visible,
    foregroundNotification.title,
    foregroundNotification.message,
  ]);

  useEffect(() => {
    if (!isReady || isAuthLoading || !isUnlocked) return;
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data as Record<
          string,
          any
        >;
        const route = getRouteFromNotificationData(data);
        if (route) {
          setPendingRoute(route);
        }
      }
    });
  }, [isReady, isAuthLoading, isUnlocked]);

  useEffect(() => {
    const init = async () => {
      void analytics.init();
      void clarityService.initialize();

      const initialUrl = await Linking.getInitialURL();
      const initialRoute = getRouteFromUrl(initialUrl);
      if (initialRoute) {
        setPendingRoute(initialRoute);
      }

      await checkAuth();

      const authState = useAuthStore.getState();
      setWasAuthenticatedOnInit(authState.isAuthenticated);

      if (authState.isAuthenticated && authState.user) {
        clarityService.identifyUser(authState.user);
      }

      const biometricEnabled = await AsyncStorage.getItem("biometric_enabled");
      if (
        biometricEnabled === "true" &&
        useAuthStore.getState().isAuthenticated
      ) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Unlock Edurise LMS",
          fallbackLabel: "Use Passcode",
        });

        if (result.success) {
          setIsUnlocked(true);
        } else {
          await useAuthStore.getState().logout();
          setIsUnlocked(true);
          setDialogConfig({
            visible: true,
            title: "Authentication Failed",
            message:
              "Your identity could not be verified. Please sign in again to continue.",
          });
        }
      } else {
        setIsUnlocked(true);
      }

      setIsReady(true);

      void (async () => {
        const notificationsEnabled = await requestPermissions();
        if (notificationsEnabled) {
          await scheduleReminderNotification();
        }
      })();

      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        setShowOfflineScreen(true);
      }

      await import("expo-splash-screen").then((mod) => mod.default.hideAsync());
    };

    void init();
  }, [checkAuth]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void scheduleReminderNotification();
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onHardwareBackPress = () => {
      if (router.canGoBack()) {
        return false;
      }

      setShowExitConfirm(true);
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onHardwareBackPress,
    );

    return () => subscription.remove();
  }, [router]);

  useEffect(() => {
    if (pathname) {
      const screenName =
        pathname === "/"
          ? "Home"
          : pathname.replace(/^\//, "").replace(/\//g, "_");
      trackScreenView(screenName);
      clarityService.setScreen(screenName);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isReady || isAuthLoading || !isUnlocked) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      if (pendingRoute) {
        router.replace(pendingRoute as any);
        setPendingRoute(null);
        return;
      }

      if (!wasAuthenticatedOnInit) {
        setShowWelcome(true);
      }
      router.replace("/(tabs)");
    }
  }, [
    isAuthenticated,
    isReady,
    isAuthLoading,
    isUnlocked,
    segments,
    pendingRoute,
    router,
    wasAuthenticatedOnInit,
  ]);

  return {
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
    pendingRoute,
    setPendingRoute,
  };
}
