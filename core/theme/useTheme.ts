import { useColorScheme } from 'nativewind';
import { Colors } from './colors';

/**
 * useTheme – returns the correct set of Colors for the active color scheme.
 * Use this for **inline styles** where NativeWind dark: classes cannot reach.
 *
 * Example:
 *   const { C, isDark } = useTheme();
 *   <View style={{ backgroundColor: C.surface }} />
 */
export function useTheme() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const C = {
    primary: Colors.primary,
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
