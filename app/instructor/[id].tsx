import { useTheme } from '@/core/theme/useTheme';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { CourseCard } from '@/features/courses/components/CourseCard';
import { Course } from '@/shared/types';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft, Mail, MapPin, Award } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function InstructorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { C } = useTheme();

  const { courses, bookmarks, toggleBookmark } = useCourseStore();

  const instructorCourses = useMemo(() => {
    return courses.filter((c) => c.instructor.id === id);
  }, [courses, id]);

  const instructor = instructorCourses[0]?.instructor;

  if (!instructor) {
    return (
      <View className="flex-1 items-center justify-center bg-background dark:bg-dark-bg">
        <Text className="text-text dark:text-dark-text">Instructor not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 p-2">
          <Text className="text-primary font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCoursePress = (course: Course) => {
    router.push(`/course/${course.id}`);
  };

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View
        className="flex-row items-center px-4 pb-4 border-b z-10"
        style={{
          paddingTop: insets.top || 16,
          backgroundColor: C.surface,
          borderBottomColor: C.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full"
          style={{ backgroundColor: C.surfaceElevated }}
        >
          <ArrowLeft size={22} color={C.text} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-text dark:text-dark-text tracking-tight ml-4">
          Instructor Profile
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Info */}
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          className="items-center px-4 pt-8 pb-6"
        >
          <View className="relative shadow-lg mb-4">
            <Image
              source={instructor.avatar || `https://i.pravatar.cc/400?img=12`}
              className="w-32 h-32 rounded-full border-4"
              style={{ borderColor: C.surfaceElevated }}
              contentFit="cover"
            />
          </View>
          
          <Text className="text-2xl font-black text-text dark:text-dark-text tracking-tight text-center">
            {instructor.name}
          </Text>
          <Text className="text-primary font-bold mt-1 tracking-wide uppercase text-sm">
            {instructor.role || 'Expert Instructor'}
          </Text>

          <View className="flex-row items-center mt-4 gap-4">
            {instructor.location && (
              <View className="flex-row items-center">
                <MapPin size={14} color={C.textMuted} className="mr-1" />
                <Text className="text-text-muted dark:text-dark-text-muted text-sm font-medium">
                  {instructor.location}
                </Text>
              </View>
            )}
            <View className="flex-row items-center">
              <Award size={14} color={C.textMuted} className="mr-1" />
              <Text className="text-text-muted dark:text-dark-text-muted text-sm font-medium">
                {instructorCourses.length} {instructorCourses.length === 1 ? 'Course' : 'Courses'}
              </Text>
            </View>
          </View>
          
          {instructor.email && (
            <TouchableOpacity className="flex-row items-center mt-6 bg-primary px-6 py-3 rounded-full shadow-sm">
              <Mail size={16} color="white" className="mr-2" />
              <Text className="text-white font-bold tracking-wide">Contact Instructor</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Courses List */}
        <View className="px-4 mt-6">
          <Text className="text-xl font-bold text-text dark:text-dark-text mb-4">
            Courses by {instructor.name.split(' ')[0]}
          </Text>
          
          <View className="gap-5">
            {instructorCourses.map((course, index) => (
              <Animated.View key={course.id} entering={FadeInDown.delay(index * 100).springify()}>
                <CourseCard
                  course={course}
                  onPress={handleCoursePress}
                  onToggleBookmark={toggleBookmark}
                  isBookmarked={bookmarks.includes(course.id)}
                />
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
