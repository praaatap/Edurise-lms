import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { generateCourseHtml } from '@/features/courses/utils/courseHtml';
import {
  clearCourseReminderNotification,
  scheduleCourseReengagementReminder,
} from '@/features/notifications/services/notificationService';
import { OfflineBanner } from '@/shared/components/ui/OfflineBanner';
import { CustomDialog } from '@/shared/components/ui/CustomDialog';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Pencil, TriangleAlert, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { analytics } from '@/core/services/analyticsService';
import { clarityService } from '@/core/services/clarityService';
import * as Sentry from '@sentry/react-native';
import { trackUserAction } from '@/core/services/sentryPerformance';
import { useScreenTracking } from '@/shared/hooks/useScreenTracking';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';

export default function CourseContentScreen() {
  const { C, isDark } = useTheme();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getCourseById, completeCourse, updateQuizScore, addNote } = useCourseStore();
  const { user, token } = useAuthStore();
  const webViewRef = useRef<WebView>(null);

  const [progress, setProgress] = useState(0);
  const [webViewError, setWebViewError] = useState<string | null>(null);
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const shouldScheduleReminderRef = useRef(true);

  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
    type?: 'default' | 'destructive' | 'success';
  }>({ visible: false, title: '', message: '' });

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
    return generateCourseHtml(course, isDark);
  }, [course, isDark]);

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
        trackUserAction('content_completed', { courseId: id as string });
        analytics.logEvent('course_content_completed', { courseId: id as string, title: course?.title });
        completeCourse(id as string);
        void clearCourseReminderNotification();
        setDialogConfig({
          visible: true,
          title: 'Course Completed',
          message: 'Congratulations! Great progress. You have unlocked a new achievement.',
          confirmText: 'Awesome',
          type: 'success',
          onConfirm: () => router.back()
        });
      } else if (data.type === 'QUIZ_SCORE') {
        trackUserAction('quiz_scored', { courseId: id as string, score: data.score });
        clarityService.logEvent('quiz_completed', { courseId: String(id), score: data.score });
        updateQuizScore(id as string, data.score);
      }
    } catch {
      setWebViewError('Could not process content interaction. Please reload and try again.');
    }
  };

  const saveNote = () => {
    if (!noteText.trim()) return;
    addNote(id as string, noteText.trim());
    trackUserAction('note_saved', { courseId: id as string });
    analytics.logEvent('course_content_note_saved', { courseId: id as string, noteLength: noteText.trim().length });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNoteText('');
    setIsNoteModalVisible(false);
    
    setDialogConfig({
      visible: true,
      title: 'Note Saved',
      message: 'Your learning note has been saved to this course and is available in your profile.',
      confirmText: 'Perfect',
      type: 'success'
    });
  };

  useScreenTracking(course ? `CourseContent_${course.id}` : 'CourseContent');

  useEffect(() => {
    if (course) {
      clarityService.logEvent('course_content_opened', { courseId: course.id, title: course.title });
    }
  }, [course?.id]);

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
      <SafeAreaView className="flex-1" style={{ backgroundColor: C.surface }}>
        <OfflineBanner />
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <TouchableOpacity className="w-10 h-10 items-center justify-center" onPress={() => { analytics.logEvent('course_content_back', { courseId: id as string }); router.back(); }}>
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
              analytics.logEvent('course_content_error_retry', { courseId: id as string });
              setWebViewError(null);
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.surface }}>
      <CustomDialog
        visible={dialogConfig.visible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText={dialogConfig.confirmText}
        type={dialogConfig.type}
        onConfirm={() => {
          dialogConfig.onConfirm?.();
          setDialogConfig(prev => ({ ...prev, visible: false }));
        }}
        onCancel={() => setDialogConfig(prev => ({ ...prev, visible: false }))}
      />
      <OfflineBanner />
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <TouchableOpacity className="w-10 h-10 items-center justify-center" onPress={() => { analytics.logEvent('course_content_back', { courseId: id as string }); router.back(); }}>
          <ArrowLeft size={24} color={C.text} />
        </TouchableOpacity>
        <Text className="text-base font-bold text-text flex-1 text-center" numberOfLines={1}>{course.title}</Text>
        <View className="w-10" />
      </View>

      <View className="h-1 bg-border w-full">
        <View className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
      </View>

      <View className="flex-1">
      {/* web view  */}
        <WebView
          ref={webViewRef}
          source={{ html: htmlTemplate, baseUrl: 'https://houseofedtech.com' }}
          className="flex-1"
          injectedJavaScriptBeforeContentLoaded={injectedJS}
          onLoadStart={() => {
            setWebViewError(null);
          }}
          onLoadEnd={() => {
            webViewRef.current?.postMessage(
              JSON.stringify({
                type: 'NATIVE_HEADERS',
                headers: nativeHeaders,
                user: user,
              })
            );
          }}
          onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
          originWhitelist={['*']}
          onShouldStartLoadWithRequest={(request) => {
            return request.url.startsWith('https://mini-lms.local');
          }}
          onMessage={handleMessage}
          onError={(e) => {
            Sentry.captureException(new Error(`WebView load failed: ${e.nativeEvent.description}`), {
              tags: { feature: 'course_content', courseId: String(id) },
            });
            clarityService.logEvent('course_content_opened', { courseId: String(id), error: 'webview_load_failed' });
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

      {/* Note FAB */}
      <TouchableOpacity
        className="absolute bottom-10 right-6 w-16 h-16 bg-primary rounded-full items-center justify-center shadow-xl z-50 border-4 border-white"
        activeOpacity={0.9}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          analytics.logEvent('course_content_note_opened', { courseId: id as string });
          setIsNoteModalVisible(true);
        }}
      >
        <Pencil color="white" size={28} />
      </TouchableOpacity>

      {/* Note Modal */}
      <Modal
        visible={isNoteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsNoteModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 bg-black/40 justify-end">
            <View className="rounded-t-[40px] p-6 h-[70%]" style={{ backgroundColor: C.surface }}>
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-extrabold text-text dark:text-dark-text">Quick Note</Text>
                <TouchableOpacity onPress={() => { analytics.logEvent('course_content_note_discarded', { courseId: id as string }); setIsNoteModalVisible(false); }} className="p-2 rounded-full" style={{ backgroundColor: C.surfaceElevated }}>
                  <X size={20} color={C.text} />
                </TouchableOpacity>
              </View>
              
              <View className="flex-1 rounded-3xl p-4 border border-border/50 dark:border-dark-border" style={{ backgroundColor: C.surfaceElevated }}>
                <TextInput
                  className="text-base text-text dark:text-dark-text leading-6"
                  placeholder="Type your notes about this lesson here..."
                  placeholderTextColor={C.textMuted}
                  multiline
                  autoFocus
                  textAlignVertical="top"
                  value={noteText}
                  onChangeText={setNoteText}
                />
              </View>

              <TouchableOpacity
                className="mt-6 bg-primary py-4 rounded-2xl items-center justify-center shadow-lg"
                onPress={saveNote}
              >
                <Text className="text-white text-lg font-bold">Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
