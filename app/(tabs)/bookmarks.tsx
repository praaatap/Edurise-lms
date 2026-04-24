import { Colors } from '@/core/theme/colors';
import { CourseCard } from '@/features/courses/components/CourseCard';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Course } from '@/shared/types';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { LegendList } from '@legendapp/list';
import * as Haptics from 'expo-haptics';
import { Href, useRouter } from 'expo-router';
import { Bookmark, Share2, Trash2, Video } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Share, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BookmarksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { courses, bookmarks, toggleBookmark, enrollCourse } = useCourseStore();

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['35%'], []);

  const bookmarkedCourses = useMemo(() =>
    courses.filter(c => bookmarks.includes(c.id)),
    [courses, bookmarks]
  );

  const handleCoursePress = useCallback((course: Course) => {
    router.push(`/course/${course.id}` as Href);
  }, [router]);

  const handleLongPress = useCallback((course: Course) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedCourse(course);
    bottomSheetRef.current?.expand();
  }, []);

  const handleAction = useCallback(async (action: 'delete' | 'share' | 'enroll') => {
    if (!selectedCourse) return;
    bottomSheetRef.current?.close();
    
    setTimeout(async () => {
      if (action === 'delete') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toggleBookmark(selectedCourse.id);
      } else if (action === 'share') {
        await Share.share({
          message: `Check out this awesome course on Edurise LMS: ${selectedCourse.title}`,
        });
      } else if (action === 'enroll') {
        enrollCourse(selectedCourse.id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push(`/course/${selectedCourse.id}` as Href);
      }
    }, 300);
  }, [selectedCourse, toggleBookmark, enrollCourse, router]);

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />,
    []
  );

  const renderItem = useCallback(({ item }: { item: Course }) => (
    <View className="mb-5">
      <TouchableOpacity 
        activeOpacity={0.9} 
        onLongPress={() => handleLongPress(item)}
        delayLongPress={400}
      >
        <View pointerEvents="none">
          <CourseCard
            course={item}
            onPress={() => handleCoursePress(item)}
            onToggleBookmark={() => {}}
            isBookmarked={true}
          />
        </View>
      </TouchableOpacity>
    </View>
  ), [handleLongPress]);

  if (bookmarkedCourses.length === 0) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <EmptyState
          icon={Bookmark}
          title="No Bookmarks Yet"
          message="Save courses you're interested in and they'll appear here for easy access."
          actionTitle="Explore Courses"
          onAction={() => router.push('/(tabs)' as Href)}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <LegendList
        data={bookmarkedCourses}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={340}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100
        }}
        ListHeaderComponent={
          <View className="px-1 mb-6">
            <Text className="text-3xl font-extrabold text-text tracking-tighter">Saved Courses</Text>
            <Text className="text-base text-text-muted mt-1 font-medium">Long press a course for options</Text>
          </View>
        }
      />

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: '#E2E8F0', width: 40 }}
        backgroundStyle={{ borderRadius: 32, backgroundColor: 'white' }}
      >
        <BottomSheetView className="px-6 py-4">
          <Text className="text-xl font-extrabold text-text mb-1" numberOfLines={1}>
            {selectedCourse?.title}
          </Text>
          <Text className="text-sm text-text-muted mb-6">Course Options</Text>

          <TouchableOpacity 
            className="flex-row items-center bg-surface border border-border/40 p-4 rounded-2xl mb-3"
            onPress={() => handleAction('enroll')}
          >
            <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center mr-4">
              <Video size={20} color={Colors.primary} />
            </View>
            <Text className="text-base font-bold text-text">Enroll & Start Learning</Text>
          </TouchableOpacity>

          <View className="flex-row gap-3">
            <TouchableOpacity 
              className="flex-1 flex-row items-center justify-center bg-surface border border-border/40 p-4 rounded-2xl"
              onPress={() => handleAction('share')}
            >
              <Share2 size={18} color={Colors.text} className="mr-2" />
              <Text className="text-sm font-bold text-text">Share</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-1 flex-row items-center justify-center bg-red-50 border border-red-100 p-4 rounded-2xl"
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
