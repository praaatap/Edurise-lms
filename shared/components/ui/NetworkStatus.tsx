import NetInfo from '@react-native-community/netinfo';
import { WifiOff, Wifi } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function NetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [showReconnected, setShowReconnected] = useState(false);
  const wasOffline = useRef(false);
  const insets = useSafeAreaInsets();
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? true;

      setIsConnected(prev => {
        // Was offline, now online → show reconnected toast
        if (prev === false && connected === true) {
          wasOffline.current = true;
          setShowReconnected(true);
          // Auto-hide reconnected banner after 2.5s
          if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
          reconnectTimer.current = setTimeout(() => setShowReconnected(false), 2500);
        }
        return connected;
      });
    });

    return () => {
      unsubscribe();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, []);

  // Don't render anything until first state is known or if fully connected and never disconnected
  if (isConnected === null) return null;
  if (isConnected === true && !showReconnected) return null;

  if (showReconnected && isConnected === true) {
    return (
      <Animated.View
        entering={FadeInDown.springify()}
        exiting={FadeOutUp.duration(300)}
        className="absolute left-4 right-4 z-50 items-center justify-center bg-green-500 py-2.5 flex-row rounded-2xl shadow-lg"
        style={{ top: insets.top + 8 }}
      >
        <Wifi size={14} color="white" />
        <Text className="text-white text-xs font-bold ml-2">Back Online ✓</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.springify()}
      exiting={FadeOutUp.duration(200)}
      className="absolute left-0 right-0 z-50 items-center justify-center bg-red-500 py-2.5 flex-row shadow-lg"
      style={{ top: insets.top }}
    >
      <WifiOff size={14} color="white" />
      <Text className="text-white text-xs font-bold ml-2">No Internet Connection</Text>
    </Animated.View>
  );
}
