import { StyleSheet } from 'react-native';

export const COLORS = {
  primary: '#6C63FF',
  primaryDark: '#4C46B8',
  primaryLight: '#8F89FF',
  primaryMuted: '#EEF0FF',

  secondary: '#FF6584',
  secondaryLight: '#FFD6DF',

  accent: '#43C6AC',
  accentLight: '#D4F5EE',

  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Backgrounds
  background: '#F8F9FE',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#1A1D2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // Tab bar
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
  tabActive: '#6C63FF',
  tabInactive: '#9CA3AF',

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.08)',

  // Dark mode
  dark: {
    background: '#0F1117',
    surface: '#1A1D2E',
    surfaceElevated: '#252836',
    textPrimary: '#F9FAFB',
    textSecondary: '#9CA3AF',
    border: '#2D3748',
    tabBarBg: '#1A1D2E',
    tabBarBorder: '#2D3748',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 999,
};

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  base: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
};

export const FONT_WEIGHT = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
};

// Backward compat for existing imports
export const Colors = {
  light: {
    text: COLORS.textPrimary,
    background: COLORS.background,
    tint: COLORS.primary,
    icon: COLORS.textSecondary,
    tabIconDefault: COLORS.tabInactive,
    tabIconSelected: COLORS.primary,
  },
  dark: {
    text: COLORS.dark.textPrimary,
    background: COLORS.dark.background,
    tint: COLORS.primaryLight,
    icon: COLORS.textTertiary,
    tabIconDefault: COLORS.textTertiary,
    tabIconSelected: COLORS.primaryLight,
  },
};

export const globalStyles = StyleSheet.create({
  flex1: { flex: 1 },
  row: { flexDirection: 'row' },
  center: { alignItems: 'center', justifyContent: 'center' },
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    ...SHADOW.sm,
  },
});
