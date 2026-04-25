import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/core/theme/useTheme';
import { Colors } from '@/core/theme/colors';

interface ProfileStatsProps {
  enrolledCount: number;
  bookmarksCount: number;
  progress: number;
}

const STATS = [
  {
    key: 'courses',
    icon: 'layers' as const,
    iconBg: (isDark: boolean) => isDark ? 'rgba(99,102,241,0.15)' : '#ede9fe',
    iconColor: '#6366f1',
    label: 'Enrolled',
  },
  {
    key: 'saved',
    icon: 'bookmark' as const,
    iconBg: (isDark: boolean) => isDark ? 'rgba(251,146,60,0.15)' : '#fff7ed',
    iconColor: '#f97316',
    label: 'Saved',
  },
  {
    key: 'progress',
    icon: 'checkmark-done' as const,
    iconBg: (isDark: boolean) => isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7',
    iconColor: Colors.primary,
    label: 'Done',
  },
];

export const ProfileStats = ({ enrolledCount, bookmarksCount, progress }: ProfileStatsProps) => {
  const { C, isDark } = useTheme();

  const values = [enrolledCount, bookmarksCount, `${progress}%`];

  return (
    <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 24 }}>
      {STATS.map((stat, i) => (
        <View
          key={stat.key}
          style={{
            flex: 1,
            backgroundColor: isDark ? Colors.dark.surface : '#fff',
            borderRadius: 20,
            padding: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: isDark ? Colors.dark.border : '#e2e8f0',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.2 : 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View
            style={{
              width: 44, height: 44, borderRadius: 14,
              backgroundColor: stat.iconBg(isDark),
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 10,
            }}
          >
            <Ionicons name={stat.icon} size={22} color={stat.iconColor} />
          </View>
          <Text style={{ color: C.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }}>
            {values[i]}
          </Text>
          <Text style={{ color: C.textMuted, fontSize: 10, fontWeight: '700', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
};
