import { analytics } from '@/core/services/analyticsService';
import { clarityService } from '@/core/services/clarityService';
import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';
import { APP_ICONS, AppIconName, useAppIconStore } from '@/features/settings/store/appIconStore';
import { useScreenTracking } from '@/shared/hooks/useScreenTracking';
import { setAlternateAppIcon } from 'expo-alternate-app-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, RefreshCw, ShieldAlert } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Map icon name → local PNG asset (keys match PascalCase plugin names)
const ICON_IMAGES: Record<AppIconName, any> = {
  default: require('@/assets/images/appicon.png'),
  Dark:    require('@/assets/images/app-icons/icon-dark.png'),
  Green:   require('@/assets/images/app-icons/icon-green.png'),
  Blue:    require('@/assets/images/app-icons/icon-blue.png'),
  Purple:  require('@/assets/images/app-icons/icon-purple.png'),
  Minimal: require('@/assets/images/app-icons/icon-minimal.png'),
};

export default function AppIconScreen() {
  const { C, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedIcon, setSelectedIcon } = useAppIconStore();
  const [isApplying, setIsApplying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useScreenTracking('AppIconSettings');

  const handleIconSelect = async (iconName: AppIconName) => {
    if (iconName === selectedIcon || isApplying) return;

    setErrorMessage(null);
    setIsApplying(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // null resets to default; PascalCase name selects alternate
      await setAlternateAppIcon(iconName === 'default' ? null : iconName);

      setSelectedIcon(iconName);
      clarityService.logEvent('app_icon_changed', { icon: iconName });
      analytics.logEvent('app_icon_changed', { icon: iconName });
    } catch (error: any) {
      const msg = error?.message || String(error);
      const fallbackMessage = __DEV__
        ? msg
        : 'Failed to change the app icon. Try resetting to Default or rebuild the app if the icon pack changed.';

      setErrorMessage(fallbackMessage);
      Alert.alert('Icon Change Failed', fallbackMessage);
      try {
        await setAlternateAppIcon(null);
        setSelectedIcon('default');
      } catch {
        // Keep the error visible in the UI if even the reset path fails.
      }
    } finally {
      setIsApplying(false);
    }
  };

  const selectedMeta = APP_ICONS.find((icon) => icon.name === selectedIcon) ?? APP_ICONS[0];

  return (
    <View className="flex-1" style={{ backgroundColor: C.background }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 220,
          backgroundColor: isDark ? 'rgba(72,199,142,0.14)' : 'rgba(72,199,142,0.12)',
        }}
      />
      <View
        className="px-4 pb-4 flex-row items-center justify-between"
        style={{ paddingTop: insets.top + 8, backgroundColor: 'transparent' }}
      >
        <TouchableOpacity onPress={() => router.back()} className="w-11 h-11 items-center justify-center rounded-full" style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}>
          <ArrowLeft size={20} color={C.text} />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-lg font-bold" style={{ color: C.text }}>App Icon</Text>
          <Text className="text-[11px] font-medium" style={{ color: C.textMuted }}>Personalize the app badge</Text>
        </View>
        <View className="w-11" />
      </View>

      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        <View
          style={{
            backgroundColor: C.surface,
            borderRadius: 28,
            padding: 16,
            borderWidth: 1,
            borderColor: C.border,
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.18 : 0.06,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 6 },
            elevation: 2,
            marginBottom: 18,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: Colors.primary + '18', alignItems: 'center', justifyContent: 'center' }}>
              <Image source={ICON_IMAGES[selectedIcon]} style={{ width: 32, height: 32, borderRadius: 9 }} contentFit="cover" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 15, fontWeight: '800' }}>Current icon: {selectedMeta.label}</Text>
              <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>
                Pick an icon below. If the switch fails, you’ll see the reason here.
              </Text>
            </View>
          </View>

          {errorMessage && (
            <View style={{ marginTop: 14, padding: 12, borderRadius: 18, backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#FEF2F2', borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.25)' : '#FECACA', flexDirection: 'row', gap: 10 }}>
              <ShieldAlert size={18} color="#EF4444" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '700' }}>Icon change failed</Text>
                <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 2, lineHeight: 18 }} numberOfLines={4}>
                  {errorMessage}
                </Text>
              </View>
            </View>
          )}
        </View>

        <Text style={{ color: C.textMuted, fontSize: 13, marginBottom: 16, textAlign: 'center', fontWeight: '600' }}>
          Choose your preferred app icon
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
          {APP_ICONS.map((icon) => {
            const isSelected = selectedIcon === icon.name;
            return (
              <TouchableOpacity
                key={icon.name}
                onPress={() => handleIconSelect(icon.name)}
                activeOpacity={0.82}
                disabled={isApplying}
                style={{ alignItems: 'center', width: 104, opacity: isApplying && !isSelected ? 0.55 : 1 }}
              >
                <View style={{ width: 78, height: 78, justifyContent: 'center', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 76,
                      height: 76,
                      borderRadius: 24,
                      borderWidth: isSelected ? 3 : 1.5,
                      borderColor: isSelected ? Colors.primary : (isDark ? Colors.dark.border : '#e2e8f0'),
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: isDark ? 0.24 : 0.14,
                      shadowRadius: 12,
                      elevation: 5,
                      overflow: 'hidden',
                      backgroundColor: C.surfaceElevated,
                    }}
                  >
                    <Image
                      source={ICON_IMAGES[icon.name]}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                      cachePolicy="memory"
                    />
                  </View>

                  {isSelected && (
                    <View style={{
                      position: 'absolute', bottom: -2, right: -2,
                      width: 24, height: 24, borderRadius: 12,
                      backgroundColor: Colors.primary,
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: 2.5,
                      borderColor: isDark ? Colors.dark.background : '#fff',
                      elevation: 5,
                    }}>
                      <Check size={11} color="#fff" />
                    </View>
                  )}
                </View>

                <Text style={{
                  color: isSelected ? Colors.primary : C.text,
                  fontSize: 12,
                  fontWeight: isSelected ? '800' : '600',
                  marginTop: 10,
                }}>
                  {icon.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{
          marginTop: 28,
          padding: 16,
          borderRadius: 18,
          backgroundColor: isDark ? 'rgba(34,197,94,0.08)' : '#f0fdf4',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(34,197,94,0.2)' : '#bbf7d0',
          flexDirection: 'row',
          gap: 10,
        }}>
          <RefreshCw size={18} color={Colors.primary} />
          <Text style={{ color: C.textMuted, fontSize: 12, lineHeight: 18, flex: 1 }}>
            Changing the app icon may briefly restart the app on some devices. If an icon fails, reset to Default and try again.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
