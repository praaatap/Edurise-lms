import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { coursesApi } from '@/features/courses/api/coursesApi';
import { useProgressStore } from '@/features/progress/store/progressStore';
import { useTheme } from '@/core/theme/useTheme';
import { Colors } from '@/core/theme/colors';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  FileText,
  HelpCircle,
} from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { Button } from '@/shared/components/ui/Button';
import { Lesson } from '@/shared/types';

const { width } = Dimensions.get('window');

export default function LessonView() {
  const { courseId, lessonId } = useLocalSearchParams<{ courseId: string; lessonId: string }>();
  const router = useRouter();
  const { C } = useTheme();
  const { markLessonComplete, isLessonCompleted, startCourse } = useProgressStore();

  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!courseId || !lessonId) return;
    try {
      const courseData = await coursesApi.fetchCourseById(courseId);
      if (!courseData) { router.back(); return; }
      setCourse(courseData);
      const allLessons = (courseData.lessons ?? []) as Lesson[];
      setLessons(allLessons);
      const found = allLessons.find(l => l._id === lessonId);
      if (!found) { Alert.alert('Lesson not found'); router.back(); return; }
      setLesson(found);
    } catch {
      router.back();
    } finally {
      setLoading(false);
    }
  }, [courseId, lessonId]);

  useEffect(() => { load(); }, [load]);

  const completed = lesson ? isLessonCompleted(courseId, lesson._id) : false;

  const handleMarkComplete = useCallback(() => {
    if (!lesson || !courseId) return;
    markLessonComplete(courseId, lesson._id);
    // Auto-navigate to next lesson
    const idx = lessons.findIndex(l => l._id === lesson._id);
    const next = lessons[idx + 1];
    if (next) {
      router.replace(`/learn/${courseId}/lesson/${next._id}` as any);
    } else {
      Alert.alert('Course Complete! 🎉', 'You have finished all lessons.', [
        { text: 'Back to Course', onPress: () => router.push(`/learn/${courseId}` as any) },
      ]);
    }
  }, [lesson, courseId, lessons, markLessonComplete, router]);

  const handleNav = (direction: 'prev' | 'next') => {
    if (!lesson) return;
    const idx = lessons.findIndex(l => l._id === lesson._id);
    const target = direction === 'prev' ? lessons[idx - 1] : lessons[idx + 1];
    if (target) {
      router.replace(`/learn/${courseId}/lesson/${target._id}` as any);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!lesson) return null;

  const lessonIdx = lessons.findIndex(l => l._id === lesson._id);
  const hasPrev = lessonIdx > 0;
  const hasNext = lessonIdx < lessons.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.push(`/learn/${courseId}` as any)} style={styles.headerBtn}>
          <ArrowLeft size={24} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.courseLabel, { color: C.textMuted }]} numberOfLines={1}>
            {course?.title ?? ''}
          </Text>
          <Text style={[styles.lessonLabel, { color: C.text }]} numberOfLines={1}>
            {lessonIdx + 1}. {lesson.title}
          </Text>
        </View>
        <View style={styles.headerBtn}>
          {completed && <CheckCircle size={22} color={Colors.primary} />}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Video */}
        {lesson.type === 'video' && lesson.videoUrl ? (
          <View style={styles.videoWrapper}>
            <WebView
              style={styles.webview}
              source={{ uri: lesson.videoUrl }}
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
            />
          </View>
        ) : null}

        {/* Text / Quiz type — article header */}
        {lesson.type !== 'video' && (
          <View style={[styles.articleHeader, { backgroundColor: C.surfaceElevated }]}>
            {lesson.type === 'quiz'
              ? <HelpCircle size={36} color="#F59E0B" />
              : <FileText size={36} color={Colors.primary} />
            }
            <Text style={[styles.articleTitle, { color: C.text }]}>{lesson.title}</Text>
          </View>
        )}

        {/* Content */}
        {lesson.content ? (
          <View style={styles.contentSection}>
            <Text style={[styles.contentText, { color: C.text }]}>{lesson.content}</Text>
          </View>
        ) : lesson.type !== 'video' ? (
          <View style={styles.contentSection}>
            <Text style={[styles.emptyContent, { color: C.textMuted }]}>
              {lesson.type === 'quiz'
                ? 'Quiz content will be displayed here.'
                : 'Lesson content coming soon.'}
            </Text>
          </View>
        ) : null}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: C.surface, borderTopColor: C.border }]}>
        <TouchableOpacity
          style={[styles.navBtn, { borderColor: hasPrev ? C.border : C.border + '40' }]}
          onPress={() => handleNav('prev')}
          disabled={!hasPrev}
        >
          <ChevronLeft size={20} color={hasPrev ? C.text : C.textMuted} />
          <Text style={[styles.navBtnText, { color: hasPrev ? C.text : C.textMuted }]}>Prev</Text>
        </TouchableOpacity>

        <Button
          title={completed ? '✓ Done' : 'Mark Done'}
          onPress={handleMarkComplete}
          variant={completed ? 'outline' : 'primary'}
          style={{ flex: 1, marginHorizontal: 10 }}
          leftIcon={completed ? <CheckCircle size={16} color={Colors.primary} /> : undefined}
        />

        <TouchableOpacity
          style={[styles.navBtn, { borderColor: hasNext ? C.border : C.border + '40' }]}
          onPress={() => handleNav('next')}
          disabled={!hasNext}
        >
          <Text style={[styles.navBtnText, { color: hasNext ? C.text : C.textMuted }]}>Next</Text>
          <ChevronRight size={20} color={hasNext ? C.text : C.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingBottom: 12, borderBottomWidth: 1,
  },
  headerBtn: { padding: 8, width: 40 },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  courseLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  lessonLabel: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  scrollContent: { paddingBottom: 20 },
  videoWrapper: { width, height: width * 0.5625, backgroundColor: 'black' },
  webview: { flex: 1 },
  articleHeader: { padding: 40, alignItems: 'center', gap: 12 },
  articleTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  contentSection: { padding: 24 },
  contentText: { fontSize: 16, lineHeight: 26 },
  emptyContent: { fontSize: 15, textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: Platform.OS === 'ios' ? 40 : 16,
    borderTopWidth: 1, flexDirection: 'row', alignItems: 'center',
  },
  navBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, gap: 2,
  },
  navBtnText: { fontSize: 13, fontWeight: '600' },
});
