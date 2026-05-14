import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/core/theme/useTheme';
import { Colors } from '@/core/theme/colors';
import { ArrowLeft, Zap, Activity, Eye, Bug, Send, BarChart3, ExternalLink } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Sentry from '@sentry/react-native';
import { Linking } from 'react-native';
import { analytics } from '@/core/services/analyticsService';
import { clarityService } from '@/core/services/clarityService';
import { withSentrySpan, trackUserAction, trackScreenView, trackApiRequest } from '@/core/services/sentryPerformance';
import { useScreenTracking } from '@/shared/hooks/useScreenTracking';
import { useEffect, useState } from 'react';

const TEST_EVENTS = [
  {
    section: 'Sentry Performance',
    icon: Activity,
    color: '#8B5CF6',
    items: [
      {
        label: 'Trigger Sentry Span',
        description: 'Wraps a 1s async operation in a Sentry performance span',
        action: async () => {
          const result = await withSentrySpan('test-span', 'test.operation', async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return 'completed';
          });
          Alert.alert('Sentry Span', `Span completed with result: ${result}`);
        },
      },
      {
        label: 'Track User Action',
        description: 'Adds a user.action breadcrumb to Sentry',
        action: () => {
          trackUserAction('test_button_pressed', { screen: 'EventTesting', timestamp: Date.now() });
          Alert.alert('Breadcrumb Added', 'user.action breadcrumb sent to Sentry');
        },
      },
      {
        label: 'Track Screen View',
        description: 'Adds a navigation breadcrumb to Sentry',
        action: () => {
          trackScreenView('TestScreen_Manual');
          Alert.alert('Screen Tracked', 'Navigation breadcrumb sent to Sentry');
        },
      },
      {
        label: 'Track API Request',
        description: 'Simulates a tracked HTTP request breadcrumb',
        action: () => {
          trackApiRequest('GET', '/api/v1/test/endpoint', 200, 342);
          Alert.alert('API Tracked', 'HTTP breadcrumb logged: GET /api/v1/test/endpoint 200 (342ms)');
        },
      },
      {
        label: 'Trigger Test Error',
        description: 'Sends a test exception to Sentry dashboard',
        action: () => {
          Sentry.captureException(new Error('Test error from Event Testing screen'));
          Alert.alert('Error Sent', 'Test exception captured and sent to Sentry');
        },
      },
    ],
  },
  {
    section: 'Microsoft Clarity',
    icon: Eye,
    color: '#3B82F6',
    items: [
      {
        label: 'Get Session URL',
        description: 'Fetch the direct link to watch this session recording',
        action: async () => {
          const url = await clarityService.getSessionUrl();
          if (url) {
            Alert.alert(
              '🎥 Session Recording URL',
              url,
              [
                { text: 'Copy', onPress: () => {} },
                { text: 'Open in Browser', onPress: () => Linking.openURL(url) },
                { text: 'OK' },
              ]
            );
          } else {
            Alert.alert('Not Ready', 'Session URL not available yet. Wait a few seconds after app start and try again.');
          }
        },
      },
      {
        label: 'Set Custom Screen',
        description: 'Sets screen name to "TestScreen_Clarity"',
        action: () => {
          clarityService.setScreen('TestScreen_Clarity');
          Alert.alert('Clarity Screen', 'Screen set to: TestScreen_Clarity');
        },
      },
      {
        label: 'Log Custom Event',
        description: 'Sends a custom event with parameters to Clarity',
        action: () => {
          clarityService.logCustomEvent('test_event_fired', {
            source: 'event_testing_screen',
            timestamp: new Date().toISOString(),
            value: Math.random().toFixed(4),
          });
          Alert.alert('Clarity Event', 'Custom event "test_event_fired" sent');
        },
      },
      {
        label: 'Pause Recording',
        description: 'Pauses Clarity session capture',
        action: () => {
          clarityService.pauseRecording();
          Alert.alert('Paused', 'Clarity recording is paused');
        },
      },
      {
        label: 'Resume Recording',
        description: 'Resumes Clarity session capture',
        action: () => {
          clarityService.resumeRecording();
          Alert.alert('Resumed', 'Clarity recording is active again');
        },
      },
    ],
  },
  {
    section: 'Analytics Service',
    icon: BarChart3,
    color: '#10B981',
    items: [
      {
        label: 'Log course_tapped',
        description: 'Simulates a course tap event (Sentry + Clarity + LocalStorage)',
        action: () => {
          analytics.logEvent('course_tapped', { courseId: 'test-123', title: 'Test Course', source: 'event_testing' });
          Alert.alert('Event Logged', 'course_tapped sent to all destinations');
        },
      },
      {
        label: 'Log ai_message_sent',
        description: 'Simulates an AI chat message event',
        action: () => {
          analytics.logEvent('ai_message_sent', { messageLength: 42 });
          Alert.alert('Event Logged', 'ai_message_sent sent to all destinations');
        },
      },
      {
        label: 'Log theme_changed',
        description: 'Simulates a theme change event',
        action: () => {
          analytics.logEvent('theme_changed', { theme: 'dark', source: 'testing' });
          Alert.alert('Event Logged', 'theme_changed sent to all destinations');
        },
      },
      {
        label: 'View Recent Events',
        description: 'Shows last 5 events stored in AsyncStorage',
        action: async () => {
          const events = await analytics.getRecentEvents();
          const last5 = events.slice(0, 5).map((e: any) => `${e.name} (${new Date(e.timestamp).toLocaleTimeString()})`).join('\n');
          Alert.alert('Recent Events', last5 || 'No events stored');
        },
      },
    ],
  },
  {
    section: 'Combined Flow Test',
    icon: Zap,
    color: '#F59E0B',
    items: [
      {
        label: 'Full Flow Simulation',
        description: 'Runs: screen view → user action → API span → analytics event',
        action: async () => {
          trackScreenView('SimulatedCourseView');
          clarityService.setScreen('SimulatedCourseView');
          trackUserAction('course_enrolled', { courseId: 'sim-001' });

          await withSentrySpan('simulated-api-call', 'test.api', async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
          });

          trackApiRequest('POST', '/api/v1/courses/enroll', 201, 523);
          analytics.logEvent('course_enroll', { courseId: 'sim-001' });

          Alert.alert('Flow Complete', 'Screen view → User action → API span → Analytics event all fired successfully');
        },
      },
    ],
  },
];

