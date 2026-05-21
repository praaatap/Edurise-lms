import { analytics } from '@/core/services/analyticsService';
import { trackUserAction } from '@/core/services/sentryPerformance';
import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { CourseCard } from '@/features/courses/components/CourseCard';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SkeletonCard } from '@/shared/components/ui/SkeletonCard';
import { WalkthroughStep, WalkthroughTooltip } from '@/shared/components/ui/WalkthroughTooltip';
import { useScreenTracking } from '@/shared/hooks/useScreenTracking';
import { Course } from '@/shared/types';
import { storage } from '@/shared/utils/storage';
import { LegendList } from '@legendapp/list';
import { Image } from 'expo-image';
import { Href, router, useNavigation, useRouter } from 'expo-router';
import { BookOpen, Check, Compass, Flame, Sparkles } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORY_PILLS = ['All', 'Web Dev', 'Mobile App', 'AI & ML', 'Design', 'Cloud'];

const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    title: 'Daily Streak & Greet',
    description: 'Keep your daily learning streak alive by checking in and completing courses every single day!',
    icon: Flame,
    iconColor: '#F97316',
    targetKey: 'header',
    placement: 'bottom',
  },
  {
    title: 'Smart Categories',
    description: 'Easily navigate through Web Dev, Mobile, AI, Design, and Cloud courses with interactive pills.',
    icon: Compass,
    iconColor: '#3B82F6',
    targetKey: 'categories',
    placement: 'bottom',
  },
  {
    title: 'Instant AI Tutor',
    description: 'Stuck on a concept? Tap the green AI Tutor button to start a personalized learning chat at any time.',
    icon: Sparkles,
    iconColor: '#22C55E',
    targetKey: 'aiButton',
    placement: 'top',
  },
];

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

  useScreenTracking('Home');

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
    trackUserAction('home_refresh');
    analytics.logEvent('home_refresh');
    await refreshCourses();
    updateStreak();
    getAIRecommendations(['Technology', 'Design', 'Development']);
    setIsRefreshing(false);
  }, [refreshCourses, getAIRecommendations]);

  const handleCoursePress = useCallback((course: Course) => {
    trackUserAction('course_tapped', { courseId: course.id, source: 'home' });
    analytics.logEvent('course_tapped', { courseId: course.id, title: course.title, source: 'home' });
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
    enrolledCourses,
    completedCourses,
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
  const { C, isDark } = useTheme();
  const [activeCategory, setActiveCategory] = useState('All');

  // Walkthrough references and state
  const headerRef = useRef<View>(null);
  const categoriesRef = useRef<View>(null);
  const [targets, setTargets] = useState<Record<string, { x: number; y: number; width: number; height: number } | null>>({
    header: null,
    categories: null,
    aiButton: null,
  });

  const [walkthroughVisible, setWalkthroughVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const measureElements = useCallback(() => {
    if (headerRef.current) {
      headerRef.current.measureInWindow((x, y, width, height) => {
        if (width > 0) {
          setTargets((prev) => ({ ...prev, header: { x, y, width, height } }));
        }
      });
    }
    if (categoriesRef.current) {
      categoriesRef.current.measureInWindow((x, y, width, height) => {
        if (width > 0) {
          setTargets((prev) => ({ ...prev, categories: { x, y, width, height } }));
        }
      });
    }
  }, []);

  const checkWalkthrough = useCallback(async () => {
    const hasSeen = await storage.getItem('has_seen_walkthrough');
    if (!hasSeen) {
      setTimeout(() => {
        setWalkthroughVisible(true);
        measureElements();
      }, 800);
    } else {
      setWalkthroughVisible(false);
    }
  }, [measureElements]);

  // Pre-calculate AI button coordinate fallback since it has absolute layout
  useEffect(() => {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    setTargets((prev) => ({
      ...prev,
      aiButton: {
        x: screenWidth - 56 - 16,
        y: screenHeight - insets.bottom - 72 - 56,
        width: 56,
        height: 56,
      },
    }));
  }, [insets.bottom]);

  // Focus listener using react-navigation navigation listener
  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkWalkthrough();
    });
    checkWalkthrough();
    return unsubscribe;
  }, [navigation, checkWalkthrough]);

  const handleWalkthroughNext = useCallback(async () => {
    if (currentStep < WALKTHROUGH_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setTimeout(measureElements, 50);
    } else {
      await storage.setItem('has_seen_walkthrough', true);
      setWalkthroughVisible(false);
      setCurrentStep(0);
    }
  }, [currentStep, measureElements]);

  const handleWalkthroughBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setTimeout(measureElements, 50);
    }
  }, [currentStep, measureElements]);

  const handleWalkthroughSkip = useCallback(async () => {
    await storage.setItem('has_seen_walkthrough', true);
    setWalkthroughVisible(false);
    setCurrentStep(0);
  }, []);

  const bookmarkedSet = useMemo(() => new Set(bookmarks), [bookmarks]);
  const enrolledSet = useMemo(() => new Set(enrolledCourses), [enrolledCourses]);
  const completedSet = useMemo(() => new Set(completedCourses), [completedCourses]);

  const renderItem = useCallback(({ item }: { item: Course }) => (
    <CourseCard
      course={item}
      onPress={handleCoursePress}
      onToggleBookmark={toggleBookmark}
      isBookmarked={bookmarkedSet.has(item.id)}
      isEnrolled={enrolledSet.has(item.id)}
      isCompleted={completedSet.has(item.id)}
      compact
    />
  ), [handleCoursePress, toggleBookmark, bookmarkedSet, enrolledSet, completedSet]);

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
    <View className="mb-2" onLayout={measureElements}>
      {/* Greeting Header */}
      <View ref={headerRef} collapsable={false} className="mb-6 mt-4 flex-row justify-between items-center px-4">
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
                onPress={() => { analytics.logEvent('home_instructor_tapped', { instructorId: inst.id, name: inst.name }); router.push(`/instructor/${inst.id}` as Href); }}
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
                  isBookmarked={bookmarkedSet.has(course.id)}
                  isEnrolled={enrolledSet.has(course.id)}
                  isCompleted={completedSet.has(course.id)}
                  compact
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View className="mb-4 px-4 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-text dark:text-dark-text">All Courses</Text>
        <Text style={{ color: C.textMuted, fontSize: 13, fontWeight: '600' }}>
          {activeCategory === 'All' ? courses.length : courses.filter(c => c.category.toLowerCase().includes(activeCategory.toLowerCase())).length} courses
        </Text>
      </View>

      {/* Category filter pills */}
      <View ref={categoriesRef} collapsable={false}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 16 }}
        >
          {CATEGORY_PILLS.map((cat, i) => {
            const active = activeCategory === cat;
            return (
              <Animated.View key={cat} entering={FadeInDown.delay(i * 40).springify()}>
                <TouchableOpacity
                  onPress={() => setActiveCategory(cat)}
                  activeOpacity={0.75}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: active ? Colors.primary : (isDark ? 'rgba(255,255,255,0.07)' : '#F8FAFC'),
                    borderWidth: 1,
                    borderColor: active ? Colors.primary : (isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'),
                    shadowColor: active ? Colors.primary : '#000',
                    shadowOpacity: active ? 0.2 : 0,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                  }}
                >
                  <View className="flex-row items-center gap-2">
                    {active && <View className="h-2 w-2 rounded-full bg-white" />}
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: active ? '#fff' : C.textMuted,
                      letterSpacing: 0.2,
                    }}>
                      {cat}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>
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
    C.surfaceElevated,
    C.textMuted,
    activeCategory,
    isDark,
    measureElements,
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
    <View
      className="flex-1"
      style={{ backgroundColor: C.background }}
      onLayout={() => {
        setTimeout(measureElements, 250);
      }}
    >
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
            onPress={() => { analytics.logEvent('home_error_retry'); refreshCourses(); }}
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
            data={activeCategory === 'All' ? courses : courses.filter(c => c.category.toLowerCase().includes(activeCategory.toLowerCase()))}
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

      {/* Premium Onboarding Walkthrough Tooltip Overlay */}
      <WalkthroughTooltip
        visible={walkthroughVisible}
        steps={WALKTHROUGH_STEPS}
        currentStep={currentStep}
        targets={targets}
        onNext={handleWalkthroughNext}
        onBack={handleWalkthroughBack}
        onSkip={handleWalkthroughSkip}
      />
    </View>
  );
}
