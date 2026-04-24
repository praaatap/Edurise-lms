import { CourseCard } from '@/features/courses/components/CourseCard';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Course } from '@/shared/types';
import { LegendList } from '@legendapp/list';
import { Href, useRouter } from 'expo-router';
import { Bookmark } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function useBookmarksLogic() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { courses, bookmarks, toggleBookmark } = useCourseStore();

  const bookmarkedCourses = useMemo(() =>
    courses.filter(c => bookmarks.includes(c.id)),
    [courses, bookmarks]
  );

  const handleCoursePress = useCallback((course: Course) => {
    router.push(`/course/${course.id}` as Href);
  }, [router]);

  const handleExplorePress = useCallback(() => {
    router.push('/(tabs)' as Href);
  }, [router]);

  return {
    bookmarkedCourses,
    handleCoursePress,
    toggleBookmark,
    handleExplorePress,
    insets,
  };
}

export default function BookmarksScreen() {
  const {
    bookmarkedCourses,
    handleCoursePress,
    toggleBookmark,
    handleExplorePress,
    insets,
  } = useBookmarksLogic();

  const renderRightActions = useCallback((courseId: string) => (
    <View className="mb-5 ml-3">
      <TouchableOpacity
        className="flex-1 w-24 rounded-2xl bg-red-500 items-center justify-center"
        onPress={() => toggleBookmark(courseId)}
        activeOpacity={0.8}
      >
        <Text className="text-white font-bold text-xs uppercase tracking-widest">Delete</Text>
      </TouchableOpacity>
    </View>
  ), [toggleBookmark]);

  const renderItem = useCallback(({ item }: { item: Course }) => (
      <Swipeable renderRightActions={() => renderRightActions(item.id)} overshootRight={false}>
        <View className="mb-5">
          <CourseCard
            course={item}
            onPress={handleCoursePress}
            onToggleBookmark={toggleBookmark}
            isBookmarked={true}
          />
        </View>
      </Swipeable>
  ), [handleCoursePress, toggleBookmark, renderRightActions]);

  if (bookmarkedCourses.length === 0) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <EmptyState
          icon={Bookmark}
          title="No Bookmarks Yet"
          message="Save courses you're interested in and they'll appear here for easy access."
          actionTitle="Explore Courses"
          onAction={handleExplorePress}
        />
      </View>
    );
  }

  const ListHeader = useMemo(() => (
    <View className="px-1 mb-6" style={{ marginTop: insets.top + 16 }}>
      <Text className="text-3xl font-extrabold text-text tracking-tighter">Saved Courses</Text>
      <Text className="text-base text-text-muted mt-1 font-medium">Courses you've bookmarked for later</Text>
    </View>
  ), [insets.top]);

  return (
    <View className="flex-1 bg-background">
      <LegendList
        data={bookmarkedCourses}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={340}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 100
        }}
        ListHeaderComponent={ListHeader}
      />
    </View>
  );
}
