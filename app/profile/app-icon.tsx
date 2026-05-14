import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/core/theme/useTheme';
import { Colors } from '@/core/theme/colors';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { setAlternateAppIcon, resetAppIcon } from 'expo-alternate-app-icons';
import { useAppIconStore, APP_ICONS, AppIconName } from '@/features/settings/store/appIconStore';
import { analytics } from '@/core/services/analyticsService';
import { useScreenTracking } from '@/shared/hooks/useScreenTracking';

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

      if (iconName === 'default') {
        await resetAppIcon();
      } else {
        await setAlternateAppIcon(iconName);
      }

      setSelectedIcon(iconName);
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
                style={{
                  alignItems: 'center',
                  width: 100,
                }}
              >
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 18,
                    backgroundColor: icon.color,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: isSelected ? 3 : 1,
                    borderColor: isSelected ? Colors.primary : (isDark ? Colors.dark.border : '#e2e8f0'),
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>E</Text>
                  {isSelected && (
                    <View style={{
                      position: 'absolute', bottom: -4, right: -4,
                      width: 22, height: 22, borderRadius: 11,
                      backgroundColor: Colors.primary,
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: 2, borderColor: isDark ? Colors.dark.background : '#fff',
                    }}>
                      <Check size={12} color="#fff" />
                    </View>
                  )}
                </View>
                <Text style={{
                  color: isSelected ? Colors.primary : C.text,
                  fontSize: 12,
                  fontWeight: isSelected ? '700' : '500',
                  marginTop: 8,
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
