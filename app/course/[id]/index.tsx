import { Colors } from '@/core/theme/colors';
import { useCourseStore } from '@/features/courses/store/courseStore';
import {
  clearCourseReminderNotification,
  scheduleCourseReengagementReminder,
} from '@/features/notifications/services/notificationService';
import { Badge } from '@/shared/components/ui/Badge';
import { Card } from '@/shared/components/ui/Card';
import { CustomDialog } from '@/shared/components/ui/CustomDialog';
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
  Download,
  Settings2,
  Share2,
  Star,
  Trophy,
} from 'lucide-react-native';
import { authenticateBiometric } from '@/shared/utils/security';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, ScrollView, Share, StatusBar, Text, TouchableOpacity, UIManager, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { analytics } from '@/core/services/analyticsService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AnimatedButton = Animated.createAnimatedComponent(TouchableOpacity);

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getCourseById, bookmarks, toggleBookmark, enrolledCourses, enrollCourse, unenrollCourse, completedCourses } = useCourseStore();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['45%'], []);
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

  useEffect(() => {
    void clearCourseReminderNotification();

    return () => {
      if (!course) return;
      void scheduleCourseReengagementReminder(course.id, course.title, 60 * 60);
    };
  }, [course]);

  useEffect(() => {
    if (course) {
      analytics.logEvent('course_view', { courseId: course.id, title: course.title });
    }
  }, [course?.id]);

  const btnScale = useSharedValue(1);
  const animatedBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handleMainActionPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    bottomSheetRef.current?.expand();
  }, []);

  const confirmEnrollment = useCallback(async () => {
    const isAuthed = await authenticateBiometric(`Enroll in ${course?.title}`);
    
    if (!isAuthed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    btnScale.value = withSequence(withSpring(0.95), withSpring(1.05), withSpring(1));

    enrollCourse(id as string);
    bottomSheetRef.current?.close();
  }, [id, enrollCourse, course]);

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

        <View className="flex-row gap-3">
          <TouchableOpacity
            className="bg-white/90 border border-border w-11 h-11 rounded-full items-center justify-center shadow-lg"
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              await Share.share({
                message: `Master ${course.title} on Edurise LMS! Check it out: https://edurise.local/course/${course.id}`,
              });
            }}
          >
            <Share2 size={22} color={Colors.text} />
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

          <View className="flex-row px-2 mt-4 mb-4 border-b border-border/50">
            {(['overview', 'curriculum', 'reviews'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab(tab);
                }}
                className={`mr-6 pb-3 ${activeTab === tab ? 'border-b-2 border-primary' : ''}`}
              >
                <Text
                  className={`text-base font-bold capitalize ${
                    activeTab === tab ? 'text-primary' : 'text-text-muted'
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

                <Text className="text-lg font-bold text-text mb-3">About this course</Text>
                <Text className="text-[15px] text-text/70 leading-6" numberOfLines={isExpanded ? undefined : 4}>
                  {course.description}
                </Text>
                <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} className="mt-2 mb-6">
                  <Text className="text-primary font-bold">{isExpanded ? 'Show Less' : 'Read Full Description'}</Text>
                </TouchableOpacity>

                <Text className="text-lg font-bold text-text mb-3">Features</Text>
                <View className="flex-row flex-wrap gap-3 mb-4">
                  {['Certificate of completion', 'Full lifetime access', 'Access on mobile', 'Quizzes & Assignments'].map((feature, i) => (
                    <View key={i} className="flex-row items-center w-full mb-1">
                      <CheckCircle2 size={16} color={Colors.primary} />
                      <Text className="ml-2 text-sm text-text/80">{feature}</Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {activeTab === 'curriculum' && (
              <Animated.View entering={FadeIn.duration(300)}>
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-lg font-bold text-text">Syllabus</Text>
                  <TouchableOpacity 
                    className="flex-row items-center bg-gray-100 px-3 py-1.5 rounded-full"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setDialogConfig({
                        visible: true,
                        title: 'Download Started',
                        message: 'The entire course is being prepared for offline use. You will be notified once it is ready.',
                        confirmText: 'Awesome',
                        type: 'success'
                      });
                    }}
                  >
                    <Download size={14} color={Colors.text} className="mr-1.5" />
                    <Text className="text-xs font-black text-text uppercase">Download All</Text>
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
                          <View className={`w-7 h-7 rounded-full items-center justify-center z-10 ${module.done ? 'bg-success' : 'bg-surface border-2 border-border'}`}>
                            {module.done ? <CheckCircle2 size={16} color="white" /> : <Text className="text-xs font-bold text-text-muted">{index + 1}</Text>}
                          </View>
                          {index !== arr.length - 1 && (
                            <View className={`w-0.5 flex-1 -my-1 ${module.done ? 'bg-success' : 'bg-border'}`} />
                          )}
                        </View>
                        <View className="flex-1 pb-6 pt-0.5 border-b border-border/30 mb-2">
                          <Text className="text-base font-bold text-text">{module.title}</Text>
                          <View className="flex-row items-center mt-1.5 justify-between">
                            <View className="flex-row items-center">
                              <CirclePlay size={14} color={Colors.primary} />
                              <Text className="text-sm text-text-muted ml-1.5">{module.duration} • Video</Text>
                            </View>
                            {module.done && <Text className="text-xs font-bold text-success uppercase">Done</Text>}
                          </View>
                        </View>
                      </TouchableOpacity>
                      
                      <View className="ml-4 justify-center pb-8">
                        <TouchableOpacity 
                          className="bg-indigo-50 w-10 h-10 rounded-full items-center justify-center border border-indigo-100"
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                    <Text className="text-4xl font-extrabold text-text">{course.rating.toFixed(1)}</Text>
                    <View className="flex-row items-center mt-1">
                      {[1, 2, 3, 4, 5].map(star => (
                         <Star key={star} size={16} color="#FBBF24" fill="#FBBF24" />
                      ))}
                    </View>
                    <Text className="text-sm font-medium text-text-muted mt-1">Based on {course.reviewsCount || '1.2k'} reviews</Text>
                  </View>
                  <View className="items-end gap-1">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <View key={rating} className="flex-row items-center">
                        <Text className="text-xs font-bold text-text-muted mr-2">{rating}</Text>
                        <View className="w-24 h-2 bg-border rounded-full overflow-hidden">
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
                  <View key={idx} className="mb-6 p-4 bg-surface rounded-2xl border border-border/40">
                    <View className="flex-row items-center mb-3">
                      <Image source={{ uri: review.avatar }} className="w-10 h-10 rounded-full mr-3" />
                      <View className="flex-1">
                        <Text className="text-base font-bold text-text">{review.name}</Text>
                        <View className="flex-row items-center mt-0.5">
                          <View className="flex-row mr-2">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} size={12} color={star <= review.rating ? "#FBBF24" : "#E2E8F0"} fill={star <= review.rating ? "#FBBF24" : "none"} />
                            ))}
                          </View>
                          <Text className="text-xs text-text-muted">{review.date}</Text>
                        </View>
                      </View>
                    </View>
                    <Text className="text-[15px] text-text/80 leading-6">{review.text}</Text>
                  </View>
                ))}
                
                <TouchableOpacity className="w-full py-3 items-center border border-primary/30 rounded-xl">
                   <Text className="text-primary font-bold">See All Reviews</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Persistent Footer Action */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white/95 border-t border-border px-6 pt-4"
        style={{ paddingBottom: insets.bottom + 20 }}
      >
        {isCompleted && (
          <TouchableOpacity
            activeOpacity={0.8}
            className="mb-3 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex-row items-center justify-center"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

      {/* Certificate Modal */}
      <Modal
        visible={isCertificateVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsCertificateVisible(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center p-6">
          <Animated.View 
            entering={FadeIn.duration(400)}
            className="bg-white w-full rounded-[40px] overflow-hidden shadow-2xl"
          >
            {/* Certificate Design */}
            <View className="p-8 items-center border-[12px] border-indigo-50 m-2 rounded-[32px]">
              <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-6">
                <Trophy size={40} color={Colors.primary} />
              </View>
              
              <Text className="text-[10px] font-black text-primary uppercase tracking-[4px] mb-2">Certificate of Achievement</Text>
              <Text className="text-xs text-text-muted mb-6 uppercase tracking-widest">This is to certify that</Text>
              
              <Text className="text-3xl font-black text-text text-center mb-2 italic">Student Name</Text>
              <View className="h-0.5 bg-border w-40 mb-6" />
              
              <Text className="text-sm text-text-muted text-center mb-8 px-4">
                has successfully completed the professional course
                <Text className="font-bold text-text"> {course.title} </Text>
                demonstrating mastery in the required skills and concepts.
              </Text>
              
              <View className="flex-row justify-between w-full mt-4 px-4">
                <View className="items-center">
                  <View className="h-[1px] bg-border w-24 mb-2" />
                  <Text className="text-[10px] font-bold text-text-muted uppercase">Instructor</Text>
                </View>
                <View className="items-center">
                  <View className="h-[1px] bg-border w-24 mb-2" />
                  <Text className="text-[10px] font-bold text-text-muted uppercase">Date</Text>
                </View>
              </View>
            </View>

            <View className="flex-row p-6 bg-gray-50 border-t border-border">
              <TouchableOpacity 
                className="flex-1 bg-white border border-border h-14 rounded-2xl items-center justify-center mr-3"
                onPress={() => setIsCertificateVisible(false)}
              >
                <Text className="font-bold text-text">Close</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 bg-primary h-14 rounded-2xl items-center justify-center flex-row"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDialogConfig({
                    visible: true,
                    title: 'Sharing Certificate',
                    message: 'The official certificate PDF is being generated for sharing. This might take a moment.',
                    confirmText: 'Got it',
                    type: 'default'
                  });
                }}
              >
                <Share2 size={20} color="white" className="mr-2" />
                <Text className="font-bold text-white">Share</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

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