import { Platform } from 'react-native';

export const FLOATING_TAB_BAR_HEIGHT = 72;
export const FLOATING_TAB_BAR_SIDE_MARGIN = 16;
export const FLOATING_TAB_BAR_CONTENT_GAP = 24;

export function getFloatingTabBarBottomOffset(bottomInset: number) {
  if (Platform.OS === 'web') {
    return FLOATING_TAB_BAR_SIDE_MARGIN;
  }

  return Math.max(bottomInset, FLOATING_TAB_BAR_SIDE_MARGIN);
}

export function getFloatingTabBarContentInset(bottomInset: number) {
  return (
    getFloatingTabBarBottomOffset(bottomInset) +
    FLOATING_TAB_BAR_HEIGHT +
    FLOATING_TAB_BAR_CONTENT_GAP
  );
}

export function getFloatingAiButtonBottomOffset(bottomInset: number) {
  return (
    getFloatingTabBarBottomOffset(bottomInset) + FLOATING_TAB_BAR_HEIGHT + 12
  );
}
