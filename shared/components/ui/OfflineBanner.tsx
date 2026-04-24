import React from 'react';
import { Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useNetworkStatus } from '../../utils/network';

export const OfflineBanner = () => {
  const { isConnected } = useNetworkStatus();

  if (isConnected) return null;

  return (
    <Animated.View 
      entering={FadeIn} 
      exiting={FadeOut} 
      className="bg-error p-2 items-center justify-center"
    >
      <Text className="text-white text-sm font-medium">
        No internet connection. Showing cached data.
      </Text>
    </Animated.View>
  );
};
