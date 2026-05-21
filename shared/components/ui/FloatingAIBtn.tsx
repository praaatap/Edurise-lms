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
  const lift = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
    lift.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1600 }),
        withTiming(0, { duration: 1600 })
      ),
      -1,
      true
    );
  }, [lift, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          bottom: insets.bottom + 72,
          right: 16,
          zIndex: 50,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/ai-tutor' as any)}
        className="w-14 h-14 rounded-full items-center justify-center border"
        style={{
          backgroundColor: '#22C55E',
          borderColor: 'rgba(255,255,255,0.95)',
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        }}
      >
        <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
          <BotMessageSquare size={20} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
