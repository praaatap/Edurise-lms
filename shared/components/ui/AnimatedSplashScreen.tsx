import { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay, 
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
  onAnimationComplete: () => void;
}

export function AnimatedSplashScreen({ onAnimationComplete }: AnimatedSplashScreenProps) {
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const logoTranslateX = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateX = useSharedValue(20);

  useEffect(() => {
    // Logo entrance
    logoScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.5)) });
    logoOpacity.value = withTiming(1, { duration: 600 });

    // Transition to left and show text
    logoTranslateX.value = withDelay(
      1200,
      withTiming(-85, { duration: 800, easing: Easing.inOut(Easing.exp) })
    );

    textOpacity.value = withDelay(
      1500,
      withTiming(1, { duration: 600 })
    );
    
    textTranslateX.value = withDelay(
      1500,
      withTiming(0, { duration: 800, easing: Easing.out(Easing.exp) })
    );

    // Final fade out and complete
    const completeAnimation = () => {
      onAnimationComplete();
    };

    setTimeout(() => {
      logoOpacity.value = withTiming(0, { duration: 400 });
      textOpacity.value = withTiming(0, { duration: 400 }, (finished) => {
        if (finished) {
          runOnJS(completeAnimation)();
        }
      });
    }, 3500);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value },
      { translateX: logoTranslateX.value }
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateX: textTranslateX.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <Image
            source={require('../../../assets/images/appicon.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>
        
        <Animated.View style={[styles.textContainer, textStyle]}>
          <Text style={styles.appName}>Edurise</Text>
          <Text style={styles.appSub}>LMS</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#48C78E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logoContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // Ensures the logo's rounded corners are respected
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24, // Matches the smooth rounded corners of the app icon
  },
  textContainer: {
    position: 'absolute',
    left: width / 2 - 15,
  },
  appName: {
    fontSize: 42,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -1.5,
  },
  appSub: {
    fontSize: 24,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    marginTop: -8,
    letterSpacing: 4,
  },
});
