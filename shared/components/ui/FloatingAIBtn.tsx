import { useRouter } from 'expo-router';
import { BotMessageSquare } from 'lucide-react-native';
import { useEffect } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function FloatingAIBtn() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          bottom: insets.bottom + 80, // Above the tab bar
          right: 20,
          zIndex: 50,
        },
      ]}
    >
      <TouchableOpacity
        className="w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg shadow-primary/40 border-2 border-white"
        onPress={() => router.push('/ai-tutor' as any)}
        activeOpacity={0.8}
      >
        <BotMessageSquare size={26} color="white" />
        {/* Unread indicator dot */}
        <View className="absolute top-0 right-0 w-3.5 h-3.5 bg-accent rounded-full border-2 border-white" />
      </TouchableOpacity>
    </Animated.View>
  );
}
