import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { CourseCard } from '@/features/courses/components/CourseCard';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SkeletonCard } from '@/shared/components/ui/SkeletonCard';
import { Course } from '@/shared/types';
import { LegendList } from '@legendapp/list';
import { Href, useRouter } from 'expo-router';
import { BookOpen, Compass, Flame, Check, Sparkles } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
function useHomeLogic() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const {
    courses,
    recommendedCourses,
    isLoading,
    error,
    aiRecommendedIds,
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
    error,
    refreshCourses,
    aiRecommendedIds,
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
    error,
    refreshCourses,
    aiRecommendedIds,
    inProgressCourses,
  } = useHomeLogic();
  const { C } = useTheme();

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
          <Text className="text-3xl font-extrabold text-text dark:text-dark-text tracking-tight">
            Hi, {firstName}
          </Text>
          <Text className="text-base text-text-muted dark:text-dark-text-muted font-medium mt-1">
            What would you like to learn today?
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          {streak > 0 && (
            <View className="flex-row items-center bg-orange-50 dark:bg-orange-950/60 px-3 py-1.5 rounded-full border border-orange-100 dark:border-orange-900/50">
              <Flame size={18} color="#F97316" fill="#F97316" />
              <Text className="ml-1.5 text-sm font-black text-orange-600">{streak}</Text>
            </View>
          )}
          <TouchableOpacity
            className="w-12 h-12 bg-secondary dark:bg-secondary-dark rounded-full items-center justify-center"
          >
            <BookOpen size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* My Learning / In Progress */}
      {inProgressCourses.length > 0 && (
        <View className="mb-8">
          <View className="flex-row justify-between items-center px-4 mb-4">
            <Text className="text-xl font-bold text-text dark:text-dark-text">My Learning</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
          >
            {inProgressCourses.map((course) => (
              <TouchableOpacity
                key={`progress-${course.id}`}
                onPress={() => handleCoursePress(course)}
                activeOpacity={0.9}
                className="w-72"
              >
                <View className="bg-white dark:bg-dark-surface rounded-[32px] p-4 border border-border/40 dark:border-dark-border shadow-sm" style={{ backgroundColor: C.surface }}>
                  <Image source={course.thumbnail} className="w-full h-32 rounded-2xl mb-4" />
                  <Text className="text-sm font-bold text-text dark:text-dark-text mb-2" numberOfLines={1}>{course.title}</Text>
                  <View className="h-2 bg-border dark:bg-dark-border rounded-full overflow-hidden">
                    <View className="h-full bg-primary" style={{ width: '45%' }} />
                  </View>
                  <Text className="text-[10px] text-primary font-bold mt-2 uppercase tracking-widest">Resume Learning</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Expert Instructors */}
      {uniqueInstructors.length > 0 && (
        <View className="mb-8">
          <View className="flex-row justify-between items-center px-4 mb-4">
            <Text className="text-xl font-bold text-text dark:text-dark-text">Expert Instructors</Text>
            {/* Hiding "See All" until an instructors directory is implemented */}
            {/* <TouchableOpacity>
              <Text className="text-primary font-bold">See All →</Text>
            </TouchableOpacity> */}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 24 }}
          >
            {uniqueInstructors.map((inst, idx) => (
              <TouchableOpacity
                key={`inst-${idx}`}
                className="items-center"
                onPress={() => router.push(`/instructor/${inst.id}` as Href)}
                activeOpacity={0.8}
              >
                <View
                  className="relative p-1.5 rounded-[32px] shadow-lg border-2 border-border/40 dark:border-dark-border"
                  style={{ backgroundColor: C.surfaceElevated }}
                >
                  <Image
                    source={inst.avatar || `https://i.pravatar.cc/400?img=${(idx + 1) * 3}`}
                    className="w-24 h-24 rounded-[24px]"
                    transition={300}
                  />
                  <View className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white dark:border-dark-surface items-center justify-center shadow-sm">
                    <Check size={14} color="white" strokeWidth={4} />
                  </View>
                </View>
                <Text className="text-text dark:text-dark-text font-extrabold text-sm mt-4">{inst.name}</Text>
                <View className="bg-primary/10 px-3 py-1 rounded-full mt-2">
                  <Text className="text-primary text-[10px] font-black uppercase tracking-widest">{inst.role || 'Expert'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* AI Personalized Suggestions */}
      {aiRecommendedIds.length > 0 && (
        <View className="mb-8">
          <View className="flex-row items-center justify-between px-4 mb-4">
            <View className="flex-row items-center">
              <Sparkles size={20} color={Colors.primary} className="mr-2" />
              <Text className="text-xl font-bold text-text dark:text-dark-text">AI Suggestions</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 16, paddingRight: 16, gap: 16 }}
          >
            {courses.filter(c => aiRecommendedIds.includes(c.id)).map((course) => (
              <View key={`ai-rec-${course.id}`} className="w-72">
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
        <Text className="text-xl font-bold text-text dark:text-dark-text">
          All Courses
        </Text>
      </View>
    </View>
  ), [
    firstName,
    uniqueInstructors,
    recommendedCourses,
    aiRecommendedIds,
    courses,
    handleCoursePress,
    toggleBookmark,
    bookmarks,
    streak,
    C.surface,
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

  return (
    <View className="flex-1" style={{ backgroundColor: C.background }}>
      <View
        className="absolute top-0 left-0 right-0 z-10"
        style={{ height: insets.top, backgroundColor: C.background }}
      />

      {/* Error state — API or network failure */}
      {error && !isLoading && courses.length === 0 && (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full items-center justify-center mb-5" style={{ backgroundColor: C.surfaceElevated }}>
            <Compass size={40} color={C.textMuted} strokeWidth={1.5} />
          </View>
          <Text style={{ color: C.text }} className="text-xl font-extrabold text-center mb-2">
            {error.includes('internet') ? 'No Internet Connection' : 'Could Not Load Courses'}
          </Text>
          <Text style={{ color: C.textMuted }} className="text-sm text-center leading-5 mb-8">{error}</Text>
          <TouchableOpacity
            className="bg-primary px-8 py-3.5 rounded-2xl shadow-sm"
            onPress={() => refreshCourses()}
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-base">Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
      {isLoading && courses.length === 0 ? (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          className="flex-1"
          key="skeleton-view"
        >
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: insets.bottom + 20,
              paddingTop: insets.top + 20
            }}
          >
            {[1, 2, 3].map((i) => (
              <View key={i} className="mb-5">
                <SkeletonCard />
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      ) : (
        <Animated.View
          entering={FadeIn.delay(200)}
          className="flex-1"
          key="content-view"
        >
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
        </Animated.View>
      )}
    </View>
  );
}
