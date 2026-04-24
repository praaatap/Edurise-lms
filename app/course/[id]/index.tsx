import { Colors } from '@/core/theme/colors';
import { useCourseStore } from '@/features/courses/store/courseStore';
import {
  clearCourseReminderNotification,
  scheduleCourseReengagementReminder,
} from '@/features/notifications/services/notificationService';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  CirclePlay,
  Clock3,
  CreditCard,
  Settings2,
  Star
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StatusBar, Text, TouchableOpacity, UIManager, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AnimatedButton = Animated.createAnimatedComponent(TouchableOpacity);

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getCourseById, bookmarks, toggleBookmark, enrolledCourses, enrollCourse, unenrollCourse } = useCourseStore();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['45%'], []);
  const [isExpanded, setIsExpanded] = useState(false);

  const course = useMemo(() => getCourseById(id as string), [id, getCourseById]);
  const isBookmarked = bookmarks.includes(id as string);
  const isEnrolled = enrolledCourses.includes(id as string);

  useEffect(() => {
    void clearCourseReminderNotification();

    return () => {
      if (!course) return;
      void scheduleCourseReengagementReminder(course.id, course.title, 60 * 60);
    };
  }, [course]);

  const btnScale = useSharedValue(1);
  const animatedBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handleMainActionPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    bottomSheetRef.current?.expand();
  }, []);

  const confirmEnrollment = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    btnScale.value = withSequence(withSpring(0.95), withSpring(1.05), withSpring(1));

    enrollCourse(id as string);
    bottomSheetRef.current?.close();
  }, [id, enrollCourse]);

  const handleUnenroll = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    unenrollCourse(id as string);
    bottomSheetRef.current?.close();
  }, [id, unenrollCourse]);

  const handleGoAhead = useCallback(() => {
    bottomSheetRef.current?.close();
    router.push(`/course/${id}/content` as any);
  }, [id, router]);

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  );

  if (!course) return null;

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />

      {/* Floating Header */}
      <View 
        style={{ paddingTop: insets.top + 8 }} 
        className="absolute top-0 left-0 right-0 flex-row justify-between px-5 z-50"
      >
        <TouchableOpacity
          className="bg-white/90 border border-border w-11 h-11 rounded-full items-center justify-center shadow-lg"
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white/90 border border-border w-11 h-11 rounded-full items-center justify-center shadow-lg"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleBookmark(course.id);
          }}
        >
          {isBookmarked ? (
            <BookmarkCheck size={22} color={Colors.primary} />
          ) : (
            <Bookmark size={22} color={Colors.text} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        bounces={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
      >
        {/* Hero Image */}
        <View className="px-4 mt-2" style={{ paddingTop: insets.top + 60 }}>
          <Image 
            source={course.thumbnail} 
            className="w-full h-[280px] rounded-[32px] shadow-xl" 
            contentFit="cover" 
          />
        </View>

        <View className="flex-1 p-6">
          <View className="flex-row items-center justify-between mb-4">
            <Badge text={course.category.toUpperCase()} />
            <View className="flex-row items-center bg-yellow-50 px-3 py-1 rounded-full">
              <Star size={14} color="#FBBF24" fill="#FBBF24" />
              <Text className="ml-1 text-sm font-bold text-yellow-700">{course.rating.toFixed(1)}</Text>
            </View>
          </View>

          <Text className="text-3xl font-extrabold text-text leading-tight mb-4">{course.title}</Text>

          <View className="flex-row items-center mb-6">
            <View className="flex-row items-center">
              <Clock3 size={18} color={Colors.textMuted} />
              <Text className="ml-1.5 text-sm font-medium text-text-muted">6h 30m</Text>
            </View>
            <View className="w-1 h-1 rounded-full bg-border mx-3" />
            <View className="flex-row items-center">
              <CirclePlay size={18} color={Colors.textMuted} />
              <Text className="ml-1.5 text-sm font-medium text-text-muted">12 lessons</Text>
            </View>
          </View>

          <View className="h-[1px] bg-border/50 mb-6" />
          
          <Text className="text-lg font-bold text-text mb-3">Instructor</Text>
          <Card className="flex-row items-center p-4 mb-8 border-border/40">
            <Image source={course.instructor.avatar} className="w-14 h-14 rounded-2xl mr-4" />
            <View className="flex-1">
              <Text className="text-base font-bold text-text">{course.instructor.name}</Text>
              <Text className="text-sm text-text-muted">{course.instructor.location}</Text>
            </View>
            <TouchableOpacity className="bg-primary/10 px-4 py-2 rounded-xl">
              <Text className="text-primary font-bold text-xs">Profile</Text>
            </TouchableOpacity>
          </Card>

          <Text className="text-lg font-bold text-text mb-3 mt-4">About this course</Text>
          <Text className="text-[15px] text-text/70 leading-6" numberOfLines={isExpanded ? undefined : 4}>
            {course.description}
          </Text>
          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} className="mt-2 mb-6">
            <Text className="text-primary font-bold">{isExpanded ? 'Show Less' : 'Read Full Description'}</Text>
          </TouchableOpacity>

          <Text className="text-lg font-bold text-text mb-5">Course Syllabus</Text>
          <View className="mb-4">
            {[
              { title: 'Introduction to Concepts', duration: '45 mins', done: isEnrolled },
              { title: 'Environment Setup', duration: '1h 15m', done: isEnrolled },
              { title: 'Core Implementation', duration: '2h 30m', done: false },
              { title: 'Advanced Patterns', duration: '1h 45m', done: false },
              { title: 'Final Project', duration: '3h 00m', done: false },
            ].map((module, index, arr) => (
              <View key={index} className="flex-row">
                <View className="items-center mr-4">
                  <View className={`w-7 h-7 rounded-full items-center justify-center z-10 ${module.done ? 'bg-success' : 'bg-surface border-2 border-border'}`}>
                    {module.done && <CheckCircle2 size={16} color="white" />}
                  </View>
                  {index !== arr.length - 1 && (
                    <View className={`w-0.5 flex-1 -my-1 ${module.done ? 'bg-success' : 'bg-border'}`} />
                  )}
                </View>
                <View className="flex-1 pb-8 pt-0.5">
                  <Text className={`text-base font-bold ${module.done ? 'text-text' : 'text-text-muted'}`}>{module.title}</Text>
                  <View className="flex-row items-center mt-1.5">
                    <Clock3 size={14} color={Colors.textMuted} />
                    <Text className="text-sm text-text-muted ml-1">{module.duration} • Video Lesson</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Persistent Footer Action */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white/95 border-t border-border px-6 pt-4"
        style={{ paddingBottom: insets.bottom + 20 }}
      >
        <AnimatedButton
          activeOpacity={0.9}
          className={`h-16 rounded-2xl flex-row items-center justify-center shadow-lg ${isEnrolled ? 'bg-success' : 'bg-primary'}`}
          style={animatedBtnStyle}
          onPress={handleMainActionPress}
        >
          <Text className="text-white text-lg font-bold">
            {isEnrolled ? 'Manage Course' : `Enroll Now • $${course.price.toFixed(2)}`}
          </Text>
          {isEnrolled && <Settings2 size={20} color="white" style={{ marginLeft: 8 }} />}
        </AnimatedButton>
      </View>

      {/* Confirmation Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: '#E2E8F0', width: 40 }}
        backgroundStyle={{ borderRadius: 40, backgroundColor: 'white' }}
      >
        <BottomSheetView className="p-8 items-center w-full">
          {!isEnrolled ? (
            <>
              <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-6">
                <CreditCard size={32} color={Colors.primary} />
              </View>
              <Text className="text-2xl font-extrabold text-text mb-2">Confirm Enrollment</Text>
              <Text className="text-base text-text-muted text-center mb-8 leading-6">
                You are about to enroll in <Text className="font-bold text-text">{course.title}</Text>.
              </Text>

              <TouchableOpacity
                className="bg-primary w-full h-15 py-4 rounded-2xl justify-center items-center shadow-md mb-4"
                onPress={confirmEnrollment}
              >
                <Text className="text-white text-lg font-bold">Confirm & Start</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="w-full py-2 items-center"
                onPress={() => bottomSheetRef.current?.close()}
              >
                <Text className="text-text-muted text-base font-semibold">Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View className="w-16 h-16 bg-success/10 rounded-full items-center justify-center mb-6">
                <CheckCircle2 size={32} color={Colors.success} />
              </View>
              <Text className="text-2xl font-extrabold text-text mb-2">You are enrolled!</Text>
              <Text className="text-base text-text-muted text-center mb-8 leading-6">
                What would you like to do with <Text className="font-bold text-text">{course.title}</Text>?
              </Text>

              <TouchableOpacity
                className="bg-success w-full h-15 py-4 rounded-2xl justify-center items-center shadow-md mb-4 flex-row"
                onPress={handleGoAhead}
              >
                <Text className="text-white text-lg font-bold mr-2">Go Ahead (Continue Learning)</Text>
                <ArrowRight size={20} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                className="w-full py-4 items-center rounded-2xl border border-error/30"
                onPress={handleUnenroll}
              >
                <Text className="text-error text-base font-bold">Un-enroll from Course</Text>
              </TouchableOpacity>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}