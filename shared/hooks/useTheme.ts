import { useColorScheme } from 'react-native';
import { Colors } from '@/core/theme/colors';

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    isDark,
    colors: Colors,
    darkColors: Colors.dark,
    theme: isDark ? 'dark' : 'light',
  };
}
