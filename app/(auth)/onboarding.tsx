import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Dimensions,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/core/theme/useTheme';
import { useScreenTracking } from '@/shared/hooks/useScreenTracking';
import { Compass, Sparkles, Trophy, BookOpen, ChevronRight } from 'lucide-react-native';


const { width } = Dimensions.get('window');

const slides = [
  {
    title: 'Learn from Experts',
    subtitle: 'COURSES & PATHWAYS',
    description: 'Gain access to premium, structured learning paths with high-quality videos, downloadable resources, and step-by-step guidance.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    icon: Compass,
    accent: '#22C55E',
  },
  {
    title: 'Meet Your AI Tutor',
    subtitle: '24/7 PERSONAL ASSISTANT',
    description: 'Stuck on a difficult concept? Chat with our smart AI Tutor. Get instant explanations, take practice quizzes, and receive personalized feedback.',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    icon: Sparkles,
    accent: '#FB923C',
  },
  {
    title: 'Track Achievements',
    subtitle: 'BADGES & CERTIFICATES',
    description: 'Monitor your progress, save bookmarks, complete milestone challenges, and earn official certificates to share with the world.',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    icon: Trophy,
    accent: '#3B82F6',
  },
  {
    title: 'Start Learning Today',
    subtitle: 'WELCOME TO EDURISE',
    description: 'Join a global community of modern learners. Create your profile, enroll in premium courses, and start building real-world skills.',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    icon: BookOpen,
    accent: '#22C55E',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { C, isDark } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useScreenTracking('Onboarding');

  const onScroll = useCallback((event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    if (index !== activeIndex && index >= 0 && index < slides.length) {
      setActiveIndex(index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [activeIndex]);

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
  };

  const handleSkip = () => {
    flatListRef.current?.scrollToIndex({
      index: slides.length - 1,
      animated: true,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const handleGetStarted = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.push('/(auth)/register');
  };

  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/(auth)/login');
  };

  const renderSlide = ({ item }: { item: typeof slides[0] }) => {
    const SlideIcon = item.icon;
    return (
      <View style={[styles.slide, { width }]}>
        {/* Top Image Section */}
        <View style={styles.imageContainer}>
          <Image
            source={item.image}
            style={styles.image}
            contentFit="cover"
            cachePolicy="disk"
            transition={400}
          />
          <View
            style={[
              styles.imageOverlay,
              { backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.25)' },
            ]}
          />
          {/* Feature Badge */}
          <View style={styles.badgeContainer}>
            <View style={[styles.iconWrapper, { backgroundColor: item.accent }]}>
              <SlideIcon size={20} color="white" />
            </View>
            <Text style={styles.badgeText}>{item.subtitle}</Text>
          </View>
        </View>

        {/* Bottom Text Card */}
        <View
          style={[
            styles.textCard,
            { backgroundColor: C.background },
          ]}
        >
          <Text style={[styles.title, { color: C.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.description, { color: C.textMuted }]}>
            {item.description}
          </Text>
        </View>
      </View>
    );
  };

  const isLastSlide = activeIndex === slides.length - 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Skip Button - Only show when not on the last slide */}
      {!isLastSlide && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={[styles.skipText, { color: C.textMuted }]}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Horizontal FlatList */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, index) => index.toString()}
        style={styles.flatList}
      />

      {/* Footer Controls Container */}
      <View style={styles.footer}>
        {/* Dynamic Dots Indicator */}
        <View style={styles.indicatorContainer}>
          {slides.map((_, index) => {
            const isActive = index === activeIndex;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  isActive
                    ? [styles.activeDot, { backgroundColor: C.primary }]
                    : [styles.inactiveDot, { backgroundColor: isDark ? '#334155' : '#CBD5E1' }],
                ]}
              />
            );
          })}
        </View>

        {/* Call to Actions */}
        <View style={styles.actionContainer}>
          {isLastSlide ? (
            <View style={styles.buttonStack}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: C.primary }]}
                onPress={handleGetStarted}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Create Account</Text>
                <ChevronRight size={18} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: C.border }]}
                onPress={handleSignIn}
                activeOpacity={0.8}
              >
                <Text style={[styles.secondaryButtonText, { color: C.text }]}>
                  Sign In to existing account
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: C.primary }]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>Continue</Text>
              <ChevronRight size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    right: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
  },
  imageContainer: {
    flex: 55, // 55% of height
    position: 'relative',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingRight: 16,
    paddingLeft: 6,
    paddingVertical: 6,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  badgeText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  textCard: {
    flex: 45, // 45% of height
    paddingHorizontal: 28,
    paddingTop: 36,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.8,
    lineHeight: 38,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    gap: 24,
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 24,
  },
  inactiveDot: {
    width: 8,
  },
  actionContainer: {
    minHeight: 56,
    justifyContent: 'center',
  },
  nextButton: {
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonStack: {
    gap: 12,
  },
  primaryButton: {
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
