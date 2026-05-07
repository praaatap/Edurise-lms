import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSchoolStore } from '@/features/school/store/schoolStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useTheme } from '@/core/theme/useTheme';
import { School, Course } from '@/shared/types';
import { Colors } from '@/core/theme/colors';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Share2,
  Star,
  Users,
  BookOpen,
  CheckCircle2,
  Globe,
  Mail,
  Search,
} from 'lucide-react-native';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { coursesApi } from '@/features/courses/api/coursesApi';

export default function SchoolProfile() {
  const { schoolSlug } = useLocalSearchParams<{ schoolSlug: string }>();
  const router = useRouter();
  const { fetchSchoolBySlug, joinSchool } = useSchoolStore();
  const { user, updateProfile } = useAuthStore();
  const { C, isDark } = useTheme();

  const [school, setSchool] = useState<School | null>(null);
  const [schoolCourses, setSchoolCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [search, setSearch] = useState('');

  const isAlreadyMember = !!user?.schoolId && school ? user.schoolId === school.id : false;

  useEffect(() => {
    const load = async () => {
      if (!schoolSlug) return;
      const data = await fetchSchoolBySlug(schoolSlug);
      setSchool(data);
      if (data) {
        try {
          const courses = await coursesApi.fetchCourses({ schoolId: data.id });
          setSchoolCourses(courses);
        } catch {
          setSchoolCourses([]);
        }
      }
      setLoading(false);
    };
    load();
  }, [schoolSlug]);

  const handleJoin = async () => {
    if (!school?.joinCode) {
      Alert.alert('Join Code Missing', 'This school does not have a public join code.');
      return;
    }
    setIsJoining(true);
    try {
      await joinSchool(school.joinCode);
      updateProfile({ schoolId: school.id, schoolName: school.name, schoolSlug: school.slug });
      Alert.alert('Joined! 🎉', `You are now a member of ${school.name}.`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error?.message ?? 'Failed to join school.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${school?.name} on Edurise!`,
        url: `https://edurise.com/schools/${schoolSlug}`,
      });
    } catch (error) {}
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: C.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!school) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: C.background }]}>
        <Text style={[styles.errorText, { color: C.text }]}>School not found</Text>
        <Button title="Go Back" onPress={() => router.back()} className="mt-4" />
      </View>
    );
  }

  const filteredCourses = search.trim()
    ? schoolCourses.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.category.toLowerCase().includes(search.toLowerCase())
      )
    : schoolCourses;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: C.background, borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <ArrowLeft size={24} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
            <Share2 size={24} color={C.text} />
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={[styles.cover, { backgroundColor: isDark ? '#1A2332' : '#EFF6FF' }]}>
            {school.logo ? (
              <Image source={{ uri: school.logo }} style={styles.logo} />
            ) : (
              <View style={[styles.logoPlaceholder, { backgroundColor: Colors.primary + '20' }]}>
                <Text style={[styles.logoInitial, { color: Colors.primary }]}>
                  {school.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: C.text }]}>{school.name}</Text>
              {school.isVerified && <CheckCircle2 size={20} color={Colors.primary} fill={Colors.primary + '20'} />}
            </View>
            <Text style={[styles.category, { color: Colors.primary }]}>{school.category}</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Users size={16} color={C.textMuted} />
                <Text style={[styles.statText, { color: C.textMuted }]}>{school.studentCount} Students</Text>
              </View>
              <View style={styles.stat}>
                <Star size={16} color="#F59E0B" fill="#F59E0B" />
                <Text style={[styles.statText, { color: C.textMuted }]}>{school.rating} Rating</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <Button
                title={isAlreadyMember ? 'Joined ✓' : 'Join School'}
                onPress={isAlreadyMember ? () => {} : handleJoin}
                isLoading={isJoining}
                disabled={isAlreadyMember}
                style={{ flex: 1 }}
                className="rounded-xl h-12"
              />
              <TouchableOpacity style={[styles.contactBtn, { borderColor: C.border }]}>
                <Mail size={20} color={C.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>About the School</Text>
          <Text style={[styles.description, { color: C.textMuted }]}>
            {school.description || 'No description provided.'}
          </Text>
          
          <View style={styles.links}>
            <TouchableOpacity style={styles.link}>
              <Globe size={16} color={Colors.primary} />
              <Text style={{ color: Colors.primary, fontWeight: '600' }}>Visit Website</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Courses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Courses ({filteredCourses.length})</Text>
          </View>
          <View style={{ marginBottom: 16 }}>
            <Input
              placeholder="Search courses..."
              value={search}
              onChangeText={setSearch}
              leftIcon={<Search size={18} color={C.textMuted} />}
            />
          </View>

          {filteredCourses.length === 0 && (
            <Text style={{ color: C.textMuted, textAlign: 'center', paddingVertical: 20 }}>
              No courses available yet.
            </Text>
          )}

          {filteredCourses.map((course) => (
            <TouchableOpacity 
              key={course.id} 
              style={[styles.courseItem, { backgroundColor: C.surface, borderColor: C.border }]}
              onPress={() => router.push(`/course/${course.id}`)}
            >
              <Image source={{ uri: course.thumbnail }} style={styles.courseThumb} />
              <View style={styles.courseDetails}>
                <Text style={[styles.courseTitle, { color: C.text }]} numberOfLines={2}>{course.title}</Text>
                <View style={styles.courseMeta}>
                  <View style={styles.metaItem}>
                    <BookOpen size={12} color={C.textMuted} />
                    <Text style={[styles.metaText, { color: C.textMuted }]}>{course.lessonsCount} lessons</Text>
                  </View>
                  <Text style={[styles.coursePrice, { color: Colors.primary }]}>
                    {course.price === 0 ? 'Free' : `$${course.price}`}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerBtn: {
    padding: 8,
  },
  hero: {
    marginBottom: 20,
  },
  cover: {
    height: 180,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: 'white',
    backgroundColor: 'white',
    position: 'absolute',
    bottom: -50,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: -50,
  },
  logoInitial: {
    fontSize: 40,
    fontWeight: '800',
  },
  info: {
    marginTop: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  category: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  contactBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  links: {
    marginTop: 16,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courseItem: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  courseThumb: {
    width: 100,
    height: '100%',
  },
  courseDetails: {
    flex: 1,
    padding: 12,
    gap: 8,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  courseMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  coursePrice: {
    fontSize: 14,
    fontWeight: '800',
  },
});
