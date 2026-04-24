import { Colors } from '@/core/theme/colors';
import { useAuthStore } from '@/features/auth/store/authStore';
import { CourseCard } from '@/features/courses/components/CourseCard';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SkeletonCard } from '@/shared/components/ui/SkeletonCard';
import { Course } from '@/shared/types';
import { LegendList } from '@legendapp/list';
import { Href, useRouter } from 'expo-router';
import { BookOpen, Compass, Flame } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, Text, TouchableOpacity, View  , Image} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function useHomeLogic() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const {
    courses,
    recommendedCourses,
    isLoading,
    fetchCourses,
    refreshCourses,
    getAIRecommendations,
    bookmarks,
    toggleBookmark,
    enrolledCourses,
    completedCourses,
    streak,
    updateStreak,
  } = useCourseStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const init = async () => {
      await fetchCourses();
      updateStreak();
      getAIRecommendations(['Technology', 'Design', 'Development']);
    };
    init();
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshCourses();
    updateStreak();
    getAIRecommendations(['Technology', 'Design', 'Development']);
    setIsRefreshing(false);
  }, [refreshCourses, getAIRecommendations]);

  const handleCoursePress = useCallback((course: Course) => {
    router.push(`/course/${course.id}` as Href);
  }, [router]);

  // Enrolled but not completed = "In Progress"
  const inProgressCourses = useMemo(() =>
    courses.filter(c => enrolledCourses.includes(c.id) && !completedCourses.includes(c.id)),
    [courses, enrolledCourses, completedCourses]
  );

  const firstName = user?.username?.split(' ')[0] ?? 'Explorer';

  return {
    insets,
    courses,
    recommendedCourses,
    isLoading,
    bookmarks,
    toggleBookmark,
    enrolledCourses,
    completedCourses,
    isRefreshing,
    handleRefresh,
    handleCoursePress,
    inProgressCourses,
    firstName,
    streak,
  };
}

export default function HomeScreen() {
  const {
    insets,
    courses,
    recommendedCourses,
    isLoading,
    bookmarks,
    toggleBookmark,
    isRefreshing,
    handleRefresh,
    handleCoursePress,
    firstName,
    streak,
  } = useHomeLogic();

  const renderItem = useCallback(({ item }: { item: Course }) => (
    <View className="mb-5">
      <CourseCard
        course={item}
        onPress={handleCoursePress}
        onToggleBookmark={toggleBookmark}
        isBookmarked={bookmarks.includes(item.id)}
      />
    </View>
  ), [handleCoursePress, toggleBookmark, bookmarks]);

  const uniqueInstructors = useMemo(() => {
    const map = new Map();
    courses.forEach(c => {
      if (!map.has(c.instructor.name)) {
        map.set(c.instructor.name, c.instructor);
      }
    });
    return Array.from(map.values());
  }, [courses]);

  const ListHeader = useMemo(() => (
    <View className="mb-2">
      {/* Greeting Header */}
      <View className="mb-6 mt-4 flex-row justify-between items-center px-4">
        <View>
          <Text className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Hi, {firstName}
          </Text>
          <Text className="text-base text-slate-500 font-medium mt-1">
            What would you like to learn today?
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          {streak > 0 && (
            <View className="flex-row items-center bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
              <Flame size={18} color="#F97316" fill="#F97316" />
              <Text className="ml-1.5 text-sm font-black text-orange-600">{streak}</Text>
            </View>
          )}
          <TouchableOpacity className="w-12 h-12 bg-secondary rounded-full items-center justify-center">
            <BookOpen size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Popular Teachers */}
      {uniqueInstructors.length > 0 && (
        <View className="mb-8">
          <View className="flex-row justify-between items-center px-4 mb-4">
            <Text className="text-xl font-bold text-slate-800">Popular Teacher</Text>
            <TouchableOpacity>
              <Text className="text-primary font-bold">Sell All →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 20 }}
          >
            {uniqueInstructors.map((inst, idx) => (
              <View key={`inst-${idx}`} className="items-center">
                <Image 
                  source={inst.avatar} 
                  className="w-16 h-16 rounded-full mb-2" 
                />
                <Text className="text-slate-800 font-semibold text-sm">{inst.name}</Text>
                <Text className="text-slate-500 text-xs">{inst.role || 'Instructor'}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recommended / Tech Courses */}
      {recommendedCourses.length > 0 && (
        <View className="mb-8">
          <View className="flex-row items-center mb-4 px-4">
            <Text className="text-xl font-bold text-slate-800">Tech Courses</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 16, paddingRight: 16, gap: 16 }}
          >
            {recommendedCourses.map((course) => (
              <View key={`rec-${course.id}`} className="w-72">
                <CourseCard
                  course={course}
                  onPress={handleCoursePress}
                  onToggleBookmark={toggleBookmark}
                  isBookmarked={bookmarks.includes(course.id)}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View className="mb-4 px-4 flex-row items-center">
        <Text className="text-xl font-bold text-slate-800">
          All Courses
        </Text>
      </View>
    </View>
  ), [
    firstName,
    uniqueInstructors,
    recommendedCourses,
    handleCoursePress,
    toggleBookmark,
    bookmarks,
  ]);

  const ListEmpty = useMemo(() => {
    if (isLoading) return null;
    return (
      <View className="mt-14">
        <EmptyState
          icon={Compass}
          title="No courses available"
          message="Check back later for new courses."
        />
      </View>
    );
  }, [isLoading]);

  // Loading State UI
  if (isLoading && courses.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-4">
          {[1, 2, 3].map((i) => (
            <View key={i} className="mb-5">
              <SkeletonCard />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="absolute top-0 left-0 right-0 bg-background z-10" style={{ height: insets.top }} />

      <LegendList
        data={courses}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={340}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 20,
          paddingTop: insets.top
        }}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
            progressViewOffset={insets.top}
          />
        }
      />
    </View>
  );
}
