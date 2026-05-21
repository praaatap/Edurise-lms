import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useNotificationPrefsStore } from "@/features/settings/store/notificationPrefsStore";

const MILESTONE_KEY = "@bookmark_milestone_reached";
const REMINDER_NOTIFICATION_ID_KEY = "@engagement_reminder_notification_id";
const COURSE_REMINDER_NOTIFICATION_KEY = "@course_reengagement_reminder";

// ─── Android notification channels ───────────────────────────────────────────
// Each channel maps to a category with its own sound/importance level.
export async function setupNotificationChannels() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("enrollments", {
    name: "Course Enrollments",
    description: "Notifications when you enroll in a course",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#48C78E",
    sound: "default",
  });

  await Notifications.setNotificationChannelAsync("reminders", {
    name: "Study Reminders",
    description: "Daily reminders to keep learning",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200],
    lightColor: "#F97316",
    sound: "default",
  });

  await Notifications.setNotificationChannelAsync("engagement", {
    name: "Re-engagement",
    description: "Reminders to continue courses you've visited",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200],
    lightColor: "#8B5CF6",
    sound: "default",
  });

  await Notifications.setNotificationChannelAsync("achievements", {
    name: "Achievements",
    description: "Milestone and achievement notifications",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 100, 100, 300],
    lightColor: "#EAB308",
    sound: "default",
  });

  await Notifications.setNotificationChannelAsync("general", {
    name: "General",
    description: "General app notifications",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: "default",
  });
}

// ─── Notification handler (shows alert + sound for all notifications) ─────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Permissions ──────────────────────────────────────────────────────────────
export async function requestPermissions() {
  await setupNotificationChannels();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === "granted";
}

// ─── Deep link URL builder (no domain needed — uses app scheme) ───────────────
// Opens directly to a course inside the app when user taps notification
function courseDeepLink(courseId: string) {
  return `edurise://course/${courseId}`;
}

// ─── Enrollment notification — fires immediately on enroll ───────────────────
export async function scheduleEnrollmentNotification(courseTitle: string, courseId?: string) {
  const prefs = useNotificationPrefsStore.getState();
  if (!prefs.masterEnabled || !prefs.categories.courseUpdates) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🎓 You're enrolled!",
      body: `"${courseTitle}" is ready. Start your first lesson now?`,
      data: {
        type: "ENROLLMENT",
        courseId,
      },
      ...(Platform.OS === "android" && {
        channelId: "enrollments",
        categoryIdentifier: "ENROLL_ACTIONS",
      }),
    },
    trigger: null, // instant
  });
}

// ─── Bookmark milestone ───────────────────────────────────────────────────────
export async function scheduleBookmarkMilestoneNotification() {
  const prefs = useNotificationPrefsStore.getState();
  if (!prefs.masterEnabled || !prefs.categories.achievements) return;

  const hasReached = await AsyncStorage.getItem(MILESTONE_KEY);
  if (hasReached) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🎉 5 Courses Bookmarked!",
      body: "You're building a great learning plan. Time to start one?",
      data: { type: "MILESTONE" },
      ...(Platform.OS === "android" && { channelId: "achievements" }),
    },
    trigger: null,
  });
  await AsyncStorage.setItem(MILESTONE_KEY, "true");
}

// ─── Daily reminder ───────────────────────────────────────────────────────────
export async function scheduleReminderNotification() {
  const prefs = useNotificationPrefsStore.getState();
  if (!prefs.masterEnabled || !prefs.categories.reminders) return;

  const existingId = await AsyncStorage.getItem(REMINDER_NOTIFICATION_ID_KEY);
  if (existingId) {
    await Notifications.cancelScheduledNotificationAsync(existingId);
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "📚 Time to learn!",
      body: "You haven't opened Edurise today. Keep your streak alive!",
      data: { type: "DAILY_REMINDER" },
      ...(Platform.OS === "android" && { channelId: "reminders" }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 24 * 60 * 60,
    },
  });

  await AsyncStorage.setItem(REMINDER_NOTIFICATION_ID_KEY, id);
}

export async function clearReminderNotification() {
  const id = await AsyncStorage.getItem(REMINDER_NOTIFICATION_ID_KEY);
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id);
    await AsyncStorage.removeItem(REMINDER_NOTIFICATION_ID_KEY);
  }
}

// ─── Course re-engagement — fires after user leaves a course ─────────────────
export async function scheduleCourseReengagementReminder(
  courseId: string,
  courseTitle: string,
  delaySeconds = 60 * 60,
) {
  const prefs = useNotificationPrefsStore.getState();
  if (!prefs.masterEnabled || !prefs.categories.engagement) return;

  // Cancel any existing re-engagement notification first
  const existing = await AsyncStorage.getItem(COURSE_REMINDER_NOTIFICATION_KEY);
  if (existing) {
    try {
      const parsed = JSON.parse(existing) as { notificationId?: string };
      if (parsed.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(parsed.notificationId);
      }
    } catch { /* ignore malformed */ }
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "⏳ Your course is waiting",
      body: `Ready to continue "${courseTitle}"? Pick up where you left off.`,
      data: {
        type: "COURSE_REENGAGEMENT",
        courseId,
        url: courseDeepLink(courseId),
      },
      ...(Platform.OS === "android" && {
        channelId: "engagement",
        categoryIdentifier: "REENGAGEMENT_ACTIONS",
      }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
    },
  });

  await AsyncStorage.setItem(
    COURSE_REMINDER_NOTIFICATION_KEY,
    JSON.stringify({ notificationId: id, courseId, scheduledAt: Date.now() }),
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
  } catch { /* ignore */ }
  await AsyncStorage.removeItem(COURSE_REMINDER_NOTIFICATION_KEY);
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.multiRemove([REMINDER_NOTIFICATION_ID_KEY, COURSE_REMINDER_NOTIFICATION_KEY]);
}

// ─── Custom notification (used by send-notification screen) ──────────────────
export async function sendCustomNotification(
  title: string,
  body: string,
  options?: {
    delaySeconds?: number;
    courseId?: string;
    withActions?: boolean; // adds Yes/No buttons
  }
) {
  const { delaySeconds = 0, courseId, withActions = false } = options ?? {};

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: {
        type: "CUSTOM",
        courseId,
        url: courseId ? courseDeepLink(courseId) : undefined,
      },
      ...(Platform.OS === "android" && {
        channelId: "general",
        ...(withActions && { categoryIdentifier: "YES_NO_ACTIONS" }),
      }),
    },
    trigger: delaySeconds > 0
      ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delaySeconds }
      : null,
  });
}
