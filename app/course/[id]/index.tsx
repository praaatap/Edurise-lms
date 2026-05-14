import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';
import { useCourseStore } from '@/features/courses/store/courseStore';
import {
  clearCourseReminderNotification,
  scheduleCourseReengagementReminder,
} from '@/features/notifications/services/notificationService';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';
import { CustomDialog } from '@/shared/components/ui/CustomDialog';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  CheckCircle2,
  CirclePlay,
  Clock3,
  Download,
  Settings2,
  Star,
  Trophy,
} from 'lucide-react-native';
import { authenticateBiometric } from '@/shared/utils/security';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Share, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { analytics } from '@/core/services/analyticsService';
import { trackUserAction } from '@/core/services/sentryPerformance';
import { useScreenTracking } from '@/shared/hooks/useScreenTracking';

// Extracted Components
import { CourseHeader } from '@/features/courses/components/CourseDetail/CourseHeader';
import { CourseHero } from '@/features/courses/components/CourseDetail/CourseHero';
import { CertificateModal } from '@/features/courses/components/CourseDetail/CertificateModal';
import { EnrollmentBottomSheet } from '@/features/courses/components/CourseDetail/EnrollmentBottomSheet';

const AnimatedButton = Animated.createAnimatedComponent(TouchableOpacity);

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getCourseById, bookmarks, toggleBookmark, enrolledCourses, enrollCourse, unenrollCourse, completedCourses } = useCourseStore();
  const { C, isDark } = useTheme();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews'>('overview');

  const course = useMemo(() => getCourseById(id as string), [id, getCourseById]);
  const isBookmarked = bookmarks.includes(id as string);
  const isEnrolled = enrolledCourses.includes(id as string);
  const isCompleted = completedCourses.includes(id as string);

  const [isCertificateVisible, setIsCertificateVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
    type?: 'default' | 'destructive' | 'success';
  }>({ visible: false, title: '', message: '' });

  const courseId = course?.id;
  const courseTitle = course?.title;
  useEffect(() => {
    void clearCourseReminderNotification();
    return () => {
      if (!courseId || !courseTitle) return;
      void scheduleCourseReengagementReminder(courseId, courseTitle, 60 * 60);
    };
  }, [courseId, courseTitle]);

  useScreenTracking(course ? `CourseDetail_${course.id}` : 'CourseDetail');

  useEffect(() => {
    if (course) {
      analytics.logEvent('course_view', { courseId: course.id, title: course.title });
    }
  }, [course?.id]);

  const btnScale = useSharedValue(1);
  const animatedBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handleShare = useCallback(async () => {
    if (!course) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackUserAction('course_shared', { courseId: course.id });
    analytics.logEvent('course_detail_shared', { courseId: course.id, title: course.title });
    await Share.share({
      message: `Master ${course.title} on Edurise LMS! Check it out: edurise://course/${course.id}`,
    });
  }, [course]);

  const handleMainActionPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    analytics.logEvent('course_detail_enroll_sheet_opened', { courseId: id as string, isEnrolled });
    bottomSheetRef.current?.expand();
  }, [id, isEnrolled]);

  const confirmEnrollment = useCallback(async () => {
    const isAuthed = await authenticateBiometric(`Enroll in ${course?.title}`);
    if (!isAuthed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    trackUserAction('course_enrolled', { courseId: id as string });
    btnScale.value = withSequence(withSpring(0.95), withSpring(1.05), withSpring(1));
    enrollCourse(id as string);
    bottomSheetRef.current?.close();
  }, [id, enrollCourse, course]);

  const handleUnenroll = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    trackUserAction('course_unenrolled', { courseId: id as string });
    analytics.logEvent('course_detail_unenrolled', { courseId: id as string, title: course?.title });
    unenrollCourse(id as string);
    bottomSheetRef.current?.close();
  }, [id, unenrollCourse, course]);

  const handleGoAhead = useCallback(() => {
    analytics.logEvent('course_detail_content_started', { courseId: id as string, title: course?.title });
    bottomSheetRef.current?.close();
    router.push(`/course/${id}/content` as any);
  }, [id, router, course]);

  if (!course) return null;

  return (
    <View className="flex-1" style={{ backgroundColor: C.background }}>
      <CustomDialog
        visible={dialogConfig.visible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText={dialogConfig.confirmText}
        type={dialogConfig.type}
        onConfirm={() => {
          dialogConfig.onConfirm?.();
          setDialogConfig(prev => ({ ...prev, visible: false }));
        }}
        onCancel={() => setDialogConfig(prev => ({ ...prev, visible: false }))}
      />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <CourseHeader 
        insets={insets} 
        isBookmarked={isBookmarked} 
        onShare={handleShare} 
        onToggleBookmark={() => toggleBookmark(course.id)} 
      />

      <ScrollView
        bounces={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
      >
        <CourseHero insets={insets} thumbnail={course.thumbnail} />

        <View className="flex-1 p-6">
          <View className="flex-row items-center justify-between mb-4">
            <Badge text={course.category.toUpperCase()} />
            <View className="flex-row items-center px-3 py-1 rounded-full" style={{ backgroundColor: isDark ? 'rgba(251,191,36,0.15)' : '#FEFCE8' }}>
              <Star size={14} color="#FBBF24" fill="#FBBF24" />
              <Text className="ml-1 text-sm font-bold" style={{ color: isDark ? '#FBBF24' : '#854D0E' }}>{course.rating.toFixed(1)}</Text>
            </View>
          </View>

          <Text className="text-3xl font-extrabold text-text dark:text-dark-text leading-tight mb-2">{course.title}</Text>
          <Text style={{ color: Colors.primary }} className="text-xl font-bold mb-4">${course.price.toFixed(2)}</Text>

          <View className="flex-row items-center mb-6">
            <View className="flex-row items-center">
              <Clock3 size={18} color={isDark ? '#94A3B8' : Colors.textMuted} />
              <Text className="ml-1.5 text-sm font-medium text-text-muted dark:text-dark-text-muted">6h 30m</Text>
            </View>
            <View className="w-1 h-1 rounded-full bg-border dark:bg-dark-border mx-3" />
            <View className="flex-row items-center">
              <CirclePlay size={18} color={isDark ? '#94A3B8' : Colors.textMuted} />
              <Text className="ml-1.5 text-sm font-medium text-text-muted dark:text-dark-text-muted">12 lessons</Text>
            </View>
          </View>

          <View className="flex-row px-2 mt-4 mb-4 border-b border-border/50 dark:border-dark-border/50">
            {(['overview', 'curriculum', 'reviews'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab(tab);
                  analytics.logEvent('course_detail_tab_switched', { courseId: id as string, tab });
                }}
                className={`mr-6 pb-3 ${activeTab === tab ? 'border-b-2 border-primary' : ''}`}
              >
                <Text
                  className={`text-base font-bold capitalize ${
                    activeTab === tab ? 'text-primary' : 'text-text-muted dark:text-dark-text-muted'
                  }`}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* TAB CONTENT */}
          <View className="min-h-[300px]">
            {activeTab === 'overview' && (
              <Animated.View entering={FadeIn.duration(300)}>
                <Text className="text-lg font-bold text-text dark:text-dark-text mb-3">Instructor</Text>
                <Card className="flex-row items-center p-4 mb-8 border-border/40 dark:border-dark-border" >
                  <Image source={course.instructor.avatar || `https://i.pravatar.cc/400?img=15`} className="w-14 h-14 rounded-2xl mr-4 border border-border/50" cachePolicy="memory-disk" />
                  <View className="flex-1">
                    <Text style={{ color: C.text }} className="text-base font-bold">{course.instructor.name}</Text>
                    <Text style={{ color: C.textMuted }} className="text-sm">{course.instructor.location}</Text>
                  </View>
                  <TouchableOpacity className="bg-primary/10 px-4 py-2 rounded-xl">
                    <Text className="text-primary font-bold text-xs">Profile</Text>
                  </TouchableOpacity>
                </Card>

                <Text className="text-lg font-bold text-text dark:text-dark-text mb-3">About this course</Text>
                <Text className="text-[15px] text-text/70 dark:text-dark-text/70 leading-6" numberOfLines={isExpanded ? undefined : 4}>
                  {course.description}
                </Text>
                <TouchableOpacity onPress={() => { analytics.logEvent('course_detail_description_expanded', { courseId: id as string, expanded: !isExpanded }); setIsExpanded(!isExpanded); }} className="mt-2 mb-6">
                  <Text className="text-primary font-bold">{isExpanded ? 'Show Less' : 'Read Full Description'}</Text>
                </TouchableOpacity>

                <Text className="text-lg font-bold text-text dark:text-dark-text mb-3">Features</Text>
                <View className="flex-row flex-wrap gap-3 mb-4">
                  {['Certificate of completion', 'Full lifetime access', 'Access on mobile', 'Quizzes & Assignments'].map((feature, i) => (
                    <View key={i} className="flex-row items-center w-full mb-1">
                      <CheckCircle2 size={16} color={Colors.primary} />
                      <Text className="ml-2 text-sm text-text/80 dark:text-dark-text/80">{feature}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {activeTab === 'curriculum' && (
              <Animated.View entering={FadeIn.duration(300)}>
                <View className="flex-row justify-between items-center mb-4">
                  <Text style={{ color: C.text }} className="text-lg font-bold">Syllabus</Text>
                  <TouchableOpacity 
                    className="flex-row items-center px-3 py-1.5 rounded-full border"
                    style={{ backgroundColor: C.surfaceElevated, borderColor: C.border }}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      analytics.logEvent('course_detail_download_all', { courseId: id as string, title: course?.title });
                      setDialogConfig({ visible: true, title: 'Download Started', message: 'The entire course is being prepared for offline use. You will be notified once it is ready.', confirmText: 'Awesome', type: 'success' });
                    }}
                  >
                    <Download size={14} color={C.text} className="mr-1.5" />
                    <Text style={{ color: C.text }} className="text-xs font-black uppercase">Download All</Text>
                  </TouchableOpacity>
                </View>
                
                <View className="mb-4">
                  {[
                    { title: 'Introduction to Concepts', duration: '45 mins', done: isEnrolled },
                    { title: 'Environment Setup', duration: '1h 15m', done: isEnrolled },
                    { title: 'Core Implementation', duration: '2h 30m', done: false },
                    { title: 'Advanced Patterns', duration: '1h 45m', done: false },
                    { title: 'Final Project', duration: '3h 00m', done: false },
                  ].map((module, index, arr) => (
                    <View key={index} className="flex-row mb-2">
                      <TouchableOpacity 
                        className="flex-1 flex-row active:opacity-70"
                        onPress={() => {
                          if (isEnrolled) handleGoAhead();
                          else handleMainActionPress();
                        }}
                      >
                        <View className="items-center mr-4">
                          <View className={`w-7 h-7 rounded-full items-center justify-center z-10 ${module.done ? 'bg-success' : 'border-2'}`} style={!module.done ? { backgroundColor: C.surface, borderColor: C.border } : undefined}>
                            {module.done ? <CheckCircle2 size={16} color="white" /> : <Text style={{ color: C.textMuted }} className="text-xs font-bold">{index + 1}</Text>}
                          </View>
                          {index !== arr.length - 1 && (
                            <View className={`w-0.5 flex-1 -my-1 ${module.done ? 'bg-success' : 'bg-border dark:bg-dark-border'}`} />
                          )}
                        </View>
                        <View className="flex-1 pb-6 pt-0.5 border-b mb-2" style={{ borderBottomColor: C.border + '50' }}>
                          <Text style={{ color: C.text }} className="text-base font-bold">{module.title}</Text>
                          <View className="flex-row items-center mt-1.5 justify-between">
                            <View className="flex-row items-center">
                              <CirclePlay size={14} color={Colors.primary} />
                              <Text style={{ color: C.textMuted }} className="text-sm ml-1.5">{module.duration} • Video</Text>
                            </View>
                            {module.done && <Text className="text-xs font-bold text-success uppercase">Done</Text>}
                          </View>
                        </View>
                      </TouchableOpacity>
                      
                      <View className="ml-4 justify-center pb-8">
                        <TouchableOpacity 
                          className="w-10 h-10 rounded-full items-center justify-center border"
                          style={{ backgroundColor: C.surfaceElevated, borderColor: C.border }}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            analytics.logEvent('course_detail_module_downloaded', { courseId: id as string, moduleTitle: module.title });
                            setDialogConfig({
                              visible: true,
                              title: 'Module Downloaded',
                              message: `"${module.title}" is now available for offline playback.`,
                              confirmText: 'Great',
                              type: 'success'
                            });
                          }}
                        >
                          <Download size={16} color={Colors.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {activeTab === 'reviews' && (
              <Animated.View entering={FadeIn.duration(300)}>
                <View className="flex-row items-center justify-between mb-6">
                  <View>
                    <Text style={{ color: C.text }} className="text-4xl font-extrabold">{course.rating.toFixed(1)}</Text>
                    <View className="flex-row items-center mt-1">
                      {[1, 2, 3, 4, 5].map(star => (
                         <Star key={star} size={16} color="#FBBF24" fill="#FBBF24" />
                      ))}
                    </View>
                    <Text style={{ color: C.textMuted }} className="text-sm font-medium mt-1">Based on {course.reviewsCount || '1.2k'} reviews</Text>
                  </View>
                  <View className="items-end gap-1">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <View key={rating} className="flex-row items-center">
                        <Text style={{ color: C.textMuted }} className="text-xs font-bold mr-2">{rating}</Text>
                        <View className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}>
                          <View className="h-full bg-yellow-400 rounded-full" style={{ width: `${rating === 5 ? 70 : rating === 4 ? 20 : rating === 3 ? 5 : 2}%` }} />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {[
                  { name: 'Sarah Jenkins', avatar: 'https://i.pravatar.cc/150?u=sarah', date: '2 weeks ago', text: 'This course completely changed my perspective. The instructor breaks down complex topics so well!', rating: 5 },
                  { name: 'Michael Chen', avatar: 'https://i.pravatar.cc/150?u=michael', date: '1 month ago', text: 'Very detailed and well structured. I just wish there were more practical exercises in the beginning.', rating: 4 },
                ].map((review, idx) => (
                  <View key={idx} className="mb-6 p-4 rounded-2xl border" style={{ backgroundColor: C.surface, borderColor: C.border + '66' }}>
                    <View className="flex-row items-center mb-3">
                      <Image source={{ uri: review.avatar }} className="w-10 h-10 rounded-full mr-3" cachePolicy="memory-disk" />
                      <View className="flex-1">
                        <Text style={{ color: C.text }} className="text-base font-bold">{review.name}</Text>
                        <View className="flex-row items-center mt-0.5">
                          <View className="flex-row mr-2">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} size={12} color={star <= review.rating ? "#FBBF24" : C.border} fill={star <= review.rating ? "#FBBF24" : "none"} />
                            ))}
                          </View>
                          <Text style={{ color: C.textMuted }} className="text-xs">{review.date}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={{ color: C.text + 'CC' }} className="text-[15px] leading-6">{review.text}</Text>
                  </View>
                ))}
                
                <TouchableOpacity className="w-full py-3 items-center rounded-xl border border-primary/30" onPress={() => analytics.logEvent('course_detail_see_all_reviews', { courseId: id as string })}>
                   <Text className="text-primary font-bold">See All Reviews</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Persistent Footer Action */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t px-6 pt-4"
        style={{ backgroundColor: C.surface, borderTopColor: C.border, paddingBottom: insets.bottom + 20, opacity: 0.97 }}
      >
        {isCompleted && (
          <TouchableOpacity
            activeOpacity={0.8}
            className="mb-3 h-14 rounded-2xl flex-row items-center justify-center border"
            style={{ backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF', borderColor: isDark ? 'rgba(99,102,241,0.3)' : '#C7D2FE' }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              analytics.logEvent('course_detail_certificate_viewed', { courseId: id as string, title: course?.title });
              setIsCertificateVisible(true);
            }}
          >
            <Trophy size={20} color={Colors.primary} className="mr-2" />
            <Text className="text-primary font-bold text-base">View Certificate</Text>
          </TouchableOpacity>
        )}
        
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

      <CertificateModal 
        visible={isCertificateVisible} 
        onClose={() => setIsCertificateVisible(false)} 
        onShare={handleShare} 
        courseTitle={course.title} 
      />

      <EnrollmentBottomSheet 
        bottomSheetRef={bottomSheetRef} 
        isEnrolled={isEnrolled} 
        courseTitle={course.title} 
        coursePrice={course.price} 
        onConfirmEnrollment={confirmEnrollment} 
        onUnenroll={handleUnenroll} 
        onGoAhead={handleGoAhead} 
      />
    </View>
  );
}