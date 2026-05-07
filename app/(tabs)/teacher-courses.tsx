import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTheme } from '@/core/theme/useTheme';
import { BookOpen, Plus, Trash2, Star, Users, LayoutGrid } from 'lucide-react-native';
import { Colors } from '@/core/theme/colors';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { coursesApi } from '@/features/courses/api/coursesApi';
import { Course } from '@/shared/types';
import { Button } from '@/shared/components/ui/Button';

export default function TeacherCourses() {
  const { C } = useTheme();
  const router = useRouter();
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const courses = await coursesApi.fetchMyCourses();
      setMyCourses(courses);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = (courseId: string, title: string) => {
    Alert.alert('Delete Course', `Delete "${title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await coursesApi.deleteCourse(courseId);
            setMyCourses(prev => prev.filter(c => c.id !== courseId));
          } catch {
            Alert.alert('Error', 'Could not delete course.');
          }
        },
      },
    ]);
  };

  const renderCourse = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.courseCard, { backgroundColor: C.surface, borderColor: C.border }]}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      <View style={styles.courseInfo}>
        <View style={styles.topRow}>
          <Text style={[styles.category, { color: Colors.primary }]}>{item.category}</Text>
          <TouchableOpacity onPress={() => handleDelete(item.id, item.title)}>
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
        <Text style={[styles.courseTitle, { color: C.text }]} numberOfLines={2}>{item.title}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Users size={14} color={C.textMuted} />
            <Text style={[styles.statText, { color: C.textMuted }]}>{item.enrolledCount ?? 0}</Text>
          </View>
          <View style={styles.stat}>
            <Star size={14} color="#F59E0B" fill="#F59E0B" />
            <Text style={[styles.statText, { color: C.textMuted }]}>{item.rating.toFixed(1)}</Text>
          </View>
          <View style={styles.stat}>
            <BookOpen size={14} color={C.textMuted} />
            <Text style={[styles.statText, { color: C.textMuted }]}>{item.lessonsCount ?? 0} lessons</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.price, { color: C.text }]}>
            {item.price === 0 ? 'Free' : `$${item.price}`}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: Colors.primary + '15' }]}>
            <Text style={[styles.statusText, { color: Colors.primary }]}>Published</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>My Courses 📚</Text>
        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: Colors.primary }]}
          onPress={() => router.push('/(tabs)/teacher-create' as any)}
        >
          <Plus size={20} color="white" />
          <Text style={styles.addBtnText}>New Course</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={myCourses}
        renderItem={renderCourse}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={load} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <LayoutGrid size={64} color={C.border} />
            <Text style={[styles.emptyText, { color: C.textMuted }]}>
              You haven't created any courses yet
            </Text>
            <Button 
              title="Start Creating" 
              onPress={() => router.push('/(tabs)/teacher-create' as any)}
              className="mt-4 px-8"
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  addBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  courseCard: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 120,
    height: '100%',
  },
  courseInfo: {
    flex: 1,
    padding: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  category: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
