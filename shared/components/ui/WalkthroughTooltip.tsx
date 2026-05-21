import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';
import { LucideIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface WalkthroughStep {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  targetKey: 'header' | 'categories' | 'aiButton';
  placement: 'top' | 'bottom' | 'center';
}

interface WalkthroughTooltipProps {
  visible: boolean;
  steps: WalkthroughStep[];
  currentStep: number;
  targets: Record<
    string,
    { x: number; y: number; width: number; height: number } | null
  >;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function WalkthroughTooltip({
  visible,
  steps,
  currentStep,
  targets,
  onNext,
  onBack,
  onSkip,
}: WalkthroughTooltipProps) {
  const { C, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Morphing spotlight coordinates
  const spotlightX = useSharedValue(0);
  const spotlightY = useSharedValue(0);
  const spotlightW = useSharedValue(0);
  const spotlightH = useSharedValue(0);
  const spotlightR = useSharedValue(0);

  // Pulse animation for spotlight glowing border
  const borderPulse = useSharedValue(1);

  // Fade in walkthrough
  const opacity = useSharedValue(0);

  const step = steps[currentStep];

  // Set up repeating pulse effect
  useEffect(() => {
    borderPulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, [borderPulse]);

  // Handle step transitions and coordinate updates
  useEffect(() => {
    if (!visible) {
      opacity.value = withTiming(0, { duration: 300 });
      return;
    }

    opacity.value = withTiming(1, { duration: 300 });

    if (!step) return;

    // Get current step's target coordinates, fallback to defaults if not measured yet
    const targetCoords = targets[step.targetKey];
    let tx = 0,
      ty = 0,
      tw = 0,
      th = 0,
      tr = 12;

    if (targetCoords) {
      tx = targetCoords.x;
      ty = targetCoords.y;
      tw = targetCoords.width;
      th = targetCoords.height;
      if (step.targetKey === 'aiButton') {
        tr = 28; // round AI tutor button
      } else if (step.targetKey === 'categories') {
        tr = 20;
      } else {
        tr = 16;
      }
    } else {
      // Precise Fallbacks in case measurements aren't ready
      if (step.targetKey === 'header') {
        tx = 16;
        ty = insets.top + 12;
        tw = SCREEN_WIDTH - 32;
        th = 76;
        tr = 16;
      } else if (step.targetKey === 'categories') {
        tx = 0;
        ty = SCREEN_HEIGHT * 0.58;
        tw = SCREEN_WIDTH;
        th = 68;
        tr = 0;
      } else if (step.targetKey === 'aiButton') {
        tx = SCREEN_WIDTH - 76;
        ty = SCREEN_HEIGHT - insets.bottom - 132;
        tw = 60;
        th = 60;
        tr = 30;
      }
    }

    // Smooth spring morphing for spotlight transition
    const springConfig = {
      damping: 18,
      stiffness: 110,
      mass: 0.8,
    };

    spotlightX.value = withSpring(tx, springConfig);
    spotlightY.value = withSpring(ty, springConfig);
    spotlightW.value = withSpring(tw, springConfig);
    spotlightH.value = withSpring(th, springConfig);
    spotlightR.value = withSpring(tr, springConfig);
  }, [visible, currentStep, targets, step, insets]);

  // Background overlay styles (Four-Block Cutout)
  const animatedTopBg = useAnimatedStyle(() => ({
    top: 0,
    left: 0,
    right: 0,
    height: spotlightY.value,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    position: 'absolute',
  }));

  const animatedBottomBg = useAnimatedStyle(() => ({
    top: spotlightY.value + spotlightH.value,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    position: 'absolute',
  }));

  const animatedLeftBg = useAnimatedStyle(() => ({
    top: spotlightY.value,
    height: spotlightH.value,
    left: 0,
    width: spotlightX.value,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    position: 'absolute',
  }));

  const animatedRightBg = useAnimatedStyle(() => ({
    top: spotlightY.value,
    height: spotlightH.value,
    left: spotlightX.value + spotlightW.value,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    position: 'absolute',
  }));

  // Morphing glow border outline style
  const animatedSpotlightBorder = useAnimatedStyle(() => ({
    left: spotlightX.value - 2,
    top: spotlightY.value - 2,
    width: spotlightW.value + 4,
    height: spotlightH.value + 4,
    borderRadius: spotlightR.value,
    transform: [{ scale: borderPulse.value }],
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  }));

  const containerOpacityStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible || !step) return null;

  // Determine tooltip placement dynamically based on spotlight y position
  const targetCoords = targets[step.targetKey];
  const spotlightTop = targetCoords ? targetCoords.y : spotlightY.value;
  const spotlightHeight = targetCoords ? targetCoords.height : spotlightH.value;

  const showTooltipBelow = spotlightTop + spotlightHeight < SCREEN_HEIGHT * 0.52;

  // Calculate top offset for speech bubble
  let tooltipTop = 0;
  if (showTooltipBelow) {
    tooltipTop = spotlightTop + spotlightHeight + 14;
  } else {
    // If floating button at bottom, position tooltip nicely above it
    tooltipTop = spotlightTop - 180;
  }

  // Ensure tooltips don't clip offscreen vertically
  if (tooltipTop < insets.top + 10) {
    tooltipTop = insets.top + 10;
  }

  const StepIcon = step.icon;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, { zIndex: 99999 }, containerOpacityStyle]}
      pointerEvents="box-none"
    >
      {/* Background Masks */}
      <Animated.View style={animatedTopBg} pointerEvents="auto" />
      <Animated.View style={animatedBottomBg} pointerEvents="auto" />
      <Animated.View style={animatedLeftBg} pointerEvents="auto" />
      <Animated.View style={animatedRightBg} pointerEvents="auto" />

      {/* Interactive blocker for the highlighted target hole */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          left: targetCoords?.x || spotlightX.value,
          top: targetCoords?.y || spotlightY.value,
          width: targetCoords?.width || spotlightW.value,
          height: targetCoords?.height || spotlightH.value,
        }}
        activeOpacity={1}
        onPress={onNext}
      />

      {/* Glowing spotlight border */}
      <Animated.View style={animatedSpotlightBorder} pointerEvents="none" />

      {/* Premium Glassmorphic Tooltip Card */}
      <View
        style={[
          styles.tooltipCard,
          {
            top: tooltipTop,
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderColor: isDark ? '#334155' : '#E2E8F0',
            shadowColor: '#0F172A',
          },
        ]}
      >
        {/* Tooltip speech-bubble arrow pointer */}
        <View
          style={[
            styles.arrow,
            showTooltipBelow ? styles.arrowTop : styles.arrowBottom,
            {
              borderBottomColor: isDark ? '#1E293B' : '#FFFFFF',
              borderTopColor: isDark ? '#1E293B' : '#FFFFFF',
              left: step.targetKey === 'aiButton' ? SCREEN_WIDTH - 64 : 36,
            },
          ]}
        />

        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: step.iconColor + '15' },
            ]}
          >
            <StepIcon size={20} color={step.iconColor} />
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: isDark ? '#334155' : '#F1F5F9' },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
            >
              {currentStep + 1} of {steps.length}
            </Text>
          </View>
        </View>

        <Text style={[styles.title, { color: C.text }]}>{step.title}</Text>
        <Text style={[styles.description, { color: C.textMuted }]}>
          {step.description}
        </Text>

        {/* Progress indicator dots */}
        <View style={styles.footerRow}>
          <View style={styles.dotsContainer}>
            {steps.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i === currentStep
                        ? Colors.primary
                        : isDark
                          ? '#475569'
                          : '#CBD5E1',
                    width: i === currentStep ? 14 : 6,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.actionsContainer}>
            {currentStep > 0 ? (
              <TouchableOpacity
                onPress={onBack}
                style={[
                  styles.btnBack,
                  { borderColor: isDark ? '#475569' : '#CBD5E1' },
                ]}
              >
                <Text style={[styles.btnBackText, { color: C.text }]}>
                  Back
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={onSkip} style={styles.btnSkip}>
                <Text
                  style={[
                    styles.btnSkipText,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  Skip
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={onNext}
              activeOpacity={0.8}
              style={[styles.btnNext, { backgroundColor: Colors.primary }]}
            >
              <Text style={styles.btnNextText}>
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tooltipCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    elevation: 12,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowTop: {
    top: -10,
    borderBottomWidth: 10,
  },
  arrowBottom: {
    bottom: -10,
    borderTopWidth: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnSkip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnSkipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  btnBack: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnBackText: {
    fontSize: 13,
    fontWeight: '700',
  },
  btnNext: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  btnNextText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
