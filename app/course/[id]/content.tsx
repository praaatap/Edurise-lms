import { Colors } from '@/core/theme/colors';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { generateCourseHtml } from '@/features/courses/utils/courseHtml';
import {
  clearCourseReminderNotification,
  scheduleCourseReengagementReminder,
} from '@/features/notifications/services/notificationService';
import { OfflineBanner } from '@/shared/components/ui/OfflineBanner';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, TriangleAlert } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

export default function CourseContentScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getCourseById, completeCourse, updateQuizScore } = useCourseStore();
  const { user, token } = useAuthStore();
  const webViewRef = useRef<WebView>(null);

  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [webViewError, setWebViewError] = useState<string | null>(null);
  const shouldScheduleReminderRef = useRef(true);

  const course = useMemo(() => getCourseById(id as string), [id, getCourseById]);

  const nativeHeaders = useMemo(
    () => ({
      Authorization: token ? `Bearer ${token}` : 'Guest',
      'X-Course-Id': String(id),
      'X-Native-App': 'mini-lms-expo',
    }),
    [id, token]
  );

  const htmlTemplate = useMemo(() => {
    if (!course) return '';
    return generateCourseHtml(course);
  }, [course]);

  const injectedJS = useMemo(() => {
    if (!course) return '';
    return `
      window.courseData = ${JSON.stringify(course)};
      window.nativeHeaders = ${JSON.stringify(nativeHeaders)};
      document.dispatchEvent(new Event('courseDataReady'));
      document.dispatchEvent(new Event('nativeHeadersReady'));
      true;
    `;
  }, [course, nativeHeaders]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'COMPLETE_COURSE') {
        shouldScheduleReminderRef.current = false;
        completeCourse(id as string);
        void clearCourseReminderNotification();
        Alert.alert('Course Completed', 'Congratulations! Great progress.');
        router.back();
      } else if (data.type === 'QUIZ_SCORE') {
        updateQuizScore(id as string, data.score);
      }
    } catch {
      setWebViewError('Could not process content interaction. Please reload and try again.');
    }
  };

  useEffect(() => {
    void clearCourseReminderNotification();

    return () => {
      if (!course || !shouldScheduleReminderRef.current) return;
      void scheduleCourseReengagementReminder(course.id, course.title, 60 * 60);
    };
  }, [course]);

  if (!course) return null;

  if (webViewError) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <OfflineBanner />
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <TouchableOpacity className="w-10 h-10 items-center justify-center" onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text className="text-base font-bold text-text flex-1 text-center" numberOfLines={1}>{course.title}</Text>
          <View className="w-10" />
        </View>

        <View className="flex-1 justify-center items-center px-6">
          <TriangleAlert size={40} color={Colors.error} />
          <Text className="text-xl font-bold text-text mt-3">Content Failed To Load</Text>
          <Text className="mt-2 text-sm text-text-muted text-center leading-5">{webViewError}</Text>
          <TouchableOpacity
            className="mt-6 bg-primary rounded-xl px-5 py-3"
            onPress={() => {
              setWebViewError(null);
              setIsLoading(true);
              webViewRef.current?.reload();
            }}
          >
            <Text className="text-white text-base font-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <OfflineBanner />
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <TouchableOpacity className="w-10 h-10 items-center justify-center" onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text className="text-base font-bold text-text flex-1 text-center" numberOfLines={1}>{course.title}</Text>
        <View className="w-10" />
      </View>

      <View className="h-1 bg-border w-full">
        <View className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
      </View>

      <View className="flex-1">
        <WebView
          ref={webViewRef}
          source={{ html: htmlTemplate, baseUrl: 'https://mini-lms.local' }}
          className="flex-1"
          injectedJavaScriptBeforeContentLoaded={injectedJS}
          onLoadStart={() => {
            setIsLoading(true);
            setWebViewError(null);
          }}
          onLoadEnd={() => {
            setIsLoading(false);
            webViewRef.current?.postMessage(
              JSON.stringify({
                type: 'NATIVE_HEADERS',
                headers: nativeHeaders,
                user: user,
              })
            );
          }}
          onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
          originWhitelist={['https://mini-lms.local']}
          onShouldStartLoadWithRequest={(request) => {
            // Security: Prevent navigation to external sites inside this content viewer
            return request.url.startsWith('https://mini-lms.local');
          }}
          onMessage={handleMessage}
          onError={() => {
            setWebViewError('Could not load course content. Please check your connection and retry.');
          }}
          startInLoadingState={true}
          renderLoading={() => (
            <View className="absolute inset-0 justify-center items-center bg-background">
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
