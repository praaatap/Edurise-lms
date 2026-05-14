import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useTheme } from '@/core/theme/useTheme';
import { Colors } from '@/core/theme/colors';
import { ArrowLeft, Bell, BellOff, BookOpen, Trophy, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useNotificationPrefsStore } from '@/features/settings/store/notificationPrefsStore';
import { analytics } from '@/core/services/analyticsService';
import { useScreenTracking } from '@/shared/hooks/useScreenTracking';

const CATEGORIES = [
  { key: 'reminders' as const, label: 'Study Reminders', description: 'Daily learning reminders', icon: Clock, color: '#f97316' },
  { key: 'courseUpdates' as const, label: 'Course Updates', description: 'New content and announcements', icon: BookOpen, color: '#3B82F6' },
  { key: 'achievements' as const, label: 'Achievements', description: 'Badges, milestones and rewards', icon: Trophy, color: '#EAB308' },
  { key: 'engagement' as const, label: 'Engagement', description: 'Re-engagement and streak reminders', icon: Bell, color: '#8B5CF6' },
];

export default function NotificationPreferencesScreen() {
  const { C, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { masterEnabled, categories, setMasterEnabled, setCategoryEnabled } = useNotificationPrefsStore();

  useScreenTracking('NotificationSettings');

  const handleMasterToggle = (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMasterEnabled(value);
    analytics.logEvent('notification_toggled', { category: 'master', enabled: value });
  };

  const handleCategoryToggle = (key: keyof typeof categories, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategoryEnabled(key, value);
    analytics.logEvent('notification_toggled', { category: key, enabled: value });
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
        <Text className="text-lg font-bold" style={{ color: C.text }}>Notifications</Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1 px-5 pt-6"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* Master Toggle */}
        <View
          style={{
            backgroundColor: isDark ? Colors.dark.surface : '#fff',
            borderRadius: 20,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: isDark ? Colors.dark.border : '#e2e8f0',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 44, height: 44, borderRadius: 14,
              backgroundColor: masterEnabled ? (isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7') : (isDark ? 'rgba(107,114,128,0.15)' : '#f3f4f6'),
              alignItems: 'center', justifyContent: 'center', marginRight: 14,
            }}>
              {masterEnabled ? <Bell size={22} color="#22C55E" /> : <BellOff size={22} color="#6B7280" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 16, fontWeight: '700' }}>
                All Notifications
              </Text>
              <Text style={{ color: C.textMuted, fontSize: 13, marginTop: 2 }}>
                {masterEnabled ? 'Notifications are enabled' : 'All notifications are disabled'}
              </Text>
            </View>
            <Switch
              value={masterEnabled}
              onValueChange={handleMasterToggle}
              trackColor={{ false: '#D1D1D6', true: Colors.primary }}
            />
          </View>
        </View>

        {/* Category Toggles */}
        <Text style={{ color: C.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
          Categories
        </Text>
        <View
          style={{
            backgroundColor: isDark ? Colors.dark.surface : '#fff',
            borderRadius: 20,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: isDark ? Colors.dark.border : '#e2e8f0',
            opacity: masterEnabled ? 1 : 0.5,
          }}
        >
          {CATEGORIES.map((cat, index) => {
            const Icon = cat.icon;
            return (
              <View key={cat.key}>
                {index > 0 && (
                  <View style={{ height: 1, backgroundColor: isDark ? Colors.dark.border : '#f1f5f9', marginHorizontal: 16 }} />
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
                  <View style={{
                    width: 38, height: 38, borderRadius: 12,
                    backgroundColor: isDark ? `${cat.color}20` : `${cat.color}15`,
                    alignItems: 'center', justifyContent: 'center', marginRight: 14,
                  }}>
                    <Icon size={18} color={cat.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.text, fontSize: 15, fontWeight: '600' }}>{cat.label}</Text>
                    <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 1 }}>{cat.description}</Text>
                  </View>
                  <Switch
                    value={categories[cat.key]}
                    onValueChange={(val) => handleCategoryToggle(cat.key, val)}
                    trackColor={{ false: '#D1D1D6', true: Colors.primary }}
                    disabled={!masterEnabled}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
