import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { Badge } from '@/shared/components/ui/Badge';
import { Course } from '@/shared/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import React, { useCallback, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';

interface CourseCardProps {
  course: Course;
  onPress: (course: Course) => void;
  onToggleBookmark: (id: string) => void;
  isBookmarked: boolean;
  index?: number;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const CourseCard = React.memo(
  ({ course, onPress, onToggleBookmark, isBookmarked, index = 0 }: CourseCardProps) => {
    const scale = useSharedValue(1);
    const bookmarkScale = useSharedValue(1);
    const bookmarkRotate = useSharedValue(0);
    const { C, isDark } = useTheme();

    const isEnrolled = useCourseStore((s) => s.enrolledCourses.includes(course.id));
    const isCompleted = useCourseStore((s) => s.completedCourses.includes(course.id));

    const progress = useMemo(() => {
      const raw = (course as any)?.progress;
      return typeof raw === 'number' ? Math.max(0, Math.min(100, raw)) : isEnrolled ? 30 : 0;
    }, [course, isEnrolled]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const bookmarkAnimatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: bookmarkScale.value },
        { rotate: `${bookmarkRotate.value}deg` },
      ],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.975, { damping: 16, stiffness: 220 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 16, stiffness: 220 });
    };

    const handleBookmark = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (!isBookmarked) {
        // Adding: pop + rotate + bounce
        bookmarkScale.value = withSequence(
          withSpring(0.7, { damping: 8, stiffness: 300 }),
          withSpring(1.4, { damping: 6, stiffness: 200 }),
          withSpring(1, { damping: 10, stiffness: 180 }),
        );
        bookmarkRotate.value = withSequence(
          withTiming(-15, { duration: 80 }),
          withTiming(12, { duration: 100 }),
          withTiming(0, { duration: 120 }),
        );
      } else {
        // Removing: shrink out
        bookmarkScale.value = withSequence(
          withSpring(1.2, { damping: 10, stiffness: 200 }),
          withSpring(0.85, { damping: 12, stiffness: 200 }),
          withSpring(1, { damping: 10, stiffness: 180 }),
        );
      }

      onToggleBookmark(course.id);
    }, [course.id, onToggleBookmark, bookmarkScale, bookmarkRotate, isBookmarked]);

    const priceText = useMemo(() => {
      const fixed = Number(course.price || 0).toFixed(2);
      const [whole, fraction] = fixed.split('.');
      return { whole, fraction };
    }, [course.price]);

    return (
      <Animated.View entering={FadeInDown.delay(index * 60).springify().damping(14)}>
        <AnimatedTouchableOpacity
          className="mb-5 overflow-hidden rounded-[28px] border border-border/50 dark:border-dark-border"
          style={[
            animatedStyle,
            {
              backgroundColor: C.surface,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.3 : 0.07,
              shadowRadius: 14,
              elevation: 4,
            },
          ]}
          onPress={() => onPress(course)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.92}
        >
          {/* Thumbnail */}
          <View className="relative">
            <Image
              source={course.thumbnail}
              className="h-48 w-full"
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />

            {/* Gradient overlay */}
            <View className="absolute inset-0 bg-black/15" />
            <View className="absolute inset-x-0 bottom-0 h-24" />

            {/* Status badge */}
            <View className="absolute left-3 top-3 flex-row gap-2">
              {isCompleted ? (
                <View className="rounded-full bg-emerald-500 px-3 py-1.5 flex-row items-center gap-1">
                  <Ionicons name="checkmark-circle" size={11} color="white" />
                  <Text className="text-[10px] font-bold tracking-[1.5px] text-white">DONE</Text>
                </View>
              ) : isEnrolled ? (
                <View className="rounded-full bg-primary px-3 py-1.5 flex-row items-center gap-1">
                  <Ionicons name="play-circle" size={11} color="white" />
                  <Text className="text-[10px] font-bold tracking-[1.5px] text-white">ENROLLED</Text>
                </View>
              ) : (
                <View style={{ backgroundColor: 'rgba(255,255,255,0.92)' }} className="rounded-full px-3 py-1.5">
                  <Text className="text-[10px] font-bold tracking-[1.5px] text-text">NEW</Text>
                </View>
              )}
            </View>

            {/* Lessons count */}
            <View className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1.5 flex-row items-center gap-1">
              <Ionicons name="play" size={9} color="white" />
              <Text className="text-[11px] font-semibold tracking-wider text-white">
                {course.lessonsCount || 12} LESSONS
              </Text>
            </View>

            {/* Bookmark button */}
            <TouchableOpacity
              style={{ backgroundColor: isDark ? C.surfaceElevated : 'rgba(255,255,255,0.95)' }}
              className="absolute right-3 top-3 h-11 w-11 items-center justify-center rounded-full shadow-sm"
              onPress={handleBookmark}
              activeOpacity={0.85}
            >
              <Animated.View style={bookmarkAnimatedStyle}>
                <Ionicons
                  name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={21}
                  color={isBookmarked ? Colors.bookmark : Colors.textMuted}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Card body */}
          <View className="p-5">
            <Badge
              text={course.category}
              className="mb-3 self-start rounded-full bg-primary/10 px-3 py-1 text-primary"
            />

            <Text className="mb-2 text-[18px] font-bold leading-7 text-text dark:text-dark-text" numberOfLines={2}>
              {course.title}
            </Text>

            <Text className="mb-5 text-sm leading-6 text-text-muted dark:text-dark-text-muted" numberOfLines={2}>
              Learn at your own pace with structured lessons, clear outcomes, and hands-on practice.
            </Text>

            {/* Instructor + rating row */}
            <View
              className="mb-5 flex-row items-center justify-between rounded-2xl px-4 py-3"
              style={{ backgroundColor: C.surfaceElevated }}
            >
              <View className="flex-row items-center">
                <View className="relative">
                  <Image
                    source={course.instructor.avatar}
                    className="h-10 w-10 rounded-full border-2 border-white dark:border-dark-surface"
                    cachePolicy="memory-disk"
                  />
                  <View className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-dark-surface bg-emerald-500" />
                </View>
                <View className="ml-3">
                  <Text className="text-sm font-bold text-text dark:text-dark-text">{course.instructor.name}</Text>
                  <Text className="text-[10px] font-semibold uppercase tracking-[1.5px] text-text-muted dark:text-dark-text-muted">
                    Instructor
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center rounded-full bg-amber-50 dark:bg-amber-950/60 px-3 py-2">
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text className="ml-1 text-sm font-bold text-text dark:text-dark-text">
                  {course.rating.toFixed(1)}
                </Text>
                <Text className="ml-0.5 text-[10px] text-text-muted dark:text-dark-text-muted">
                  ({course.reviewsCount || '1.2k'})
                </Text>
              </View>
            </View>

            {/* Price + CTA */}
            <View
              className="flex-row items-center justify-between pt-4"
              style={{ borderTopWidth: 1, borderTopColor: C.border }}
            >
              <View>
                <Text className="text-[11px] font-semibold uppercase tracking-[1.6px] text-text-muted dark:text-dark-text-muted">
                  {isEnrolled ? 'Your progress' : 'Price'}
                </Text>
                {isEnrolled ? (
                  <View className="mt-2 flex-row items-center">
                    <Text className="text-xl font-black text-primary">{progress}%</Text>
                    <Text className="ml-2 text-sm font-semibold text-text-muted dark:text-dark-text-muted">done</Text>
                  </View>
                ) : (
                  <View className="mt-1 flex-row items-end">
                    <Text className="mr-1 pb-1 text-sm font-bold text-text-muted dark:text-dark-text-muted">$</Text>
                    <Text className="text-3xl font-black tracking-tight text-text dark:text-dark-text">
                      {priceText.whole}
                    </Text>
                    <Text className="pb-1 text-sm font-bold text-text-muted dark:text-dark-text-muted">.{priceText.fraction}</Text>
                  </View>
                )}
              </View>

              {isEnrolled ? (
                <View className="rounded-2xl bg-primary/10 px-4 py-3 flex-row items-center gap-1.5">
                  <Ionicons name="play" size={12} color={Colors.primary} />
                  <Text className="text-xs font-black uppercase tracking-[1.5px] text-primary">Continue</Text>
                </View>
              ) : (
                <View className="rounded-2xl px-4 py-3 bg-primary flex-row items-center gap-1.5">
                  <Ionicons name="arrow-forward" size={12} color="white" />
                  <Text className="text-xs font-black uppercase tracking-[1.5px] text-white">View</Text>
                </View>
              )}
            </View>

            {/* Progress bar */}
            {isEnrolled && !isCompleted && (
              <View className="mt-4">
                <View className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: C.border }}>
                  <Animated.View
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${progress}%` }}
                  />
                </View>
              </View>
            )}
          </View>
        </AnimatedTouchableOpacity>
      </Animated.View>
    );
  }
);
