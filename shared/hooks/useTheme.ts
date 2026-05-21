import { useColorScheme } from 'nativewind';
import { Colors } from '@/core/theme/colors';

export function useTheme() {
  const { colorScheme = 'light' } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    isDark,
    colors: Colors,
    darkColors: Colors.dark,
    theme: isDark ? 'dark' : 'light',
  };
}
