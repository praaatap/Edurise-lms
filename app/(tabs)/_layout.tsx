import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { FloatingAIBtn } from '@/shared/components/ui/FloatingAIBtn';
import { NetworkStatus } from '@/shared/components/ui/NetworkStatus';
import { Image } from 'expo-image';
import { Tabs } from 'expo-router';
import { Heart, House, LayoutGrid, User } from 'lucide-react-native';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { user, localAvatar } = useAuthStore();
  const bookmarks = useCourseStore((s) => s.bookmarks);
  const bookmarkCount = bookmarks.length;
  const { C, isDark } = useTheme();

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
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
              // 1. Give it clear spacing from the edges
              bottom: Platform.OS === 'ios' ? 24 : 16, 
              left: 16,
              right: 16,
              borderRadius: 24,
              borderTopWidth: 0,
              
              // 2. Normalize height so text and icons align correctly
              height: Platform.OS === 'ios' ? 76 : 68,
              paddingBottom: Platform.OS === 'ios' ? 14 : 10,
              paddingTop: 10,
              
              elevation: 8, // Increased for Android visibility over content
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              borderWidth: 1,
              borderColor: isDark ? C.border : 'rgba(15,23,42,0.06)',
            },
            tabBarItemStyle: {
              paddingTop: 0,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
              marginBottom: 0,
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
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: focused ? Colors.primary + '14' : 'transparent',
                  }}
                >
                  <House size={20} color={color} strokeWidth={focused ? 2.4 : 2} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="explore"
            options={{
              title: 'Categories',
              tabBarLabel: 'Categories',
              tabBarIcon: ({ color, focused }) => (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: focused ? Colors.primary + '14' : 'transparent',
                  }}
                >
                  <LayoutGrid size={20} color={color} strokeWidth={focused ? 2.4 : 2} />
                </View>
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
                marginTop: 2,
              },
              tabBarIcon: ({ color, focused }) => (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: focused ? Colors.primary + '14' : 'transparent',
                  }}
                >
                  <Heart size={20} color={color} strokeWidth={focused ? 2.4 : 2} />
                </View>
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
                if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim() !== '') {
                  return (
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: focused ? Colors.primary + '14' : 'transparent',
                      }}
                    >
                      <View
                        className="rounded-full overflow-hidden border-2"
                        style={{
                          borderColor: focused ? Colors.primary : 'transparent',
                          width: 26,
                          height: 26,
                        }}
                      >
                        <Image
                          source={{ uri: avatarUrl }}
                          className="w-full h-full"
                          contentFit="cover"
                        />
                      </View>
                    </View>
                  );
                }
                return (
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: focused ? Colors.primary + '14' : 'transparent',
                    }}
                  >
                    <User size={20} color={color} strokeWidth={focused ? 2.4 : 2} />
                  </View>
                );
              },
            }}
          />
        </Tabs>
        <FloatingAIBtn />
      </View>
    </SafeAreaProvider>
  );
}