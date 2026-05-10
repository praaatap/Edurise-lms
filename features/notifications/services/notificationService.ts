import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const MILESTONE_KEY = "@bookmark_milestone_reached";
const REMINDER_NOTIFICATION_ID_KEY = "@engagement_reminder_notification_id";
const COURSE_REMINDER_NOTIFICATION_KEY = "@course_reengagement_reminder";
const PUSH_TOKEN_KEY = "@expo_push_token";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermissions() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4F46E5",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === "granted";
}

/**
 * Registers for real FCM (Android) / APNs (iOS) push notifications.
 * Returns the Expo push token string, or null if unavailable.
 * In production, send this token to your backend so it can send targeted pushes.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Physical device required — simulators do not support push tokens
  const granted = await requestPermissions();
  if (!granted) return null;

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn("[Push] No EAS projectId found in app config.");
      return null;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    // Persist locally — in a real app, POST this to your backend API
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

    // TODO: send token to your backend
    // await api.post('/users/push-token', { token });

    return token;
  } catch (error) {
    console.warn("[Push] Failed to get push token:", error);
    return null;
  }
}

/** Returns the Expo push token previously registered on this device, or null. */
export async function getStoredPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(PUSH_TOKEN_KEY);
}

export async function scheduleBookmarkMilestoneNotification() {
  const hasReached = await AsyncStorage.getItem(MILESTONE_KEY);
  if (!hasReached) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🎉 5 Courses Bookmarked!",
        body: "You're building a great learning plan!",
      },
      trigger: null, // trigger immediately
    });
    await AsyncStorage.setItem(MILESTONE_KEY, "true");
  }
}

export async function scheduleReminderNotification() {
  const existingReminderId = await AsyncStorage.getItem(
    REMINDER_NOTIFICATION_ID_KEY,
  );
  if (existingReminderId) {
    await Notifications.cancelScheduledNotificationAsync(existingReminderId);
  }

  const reminderId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "📚 Continue Learning",
      body: "You haven't opened the app in a while!",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 24 * 60 * 60, // 24 hours
    },
  });

  await AsyncStorage.setItem(REMINDER_NOTIFICATION_ID_KEY, reminderId);
}

export async function clearReminderNotification() {
  const existingReminderId = await AsyncStorage.getItem(
    REMINDER_NOTIFICATION_ID_KEY,
  );
  if (existingReminderId) {
    await Notifications.cancelScheduledNotificationAsync(existingReminderId);
    await AsyncStorage.removeItem(REMINDER_NOTIFICATION_ID_KEY);
  }
}

export async function scheduleCourseReengagementReminder(
  courseId: string,
  courseTitle: string,
  delaySeconds = 60 * 60,
) {
  const existing = await AsyncStorage.getItem(COURSE_REMINDER_NOTIFICATION_KEY);
  if (existing) {
    try {
      const parsed = JSON.parse(existing) as { notificationId?: string };
      if (parsed.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(parsed.notificationId);
      }
    } catch {
      // Ignore malformed storage and continue with fresh scheduling.
    }
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Your course is waiting",
      body: `Jump back into ${courseTitle} and keep your momentum going.`,
      data: { type: "COURSE_REENGAGEMENT", courseId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
    },
  });

  await AsyncStorage.setItem(
    COURSE_REMINDER_NOTIFICATION_KEY,
    JSON.stringify({ notificationId, courseId, scheduledAt: Date.now() }),
  );
}

export async function clearCourseReminderNotification() {
  const existing = await AsyncStorage.getItem(COURSE_REMINDER_NOTIFICATION_KEY);
  if (!existing) return;

  try {
    const parsed = JSON.parse(existing) as { notificationId?: string };
    if (parsed.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(parsed.notificationId);
    }
  } catch {
    // Ignore malformed storage and always clear the key.
  }

  await AsyncStorage.removeItem(COURSE_REMINDER_NOTIFICATION_KEY);
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem(REMINDER_NOTIFICATION_ID_KEY);
}
