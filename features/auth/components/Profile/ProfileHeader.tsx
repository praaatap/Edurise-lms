import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';

interface ProfileHeaderProps {
  insets: { top: number };
  user: any;
  localAvatar: string | null;
  level: number;
  onPickImage: () => void;
}

export const ProfileHeader = ({ insets, user, localAvatar, level, onPickImage }: ProfileHeaderProps) => {
  const { C, isDark } = useTheme();
  const avatarUri = localAvatar?.trim() || user.avatar?.url?.trim() || null;

  return (
    <View>
      {/* Banner */}
      <View
        style={{
          height: 150 + insets.top,
          backgroundColor: isDark ? '#052e16' : '#d1fae5',
        }}
      >
        {/* Decorative circles */}
        <View
          style={{
            position: 'absolute', width: 200, height: 200,
            borderRadius: 100,
            backgroundColor: isDark ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.15)',
            top: -60, right: -40,
          }}
        />
        <View
          style={{
            position: 'absolute', width: 140, height: 140,
            borderRadius: 70,
            backgroundColor: isDark ? 'rgba(34,197,94,0.05)' : 'rgba(34,197,94,0.1)',
            top: 20, left: -30,
          }}
        />
      </View>

      {/* Avatar card — floats over the banner */}
      <View style={{ alignItems: 'center', marginTop: -54 }}>
        <TouchableOpacity onPress={onPickImage} activeOpacity={0.85}>
          <View
            style={{
              width: 108, height: 108, borderRadius: 54,
              borderWidth: 4,
              borderColor: isDark ? Colors.dark.surface : '#fff',
              backgroundColor: C.surfaceElevated,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isDark ? 0.5 : 0.16,
              shadowRadius: 18,
              elevation: 10,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {avatarUri ? (
              <Image
                key={avatarUri}
                source={{ uri: avatarUri }}
                style={{ width: 100, height: 100, borderRadius: 50 }}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View
                style={{
                  width: 100, height: 100, borderRadius: 50,
                  backgroundColor: C.surfaceElevated,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="person" size={46} color={C.textMuted} />
              </View>
            )}

            {/* Camera badge */}
            <View
              style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 30, height: 30, borderRadius: 15,
                backgroundColor: Colors.primary,
                borderWidth: 2.5,
                borderColor: isDark ? Colors.dark.surface : '#fff',
                alignItems: 'center', justifyContent: 'center',
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.55,
                shadowRadius: 6,
                elevation: 5,
              }}
            >
              <Ionicons name="camera" size={13} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>

        <Text
          style={{
            color: C.text, marginTop: 14,
            fontSize: 23, fontWeight: '800', letterSpacing: -0.5,
          }}
          numberOfLines={1}
        >
          {user.username}
        </Text>

        {user.email ? (
          <Text
            style={{ color: C.textMuted, fontSize: 13, marginTop: 3 }}
            numberOfLines={1}
          >
            {user.email}
          </Text>
        ) : null}

        {/* Level pill */}
        <View
          style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: isDark ? 'rgba(34,197,94,0.12)' : '#dcfce7',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(34,197,94,0.25)' : '#bbf7d0',
            paddingHorizontal: 14, paddingVertical: 5,
            borderRadius: 20, marginTop: 10, marginBottom: 28,
          }}
        >
          <Ionicons name="flash" size={13} color={Colors.primary} />
          <Text
            style={{
              color: Colors.primary, fontSize: 11, fontWeight: '800',
              marginLeft: 5, letterSpacing: 1.4, textTransform: 'uppercase',
            }}
          >
            Level {level} Explorer
          </Text>
        </View>
      </View>
    </View>
  );
};