export default function EventTestingScreen() {
  const { C, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sessionUrl, setSessionUrl] = useState<string | null>(clarityService.sessionUrl);

  useScreenTracking('EventTesting');

  useEffect(() => {
    // Poll for session URL — it becomes available a few seconds after init
    const interval = setInterval(async () => {
      const url = await clarityService.getSessionUrl();
      if (url) {
        setSessionUrl(url);
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handlePress = async (action: () => void | Promise<void>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await action();
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.background, paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? Colors.dark.surface : '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={20} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: C.text }}>Event Testing</Text>
          <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>Trigger Sentry, Clarity & Analytics events</Text>
        </View>
        <Bug size={24} color={Colors.primary} />
      </View>

      {/* Clarity Session URL Banner */}
      {sessionUrl ? (
        <TouchableOpacity
          onPress={() => Linking.openURL(sessionUrl)}
          style={{
            marginHorizontal: 16, marginBottom: 4,
            backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF',
            borderRadius: 12, padding: 12,
            borderWidth: 1, borderColor: isDark ? 'rgba(59,130,246,0.3)' : '#BFDBFE',
            flexDirection: 'row', alignItems: 'center', gap: 10,
          }}
        >
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E' }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#3B82F6', fontSize: 12, fontWeight: '700' }}>🎥 Clarity Recording Active</Text>
            <Text style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }} numberOfLines={1}>{sessionUrl}</Text>
          </View>
          <ExternalLink size={16} color="#3B82F6" />
        </TouchableOpacity>
      ) : (
        <View style={{
          marginHorizontal: 16, marginBottom: 4,
          backgroundColor: isDark ? 'rgba(107,114,128,0.1)' : '#F9FAFB',
          borderRadius: 12, padding: 12,
          borderWidth: 1, borderColor: C.border,
          flexDirection: 'row', alignItems: 'center', gap: 10,
        }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#F59E0B' }} />
          <Text style={{ color: C.textMuted, fontSize: 12, fontWeight: '600' }}>Clarity session starting… URL will appear here</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {TEST_EVENTS.map((section) => {
          const SectionIcon = section.icon;
          return (
            <View key={section.section}>
              {/* Section Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${section.color}15`, alignItems: 'center', justifyContent: 'center' }}>
                  <SectionIcon size={18} color={section.color} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: C.text }}>{section.section}</Text>
              </View>

              {/* Items */}
              <View style={{ gap: 8 }}>
                {section.items.map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    onPress={() => handlePress(item.action)}
                    activeOpacity={0.7}
                    style={{
                      backgroundColor: isDark ? Colors.dark.surface : '#FFFFFF',
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: isDark ? Colors.dark.border : '#E2E8F0',
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: C.text }}>{item.label}</Text>
                        <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{item.description}</Text>
                      </View>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${section.color}15`, alignItems: 'center', justifyContent: 'center' }}>
                        <Send size={16} color={section.color} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
