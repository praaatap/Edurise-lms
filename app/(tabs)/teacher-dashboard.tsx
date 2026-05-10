import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useSchoolStore } from '@/features/school/store/schoolStore';
import { useTheme } from '@/core/theme/useTheme';
import { SchoolHeader } from '@/features/school/components/SchoolHeader';
import { StatCard } from '@/features/admin/components/StatCard';
import { BookOpen, Users, Star, TrendingUp, ArrowRight } from 'lucide-react-native';
import { Colors } from '@/core/theme/colors';
import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { apiClient } from '@/core/api/client';
import { coursesApi } from '@/features/courses/api/coursesApi';
import { Course } from '@/shared/types';
import { Image } from 'expo-image';

interface TeacherStats {
  totalEnrollments: number;
  totalRevenue: number;
  coursesCount: number;
  avgRating: number;
}

export default function TeacherDashboard() {
  const { user } = useAuthStore();
  const { activeSchool } = useSchoolStore();
  const { C } = useTheme();
  const router = useRouter();

  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const [statsRes, coursesRes] = await Promise.allSettled([
        apiClient.get('/analytics/instructor'),
        coursesApi.fetchMyCourses(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.data.success) {
        setStats(statsRes.value.data.data);
      }
      if (coursesRes.status === 'fulfilled') {
        setRecentCourses(coursesRes.value.slice(0, 3));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {activeSchool && <SchoolHeader school={activeSchool} />}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor={Colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: C.text }]}>
            Hello, {user?.username?.split(' ')[0] ?? 'Instructor'}! 👋
          </Text>
          <Text style={[styles.subtitle, { color: C.textMuted }]}>Manage your students and courses</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.row}>
            <StatCard
              title="My Courses"
              value={stats?.coursesCount ?? '—'}
              icon={BookOpen}
              iconColor={Colors.primary}
            />
            <StatCard
              title="Enrollments"
              value={stats?.totalEnrollments ?? '—'}
              icon={Users}
              iconColor="#3B82F6"
            />
          </View>
          <View style={styles.row}>
            <StatCard
              title="Avg Rating"
              value={stats ? stats.avgRating.toFixed(1) : '—'}
              icon={Star}
              iconColor="#F59E0B"
            />
            <StatCard
              title="Revenue"
              value={stats ? `$${stats.totalRevenue.toFixed(0)}` : '—'}
              icon={TrendingUp}
              iconColor="#10B981"
            />
          </View>
        </View>

        {/* AI Insights — driven by real stats */}
        {stats && (
          <View style={styles.aiSection}>
            <View style={styles.aiHeader}>
              <Sparkles size={18} color={Colors.primary} />
              <Text style={[styles.sectionTitle, { color: C.text, marginBottom: 0 }]}>AI Insights</Text>
            </View>
            <View style={[styles.insightCard, { backgroundColor: Colors.primary + '10', borderColor: Colors.primary + '30' }]}>
              <Text style={[styles.insightTitle, { color: Colors.primary }]}>📊 Performance Summary</Text>
              <Text style={[styles.insightText, { color: C.text }]}>
                {stats.coursesCount === 0
                  ? 'Create your first course to start tracking performance metrics.'
                  : `You have ${stats.coursesCount} course${stats.coursesCount !== 1 ? 's' : ''} with ${stats.totalEnrollments} total enrollments and an average rating of ${stats.avgRating.toFixed(1)}/5.`}
              </Text>
            </View>
            {stats.avgRating > 0 && stats.avgRating < 4 && (
              <View style={[styles.insightCard, { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }]}>
                <Text style={[styles.insightTitle, { color: '#92400E' }]}>💡 Tip</Text>
                <Text style={[styles.insightText, { color: '#78350F' }]}>
                  Your average rating is {stats.avgRating.toFixed(1)}. Adding more practice exercises could help boost student satisfaction.
                </Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
          onPress={() => router.push('/(tabs)/teacher-create' as any)}
        >
          <Text style={styles.actionBtnText}>+ Create New Course</Text>
          <ArrowRight size={20} color="white" />
        </TouchableOpacity>

        <View style={[styles.coursesSection, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Recent Courses</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/teacher-courses' as any)}>
              <Text style={{ color: Colors.primary, fontWeight: '600' }}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentCourses.length === 0 ? (
            <View style={styles.emptyCourses}>
              <Text style={{ color: C.textMuted }}>No courses yet — create your first one!</Text>
            </View>
          ) : (
            recentCourses.map((course) => (
              <View key={course.id} style={[styles.courseRow, { borderBottomColor: C.border }]}>
                <Image source={{ uri: course.thumbnail }} style={styles.courseThumbnail} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.courseTitle, { color: C.text }]} numberOfLines={1}>{course.title}</Text>
                  <Text style={[styles.courseMeta, { color: C.textMuted }]}>
                    {course.enrolledCount ?? 0} students · {course.rating.toFixed(1)} ★
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120 },
  header: { marginBottom: 20 },
  greeting: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 4 },
  statsGrid: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  aiSection: { marginTop: 24 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  insightCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  insightTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  insightText: { fontSize: 14, lineHeight: 20 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, borderRadius: 16, marginTop: 24,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  actionBtnText: { color: 'white', fontSize: 18, fontWeight: '700' },
  coursesSection: { marginTop: 24, padding: 16, borderRadius: 16, borderWidth: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  emptyCourses: { height: 80, justifyContent: 'center', alignItems: 'center' },
  courseRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  courseThumbnail: { width: 56, height: 40, borderRadius: 8 },
  courseTitle: { fontSize: 14, fontWeight: '700' },
  courseMeta: { fontSize: 12, marginTop: 2 },
});
