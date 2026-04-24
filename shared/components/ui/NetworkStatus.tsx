import NetInfo from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function NetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // Small delay to avoid flashing on quick reconnects
      setTimeout(() => {
        setIsConnected(state.isConnected);
      }, 1000);
    });

    return () => unsubscribe();
  }, []);

  if (isConnected !== false) return null;

  return (
    <Animated.View
      entering={FadeInUp}
      exiting={FadeOutUp}
      className="absolute left-0 right-0 z-50 items-center justify-center bg-red-500 py-1 flex-row shadow-lg"
      style={{ top: insets.top }}
    >
      <WifiOff size={14} color="white" />
      <Text className="text-white text-xs font-bold ml-2">No Internet Connection</Text>
    </Animated.View>
  );
}
