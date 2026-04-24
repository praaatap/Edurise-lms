import { Colors } from '@/core/theme/colors';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { Tabs } from 'expo-router';
import { Heart, LayoutGrid, House, User } from 'lucide-react-native';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FloatingAIBtn } from '@/shared/components/ui/FloatingAIBtn';
import { NetworkStatus } from '@/shared/components/ui/NetworkStatus';

export default function TabLayout() {
  const bookmarks = useCourseStore((s) => s.bookmarks);
  const bookmarkCount = bookmarks.length;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <NetworkStatus />
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors.primary,
            tabBarInactiveTintColor: Colors.textMuted,
            headerShown: false,
            tabBarStyle: {
              backgroundColor: Colors.surface,
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderTopWidth: 0,
              height: Platform.OS === 'ios' ? 120 : 100,
              paddingBottom: Platform.OS === 'ios' ? 24 : 10,
              paddingTop: 8,
              elevation: 20, 
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
            },
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: '600',
              marginBottom: 6,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarLabel: 'Home',
              tabBarIcon: ({ color, focused }) => (
                <House size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
              ),
            }}
          />
          <Tabs.Screen
            name="explore"
            options={{
              title: 'Categories',
              tabBarLabel: 'Categories',
              tabBarIcon: ({ color, focused }) => (
                <LayoutGrid size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
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
                marginTop: 4,
              },
              tabBarIcon: ({ color, focused }) => (
                <Heart size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarLabel: 'Profile',
              tabBarIcon: ({ color, focused }) => (
                <User size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
              ),
            }}
          />
        </Tabs>
        <FloatingAIBtn />
      </View>
    </SafeAreaProvider>
  );
}