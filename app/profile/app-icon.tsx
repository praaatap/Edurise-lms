import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/core/theme/useTheme';
import { Colors } from '@/core/theme/colors';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { setAlternateAppIcon } from 'expo-alternate-app-icons';
import { useAppIconStore, APP_ICONS, AppIconName } from '@/features/settings/store/appIconStore';
import { analytics } from '@/core/services/analyticsService';
import { clarityService } from '@/core/services/clarityService';
import { useScreenTracking } from '@/shared/hooks/useScreenTracking';

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

  useScreenTracking('AppIconSettings');

  const handleIconSelect = async (iconName: AppIconName) => {
    if (iconName === selectedIcon) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // null resets to default; PascalCase name selects alternate
      await setAlternateAppIcon(iconName === 'default' ? null : iconName);

      setSelectedIcon(iconName);
      clarityService.logEvent('app_icon_changed', { icon: iconName });
      analytics.logEvent('app_icon_changed', { icon: iconName });
    } catch (error: any) {
      const msg = error?.message || String(error);
      Alert.alert(
        'Icon Change Failed',
        __DEV__ ? msg : 'Failed to change app icon. Rebuild the app to enable this feature.',
      );
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: C.background }}>
      <View
        className="px-4 pb-4 border-b flex-row items-center justify-between"
        style={{ paddingTop: insets.top, backgroundColor: C.surface, borderBottomColor: C.border }}
      >
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full" style={{ backgroundColor: C.surfaceElevated }}>
          <ArrowLeft size={20} color={C.text} />
        </TouchableOpacity>
        <Text className="text-lg font-bold" style={{ color: C.text }}>App Icon</Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1 px-5 pt-6"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <Text style={{ color: C.textMuted, fontSize: 13, marginBottom: 20, textAlign: 'center' }}>
          Choose your preferred app icon
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
          {APP_ICONS.map((icon) => {
            const isSelected = selectedIcon === icon.name;
            return (
              <TouchableOpacity
                key={icon.name}
                onPress={() => handleIconSelect(icon.name)}
                activeOpacity={0.7}
                style={{ alignItems: 'center', width: 100 }}
              >
                {/* Outer wrapper — holds image + badge together, no overflow hidden */}
                <View style={{ width: 72, height: 72 }}>
                  {/* Icon image with rounded corners + selection border */}
                  <View
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 18,
                      borderWidth: isSelected ? 3 : 1.5,
                      borderColor: isSelected ? Colors.primary : (isDark ? Colors.dark.border : '#e2e8f0'),
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.15,
                      shadowRadius: 8,
                      elevation: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <Image
                      source={ICON_IMAGES[icon.name]}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                      cachePolicy="memory"
                    />
                  </View>

                  {/* Check badge — outside overflow:hidden so it's not clipped */}
                  {isSelected && (
                    <View style={{
                      position: 'absolute', bottom: -4, right: -4,
                      width: 22, height: 22, borderRadius: 11,
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
                  fontWeight: isSelected ? '700' : '500',
                  marginTop: 10,
                }}>
                  {icon.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{
          marginTop: 32,
          padding: 16,
          borderRadius: 12,
          backgroundColor: isDark ? 'rgba(34,197,94,0.08)' : '#f0fdf4',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(34,197,94,0.2)' : '#bbf7d0',
        }}>
          <Text style={{ color: C.textMuted, fontSize: 12, lineHeight: 18 }}>
            Changing the app icon may briefly restart the app on some devices. Your selected icon will appear on your home screen.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
