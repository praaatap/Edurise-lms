import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useNetworkStatus } from '../../utils/network';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const OfflineBanner = () => {
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();

  if (isConnected) return null;

  return (
    <Animated.View 
      entering={FadeInUp} 
      exiting={FadeOutUp} 
      className="absolute top-0 left-0 right-0 z-[1000] px-4"
      style={{ paddingTop: insets.top + 10 }}
    >
      <BlurView intensity={90} tint="dark" className="rounded-2xl overflow-hidden border border-white/20">
        <View className="flex-row items-center justify-between px-4 py-3 bg-red-500/10">
          <View className="flex-row items-center flex-1">
            <View className="w-8 h-8 rounded-full bg-red-500 items-center justify-center mr-3 shadow-sm shadow-red-500/40">
              <Ionicons name="cloud-offline" size={16} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-[13px] font-bold">You're Offline</Text>
              <Text className="text-white/70 text-[11px]">Using cached learning data</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
            onPress={() => {/* Could trigger a refresh check */}}
          >
            <Text className="text-white text-[10px] font-bold uppercase tracking-wider">Retry</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Animated.View>
  );
};
