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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { coursesApi } from '@/features/courses/api/coursesApi';
import { useProgressStore } from '@/features/progress/store/progressStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useTheme } from '@/core/theme/useTheme';
import { Colors } from '@/core/theme/colors';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  Lock,
  ChevronRight,
  BookOpen,
  Clock,
  Award,
  FileText,
  HelpCircle,
  Bot,
} from 'lucide-react-native';
import { Button } from '@/shared/components/ui/Button';
import { AIStudyBuddy } from '@/features/ai/components/AIStudyBuddy';
import { Lesson } from '@/shared/types';

export default function CoursePlayer() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { C } = useTheme();
  const { startCourse, getOverallProgress, isLessonCompleted } = useProgressStore();

  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollmentProgress, setEnrollmentProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAiBuddyVisible, setIsAiBuddyVisible] = useState(false);

  const load = useCallback(async () => {
    if (!courseId) return;
    try {
      const [courseData, enrollments] = await Promise.all([
        coursesApi.fetchCourseById(courseId),
        coursesApi.fetchMyEnrollments(),
      ]);

      if (!courseData) {
        Alert.alert('Error', 'Course not found.');
        router.back();
        return;
      }

      setCourse(courseData);
      const courseLessons = (courseData.lessons ?? []) as Lesson[];
      setLessons(courseLessons);

      const enrollment = enrollments.find((e: any) => e.courseId === courseId);
      if (enrollment) {
        setEnrollmentProgress(enrollment.progressPercent ?? 0);
      }

      if (user) {
        startCourse(courseId, user._id);
      }
    } catch {
      Alert.alert('Error', 'Failed to load course.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [courseId, user]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!course) return null;

  const localProgress = getOverallProgress(courseId, lessons.length);
  const displayProgress = Math.max(localProgress, enrollmentProgress);

  // Find the first incomplete lesson as "Continue" target
  const nextLesson = lessons.find(l => !isLessonCompleted(courseId, l._id)) ?? lessons[0];

  const lessonTypeIcon = (type: string) => {
    if (type === 'video') return <Play size={14} color={Colors.primary} />;
    if (type === 'quiz') return <HelpCircle size={14} color="#F59E0B" />;
    return <FileText size={14} color="#10B981" />;
  };

  const totalMinutes = lessons.reduce((sum, l) => sum + (l.duration ?? 0), 0);
  const durationLabel = totalMinutes >= 60
    ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
    : `${totalMinutes}m`;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Hero / thumbnail */}
      <View style={styles.playerContainer}>
        <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} />
        <View style={styles.playerOverlay}>
          {nextLesson && (
            <TouchableOpacity
              style={styles.playBtn}
              onPress={() => router.push(`/learn/${courseId}/lesson/${nextLesson._id}` as any)}
            >
              <Play size={32} color="white" fill="white" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoSection}>
          <Text style={[styles.title, { color: C.text }]}>{course.title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <BookOpen size={14} color={C.textMuted} />
              <Text style={[styles.metaText, { color: C.textMuted }]}>{lessons.length} lessons</Text>
            </View>
            {totalMinutes > 0 && (
              <View style={styles.metaItem}>
                <Clock size={14} color={C.textMuted} />
                <Text style={[styles.metaText, { color: C.textMuted }]}>{durationLabel}</Text>
              </View>
            )}
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, { color: C.text }]}>Your Progress</Text>
              <Text style={[styles.progressPercent, { color: Colors.primary }]}>{displayProgress}%</Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: C.border }]}>
              <View style={[styles.progressBarFill, { width: `${displayProgress}%`, backgroundColor: Colors.primary }]} />
            </View>
          </View>
        </View>

        <View style={styles.lessonsSection}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Course Content</Text>
          {lessons.length === 0 ? (
            <Text style={{ color: C.textMuted, textAlign: 'center', paddingVertical: 20 }}>
              No lessons available yet.
            </Text>
          ) : (
            lessons.map((lesson, index) => {
              const completed = isLessonCompleted(courseId, lesson._id);
              return (
                <TouchableOpacity
                  key={lesson._id}
                  style={[styles.lessonItem, { borderBottomColor: C.border }]}
                  onPress={() => router.push(`/learn/${courseId}/lesson/${lesson._id}` as any)}
                >
                  <View style={styles.lessonLeft}>
                    <View style={[styles.lessonIndex, {
                      backgroundColor: completed ? Colors.primary + '15' : C.surface,
                    }]}>
                      {completed
                        ? <CheckCircle2 size={16} color={Colors.primary} />
                        : <Text style={[styles.indexText, { color: C.textMuted }]}>{index + 1}</Text>
                      }
                    </View>
                    <View style={styles.lessonInfo}>
                      <Text style={[styles.lessonTitle, { color: C.text }]}>{lesson.title}</Text>
                      <View style={styles.lessonMetaRow}>
                        {lessonTypeIcon(lesson.type)}
                        <Text style={[styles.lessonMeta, { color: C.textMuted }]}>
                          {lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)}
                          {lesson.duration ? ` · ${lesson.duration}m` : ''}
                        </Text>
                        {lesson.isPreview && (
                          <View style={[styles.previewBadge, { backgroundColor: Colors.primary + '15' }]}>
                            <Text style={{ color: Colors.primary, fontSize: 9, fontWeight: '800' }}>FREE</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                  {completed
                    ? <CheckCircle2 size={18} color={Colors.primary} />
                    : <Play size={16} color={Colors.primary} />
                  }
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {displayProgress === 100 && (
          <View style={styles.certificateSection}>
            <View style={[styles.certCard, { backgroundColor: Colors.primary + '10', borderColor: Colors.primary + '30' }]}>
              <Award size={32} color={Colors.primary} />
              <View style={styles.certText}>
                <Text style={[styles.certTitle, { color: C.text }]}>Certificate Earned! 🎉</Text>
                <Text style={[styles.certSubtitle, { color: C.textMuted }]}>
                  You have completed this course. Check Achievements to view your certificate.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {nextLesson && (
        <View style={[styles.footer, { backgroundColor: C.surface, borderTopColor: C.border }]}>
          <Button
            title={displayProgress === 0 ? 'Start Learning' : 'Continue Learning'}
            onPress={() => router.push(`/learn/${courseId}/lesson/${nextLesson._id}` as any)}
            className="h-14 rounded-2xl"
            rightIcon={<ChevronRight size={20} color="white" />}
          />
        </View>
      )}

      <TouchableOpacity
        style={[styles.aiFab, { backgroundColor: Colors.primary }]}
        onPress={() => setIsAiBuddyVisible(true)}
      >
        <Bot size={24} color="white" />
      </TouchableOpacity>

      <AIStudyBuddy
        isVisible={isAiBuddyVisible}
        onClose={() => setIsAiBuddyVisible(false)}
        context={{
          courseTitle: course.title,
          lessonTitle: nextLesson?.title,
          lessonContent: '',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  playerContainer: { height: 240, backgroundColor: 'black', position: 'relative' },
  thumbnail: { width: '100%', height: '100%', opacity: 0.6 },
  playerOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  playBtn: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  backBtn: { position: 'absolute', top: 50, left: 20, padding: 8 },
  content: { paddingBottom: 120 },
  infoSection: { padding: 24 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 14, fontWeight: '500' },
  progressContainer: { marginTop: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressTitle: { fontSize: 14, fontWeight: '700' },
  progressPercent: { fontSize: 14, fontWeight: '800' },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  lessonsSection: { padding: 24, paddingTop: 0 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  lessonItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1,
  },
  lessonLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 },
  lessonIndex: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  indexText: { fontSize: 12, fontWeight: '700' },
  lessonInfo: { flex: 1 },
  lessonTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  lessonMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lessonMeta: { fontSize: 12 },
  previewBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  certificateSection: { padding: 24, paddingTop: 0 },
  certCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, borderWidth: 1, gap: 16 },
  certText: { flex: 1 },
  certTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  certSubtitle: { fontSize: 12, lineHeight: 18 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, borderTopWidth: 1,
  },
  aiFab: {
    position: 'absolute', bottom: 100, right: 20,
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    elevation: 5, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, zIndex: 999,
  },
});
