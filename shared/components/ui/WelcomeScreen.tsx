import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  Easing,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';

interface WelcomeScreenProps {
  username: string;
  onComplete: () => void;
}

export function WelcomeScreen({ username, onComplete }: WelcomeScreenProps) {
  const circleScale = useSharedValue(0);
  const circleOpacity = useSharedValue(0);
  const tickProgress = useSharedValue(0);
  const tickScale = useSharedValue(0.5);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(20);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    // Circle appears
    circleOpacity.value = withTiming(1, { duration: 300 });
    circleScale.value = withSpring(1, { damping: 12, stiffness: 150 });

    // Tick draws in
    tickProgress.value = withDelay(400, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    tickScale.value = withDelay(400, withSequence(
      withSpring(1.2, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 150 }),
    ));

    // Welcome text
    textOpacity.value = withDelay(900, withTiming(1, { duration: 400 }));
    textTranslateY.value = withDelay(900, withSpring(0, { damping: 12 }));

    // Subtitle
    subtitleOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));
    subtitleTranslateY.value = withDelay(1200, withSpring(0, { damping: 12 }));

    // Fade out and complete
    const timeout = setTimeout(() => {
      containerOpacity.value = withTiming(0, { duration: 400 }, (finished) => {
        if (finished) runOnJS(onComplete)();
      });
    }, 2800);

    return () => clearTimeout(timeout);
  }, []);

  const circleStyle = useAnimatedStyle(() => ({
    opacity: circleOpacity.value,
    transform: [{ scale: circleScale.value }],
  }));

  const tickStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tickScale.value }],
    opacity: interpolate(tickProgress.value, [0, 0.1, 1], [0, 1, 1]),
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const firstName = username?.split(' ')[0] || 'Explorer';

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Animated.View style={[styles.circleOuter, circleStyle]}>
          <View style={styles.circleInner}>
            <Animated.View style={tickStyle}>
              <View style={styles.tickContainer}>
                <View style={styles.tickShort} />
                <View style={styles.tickLong} />
              </View>
            </Animated.View>
          </View>
        </Animated.View>

        <Animated.View style={textStyle}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
        </Animated.View>

        <Animated.View style={subtitleStyle}>
          <Text style={styles.nameText}>{firstName}</Text>
          <Text style={styles.subtitleText}>Ready to continue learning?</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#48C78E',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  content: {
    alignItems: 'center',
    gap: 24,
  },
  circleOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickShort: {
    position: 'absolute',
    width: 4,
    height: 16,
    backgroundColor: '#48C78E',
    borderRadius: 2,
    transform: [{ rotate: '-45deg' }],
    left: 10,
    top: 22,
  },
  tickLong: {
    position: 'absolute',
    width: 4,
    height: 28,
    backgroundColor: '#48C78E',
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
    left: 22,
    top: 10,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 6,
  },
});
