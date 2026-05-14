import { useSchoolStore } from '@/features/school/store/schoolStore';
import { useColorScheme } from 'react-native';
import { Colors } from './colors';

/**
 * useTheme – returns the correct set of Colors for the active color scheme.
 * Use this for **inline styles** where NativeWind dark: classes cannot reach.
 *
 * Example:`
 *   const { C } = useTheme();
 *   <View style={{ backgroundColor: C.surface }} />
 */
export function useTheme() {
  const { colorScheme } = useColorScheme() as any;
  const { activeSchool } = useSchoolStore();
  const isDark = colorScheme === 'dark';

  const brandColor = activeSchool?.branding?.primaryColor || Colors.primary;

  const C = {
    primary: brandColor,
    primaryDark: Colors.primaryDark,
    accent: Colors.accent,
    error: Colors.error,
    success: Colors.success,
    warning: Colors.warning,
    bookmark: Colors.bookmark,

    
    // Semantic tokens that flip with the scheme
    background: isDark ? Colors.dark.background : Colors.background,
    surface: isDark ? Colors.dark.surface : Colors.surface,
    surfaceElevated: isDark ? Colors.dark.surfaceElevated : Colors.surfaceElevated,
    text: isDark ? Colors.dark.text : Colors.text,
    textMuted: isDark ? Colors.dark.textMuted : Colors.textMuted,
    textFaint: isDark ? Colors.dark.textMuted : Colors.textFaint,
    border: isDark ? Colors.dark.border : Colors.border,
  };

  return { C, isDark, colorScheme };
}
