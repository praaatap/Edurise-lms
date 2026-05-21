import React from 'react';
import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { FloatingAIBtn } from '@/shared/components/ui/FloatingAIBtn';
import { NetworkStatus } from '@/shared/components/ui/NetworkStatus';
import {
  FLOATING_TAB_BAR_HEIGHT,
  FLOATING_TAB_BAR_SIDE_MARGIN,
  getFloatingTabBarBottomOffset,
} from '@/shared/utils/navigationLayout';
import { Image } from 'expo-image';
import { Tabs } from 'expo-router';
import { Heart, House, LayoutGrid, User } from 'lucide-react-native';
import { Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { user, localAvatar } = useAuthStore();
  const bookmarks = useCourseStore((s) => s.bookmarks);
  const bookmarkCount = bookmarks.length;
  const { C, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Keep each tab hit area stable while the active icon background changes.
  const TabIconContainer = ({
    children,
    focused,
  }: {
    children: React.ReactNode;
    focused: boolean;
  }) => (
    <View
      style={[
        styles.iconWrapper,
        { backgroundColor: focused ? `${Colors.primary}14` : 'transparent' },
      ]}
    >
      {children}
    </View>
  );

  const tabBarBottom = getFloatingTabBarBottomOffset(insets.bottom);

  return (
    <View style={styles.container}>
      <NetworkStatus />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: isDark ? '#6B7280' : Colors.textMuted,
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarLabelPosition: 'below-icon',
          tabBarStyle: {
            backgroundColor: C.surface,
            position: 'absolute',
            bottom: tabBarBottom,
            left: FLOATING_TAB_BAR_SIDE_MARGIN,
            right: FLOATING_TAB_BAR_SIDE_MARGIN,
            borderRadius: 20,
            borderTopWidth: 0,
            height: FLOATING_TAB_BAR_HEIGHT,
            paddingBottom: 10,
            paddingTop: 10,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.08,
            shadowRadius: 12,
            borderWidth: 1,
            borderColor: isDark ? C.border : 'rgba(15,23,42,0.06)',
          },
          tabBarItemStyle: {
            height: 52,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 2,
            letterSpacing: 0.1,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <TabIconContainer focused={focused}>
                <House
                  size={20}
                  color={color}
                  strokeWidth={focused ? 2.4 : 2}
                />
              </TabIconContainer>
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Categories',
            tabBarLabel: 'Categories',
            tabBarIcon: ({ color, focused }) => (
              <TabIconContainer focused={focused}>
                <LayoutGrid
                  size={20}
                  color={color}
                  strokeWidth={focused ? 2.4 : 2}
                />
              </TabIconContainer>
            ),
          }}
        />
        <Tabs.Screen
          name="bookmarks"
          options={{
            title: 'Favourite',
            tabBarLabel: 'Favourite',
            tabBarBadge: bookmarkCount > 0 ? bookmarkCount : undefined,
            tabBarBadgeStyle: {
              backgroundColor: Colors.primary,
              color: 'white',
              fontSize: 10,
              lineHeight: 14,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              marginTop: Platform.OS === 'ios' ? 2 : 0,
            },
            tabBarIcon: ({ color, focused }) => (
              <TabIconContainer focused={focused}>
                <Heart
                  size={20}
                  color={color}
                  strokeWidth={focused ? 2.4 : 2}
                />
              </TabIconContainer>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color, focused }) => {
              const avatarUrl = localAvatar || user?.avatar;
              if (
                avatarUrl &&
                typeof avatarUrl === 'string' &&
                avatarUrl.trim() !== ''
              ) {
                return (
                  <TabIconContainer focused={focused}>
                    <View
                      style={[
                        styles.avatarContainer,
                        {
                          borderColor: focused ? Colors.primary : 'transparent',
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: avatarUrl }}
                        style={styles.avatarImage}
                        contentFit="cover"
                      />
                    </View>
                  </TabIconContainer>
                );
              }
              return (
                <TabIconContainer focused={focused}>
                  <User
                    size={20}
                    color={color}
                    strokeWidth={focused ? 2.4 : 2}
                  />
                </TabIconContainer>
              );
            },
          }}
        />
      </Tabs>
      <FloatingAIBtn />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    borderRadius: 99,
    overflow: 'hidden',
    borderWidth: 1.5,
    width: 24,
    height: 24,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
});
