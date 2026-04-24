import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

export const SkeletonCard = React.memo(() => {
  const opacity = useSharedValue(0.3);

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
    <Animated.View className="bg-surface rounded-2xl mb-4 overflow-hidden border border-border shadow-sm" style={animatedStyle}>
      <View className="h-40 bg-surface-elevated" />
      <View className="p-4">
        <View className="w-20 h-6 rounded-full bg-surface-elevated mb-3" />
        <View className="h-5 bg-surface-elevated rounded mb-2" />
        <View className="h-5 bg-surface-elevated rounded w-[70%] mb-4" />
        <View className="flex-row justify-between items-center border-t border-border pt-4">
          <View className="w-24 h-6 rounded-full bg-surface-elevated" />
          <View className="w-16 h-6 rounded bg-surface-elevated" />
        </View>
      </View>
    </Animated.View>
  );
});
