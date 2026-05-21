import { analytics } from '@/core/services/analyticsService';
import { clarityService } from '@/core/services/clarityService';
import { trackUserAction } from '@/core/services/sentryPerformance';
import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';
import { CourseCard } from '@/features/courses/components/CourseCard';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useScreenTracking } from '@/shared/hooks/useScreenTracking';
import { Course } from '@/shared/types';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { LegendList } from '@legendapp/list';
import * as Haptics from 'expo-haptics';
import { Href, useRouter } from 'expo-router';
import { Bookmark, Share2, Trash2, Video } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { RefreshControl, Share, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BookmarksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { courses, bookmarks, enrolledCourses, completedCourses, toggleBookmark, enrollCourse, refreshCourses, isLoading } = useCourseStore();
  const { C, isDark } = useTheme();

  useScreenTracking('Bookmarks');

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['45%'], []);

  const bookmarkedCourses = useMemo(() =>
    courses.filter(c => bookmarks.includes(c.id)),
    [courses, bookmarks]
  );
  const bookmarkedSet = useMemo(() => new Set(bookmarks), [bookmarks]);
  const enrolledSet = useMemo(() => new Set(enrolledCourses), [enrolledCourses]);
  const completedSet = useMemo(() => new Set(completedCourses), [completedCourses]);

  const handleCoursePress = useCallback((course: Course) => {
    clarityService.logEvent('course_viewed', { courseId: course.id, title: course.title, source: 'bookmarks' });
    analytics.logEvent('course_tapped', { courseId: course.id, title: course.title, source: 'bookmarks' });
    router.push(`/course/${course.id}` as Href);
  }, [router]);

  const handleLongPress = useCallback((course: Course) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    analytics.logEvent('bookmarks_course_long_pressed', { courseId: course.id, title: course.title });
    setSelectedCourse(course);
    bottomSheetRef.current?.expand();
  }, []);

  const handleAction = useCallback(async (action: 'delete' | 'share' | 'enroll') => {
    if (!selectedCourse) return;
    bottomSheetRef.current?.close();

    if (action === 'delete') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      trackUserAction('bookmark_removed', { courseId: selectedCourse.id });
      clarityService.logEvent('course_unbookmarked', { courseId: selectedCourse.id, source: 'bookmarks_screen' });
      analytics.logEvent('bookmarks_course_removed', { courseId: selectedCourse.id, title: selectedCourse.title });
      toggleBookmark(selectedCourse.id);
    } else if (action === 'share') {
      trackUserAction('bookmark_shared', { courseId: selectedCourse.id });
      clarityService.logEvent('course_shared', { courseId: selectedCourse.id });
      analytics.logEvent('bookmarks_course_shared', { courseId: selectedCourse.id, title: selectedCourse.title });
      await Share.share({
        message: `Check out this awesome course on Edurise LMS: ${selectedCourse.title}`,
      });
    } else if (action === 'enroll') {
      enrollCourse(selectedCourse.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push(`/course/${selectedCourse.id}` as Href);
    }
  }, [selectedCourse, toggleBookmark, enrollCourse, router]);

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />,
    []
  );

  const renderItem = useCallback(({ item, index }: { item: Course; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 70).springify().damping(14)}>
      <CourseCard
        course={item}
        onPress={() => handleCoursePress(item)}
        onLongPress={handleLongPress}
        onToggleBookmark={toggleBookmark}
        isBookmarked={bookmarkedSet.has(item.id)}
        isEnrolled={enrolledSet.has(item.id)}
        isCompleted={completedSet.has(item.id)}
        compact
      />
    </Animated.View>
  ), [handleLongPress, handleCoursePress, toggleBookmark, bookmarkedSet, enrolledSet, completedSet]);

  const handleRefresh = useCallback(async () => {
    await refreshCourses();
  }, [refreshCourses]);

  const listPaddingHorizontal = width > 600 ? (width - 600) / 2 : 16;

  if (bookmarkedCourses.length === 0) {
    return (
      <View className="flex-1 bg-background dark:bg-dark-bg items-center justify-center">
        <EmptyState
          icon={Bookmark}
          title="No Bookmarks Yet"
          message="Save courses you're interested in and they'll appear here for easy access."
          actionTitle="Explore Courses"
          onAction={() => { analytics.logEvent('bookmarks_explore_tapped'); router.push('/(tabs)' as Href); }}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <LegendList
        data={bookmarkedCourses}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={340}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={Colors.primary} />
        }
        contentContainerStyle={{
          paddingHorizontal: listPaddingHorizontal,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100
        }}
        ListHeaderComponent={
          <View className="px-1 mb-6">
            <Text className="text-3xl font-extrabold text-text dark:text-dark-text tracking-tighter">Saved Courses</Text>
            <Text className="text-base text-text-muted dark:text-dark-text-muted mt-1 font-medium">Long press a course for options</Text>
          </View>
        }
      />

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: isDark ? '#374151' : '#E2E8F0', width: 40 }}
        backgroundStyle={{ borderRadius: 32, backgroundColor: C.surface }}
      >
        <BottomSheetView className="px-6 py-4 pb-12">
          <Text className="text-xl font-extrabold text-text dark:text-dark-text mb-1" numberOfLines={1}>
            {selectedCourse?.title}
          </Text>
          <Text className="text-sm text-text-muted dark:text-dark-text-muted mb-6">Course Options</Text>

          <TouchableOpacity
            style={{ backgroundColor: C.surfaceElevated, borderColor: C.border }}
            className="flex-row items-center border p-4 rounded-2xl mb-3"
            onPress={() => handleAction('enroll')}
          >
            <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center mr-4">
              <Video size={20} color={Colors.primary} />
            </View>
            <Text className="text-base font-bold text-text dark:text-dark-text">Enroll & Start Learning</Text>
          </TouchableOpacity>

          <View className="flex-row gap-3">
            <TouchableOpacity
              style={{ backgroundColor: C.surfaceElevated, borderColor: C.border }}
              className="flex-1 flex-row items-center justify-center border p-4 rounded-2xl"
              onPress={() => handleAction('share')}
            >
              <Share2 size={18} color={C.text} className="mr-2" />
              <Text className="text-sm font-bold text-text dark:text-dark-text">Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 p-4 rounded-2xl"
              onPress={() => handleAction('delete')}
            >
              <Trash2 size={18} color="#EF4444" className="mr-2" />
              <Text className="text-sm font-bold text-red-500">Remove</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
