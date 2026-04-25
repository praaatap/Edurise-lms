import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';

interface LevelProgressProps {
  level: number;
  xp: number;
  xpToNextLevel: number;
  xpProgress: number;
}

export const LevelProgress = ({ level, xp, xpToNextLevel, xpProgress }: LevelProgressProps) => {
  const { C, isDark } = useTheme();

  return (
    <View className="px-5 mb-6">
      <View
        style={{
          backgroundColor: isDark ? Colors.dark.surface : '#fff',
          borderRadius: 24,
          padding: 20,
          borderWidth: 1,
          borderColor: isDark ? Colors.dark.border : '#e2e8f0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.25 : 0.06,
          shadowRadius: 10,
          elevation: 3,
        }}
      >
        {/* Header row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View
            style={{
              width: 40, height: 40, borderRadius: 12,
              backgroundColor: isDark ? 'rgba(34,197,94,0.12)' : '#dcfce7',
              alignItems: 'center', justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons name="trophy" size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontWeight: '700', fontSize: 15 }}>Level {level}</Text>
            <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 1 }}>Mastering multiple tech tracks</Text>
          </View>
          <View
            style={{
              backgroundColor: isDark ? 'rgba(34,197,94,0.12)' : '#dcfce7',
              paddingHorizontal: 10, paddingVertical: 4,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: Colors.primary, fontSize: 12, fontWeight: '800' }}>
              {Math.floor(xp).toLocaleString()} XP
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View
          style={{
            height: 10, borderRadius: 10, overflow: 'hidden',
            backgroundColor: isDark ? Colors.dark.surfaceElevated : '#f1f5f9',
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${xpProgress}%`,
              borderRadius: 10,
              backgroundColor: Colors.primary,
            }}
          />
        </View>

        {/* Footer row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
          <Text style={{ color: C.textMuted, fontSize: 11, fontWeight: '600' }}>
            {Math.round(xpProgress)}% to Level {level + 1}
          </Text>
          <Text style={{ color: C.textMuted, fontSize: 11, fontWeight: '600' }}>
            {(xpToNextLevel - Math.floor(xp)).toLocaleString()} XP left
          </Text>
        </View>
      </View>
    </View>
  );
};
