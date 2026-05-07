import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { School } from '@/shared/types';
import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';
import { Settings } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/features/auth/store/authStore';

interface SchoolHeaderProps {
  school: School;
  showSettingsButton?: boolean;
}

export function SchoolHeader({ school, showSettingsButton = false }: SchoolHeaderProps) {
  const { C, isDark } = useTheme();
  const router = useRouter();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' && user?.schoolId === school._id;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0F1A2A' : '#EFF6FF', borderBottomColor: C.border }]}>
      <View style={styles.inner}>
        {/* Logo */}
        {school.logo ? (
          <Image source={{ uri: school.logo }} style={styles.logo} resizeMode="contain" />
        ) : (
          <View style={[styles.logoPlaceholder, { backgroundColor: Colors.primary + '25' }]}>
            <Text style={[styles.logoInitial, { color: Colors.primary }]}>
              {school.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Name & category */}
        <View style={styles.textContainer}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: C.text }]} numberOfLines={1}>
              {school.name}
            </Text>
            {school.isVerified && (
              <Text style={styles.verifiedIcon}>✓</Text>
            )}
          </View>
          {school.category && (
            <Text style={[styles.category, { color: C.textMuted }]}>{school.category}</Text>
          )}
        </View>

        {/* Settings button (admin only) */}
        {showSettingsButton && (isAdmin || __DEV__) && (
          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: C.surface }]}
            onPress={() => router.push('/(admin)/settings' as any)}
          >
            <Settings size={18} color={C.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInitial: {
    fontSize: 20,
    fontWeight: '800',
  },
  textContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  verifiedIcon: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  category: {
    fontSize: 12,
    marginTop: 2,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
