import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/core/theme/useTheme';

interface InAppNotificationBannerProps {
  visible: boolean;
  title: string;
  message: string;
  onPress?: () => void;
  onDismiss: () => void;
}

export function InAppNotificationBanner({
  visible,
  title,
  message,
  onPress,
  onDismiss,
}: InAppNotificationBannerProps) {
  const { C, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOutUp.duration(180)}
      className="absolute left-0 right-0 z-[1001] px-4"
      style={{ top: insets.top + 10 }}
    >
      <BlurView
        intensity={isDark ? 80 : 95}
        tint={isDark ? 'dark' : 'light'}
        className="overflow-hidden rounded-2xl border"
        style={{ borderColor: C.border }}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onPress}
          className="flex-row items-start gap-3 px-4 py-3"
          style={{ backgroundColor: isDark ? 'rgba(17,24,39,0.75)' : 'rgba(255,255,255,0.92)' }}
        >
          <View
            className="mt-0.5 h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: isDark ? 'rgba(72,199,142,0.18)' : 'rgba(72,199,142,0.14)' }}
          >
            <Ionicons name="notifications" size={18} color={C.primary} />
          </View>

          <View className="flex-1">
            <Text className="text-[11px] font-bold uppercase tracking-[1.4px]" style={{ color: C.primary }}>
              In-app notification
            </Text>
            <Text className="mt-0.5 text-[14px] font-bold" style={{ color: C.text }} numberOfLines={1}>
              {title}
            </Text>
            <Text className="mt-1 text-[12px] leading-5" style={{ color: C.textMuted }} numberOfLines={2}>
              {message}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onDismiss}
            hitSlop={10}
            className="ml-2 h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)' }}
          >
            <Ionicons name="close" size={16} color={C.textMuted} />
          </TouchableOpacity>
        </TouchableOpacity>
      </BlurView>
    </Animated.View>
  );
}