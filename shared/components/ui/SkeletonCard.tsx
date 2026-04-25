import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useTheme } from '@/core/theme/useTheme';

export const SkeletonCard = React.memo(() => {
  const opacity = useSharedValue(0.3);
  const { C } = useTheme();

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      className="rounded-2xl mb-4 overflow-hidden border border-border dark:border-dark-border shadow-sm"
      style={[animatedStyle, { backgroundColor: C.surface }]}
    >
      <View className="h-40" style={{ backgroundColor: C.surfaceElevated }} />
      <View className="p-4">
        <View className="w-20 h-6 rounded-full mb-3" style={{ backgroundColor: C.surfaceElevated }} />
        <View className="h-5 rounded mb-2" style={{ backgroundColor: C.surfaceElevated }} />
        <View className="h-5 rounded w-[70%] mb-4" style={{ backgroundColor: C.surfaceElevated }} />
        <View
          className="flex-row justify-between items-center pt-4"
          style={{ borderTopWidth: 1, borderTopColor: C.border }}
        >
          <View className="w-24 h-6 rounded-full" style={{ backgroundColor: C.surfaceElevated }} />
          <View className="w-16 h-6 rounded" style={{ backgroundColor: C.surfaceElevated }} />
        </View>
      </View>
    </Animated.View>
  );
});
