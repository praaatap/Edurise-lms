import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '@/core/theme/useTheme';
import { Colors } from '@/core/theme/colors';
import { ArrowLeft, Bell, Send, Zap } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useState } from 'react';
import { useScreenTracking } from '@/shared/hooks/useScreenTracking';
import { useNotificationPrefsStore } from '@/features/settings/store/notificationPrefsStore';

const QUICK_TEMPLATES = [
  { emoji: '📚', title: 'Study Reminder', body: "Time to learn something new today! Open the app and continue your course." },
  { emoji: '🔥', title: 'Keep Your Streak!', body: "Don't break your learning streak — just 10 minutes today keeps it going." },
  { emoji: '🎯', title: 'Daily Goal', body: "You're almost there! Complete one more lesson to hit your daily goal." },
  { emoji: '💡', title: 'New Tip', body: "Did you know? Consistent short study sessions beat long cramming sessions every time." },
];

export default function SendNotificationScreen() {
  const { C, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { masterEnabled } = useNotificationPrefsStore();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [delaySeconds, setDelaySeconds] = useState('0');
  const [isSending, setIsSending] = useState(false);

  useScreenTracking('SendNotification');

  const sendNotification = async (customTitle?: string, customBody?: string, delay = 0) => {
    if (!masterEnabled) {
      Alert.alert('Notifications Disabled', 'Enable notifications in Settings → Notifications first.');
      return;
    }

    const t = customTitle ?? title.trim();
    const b = customBody ?? body.trim();

    if (!t || !b) {
      Alert.alert('Missing Fields', 'Please enter both a title and message.');
      return;
    }

    setIsSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await Notifications.scheduleNotificationAsync({
        content: { title: t, body: b },
        trigger: delay > 0
          ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delay }
          : null,
      });

      const msg = delay > 0
        ? `Notification scheduled in ${delay}s`
        : 'Notification sent immediately!';
      Alert.alert('Sent ✓', msg);

      setTitle('');
      setBody('');
      setDelaySeconds('0');
    } catch (e: any) {
      Alert.alert('Failed', e?.message || 'Could not send notification.');
    } finally {
      setIsSending(false);
    }
  };

  const applyTemplate = (tpl: typeof QUICK_TEMPLATES[0]) => {
    setTitle(`${tpl.emoji} ${tpl.title}`);
    setBody(tpl.body);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const delay = Math.max(0, parseInt(delaySeconds, 10) || 0);

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top,
          paddingBottom: 16,
          paddingHorizontal: 16,
          backgroundColor: C.surface,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={{ color: C.text, fontSize: 17, fontWeight: '700' }}>Send Notification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Disabled banner */}
        {!masterEnabled && (
          <View style={{ backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FECACA', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Bell size={16} color="#EF4444" />
            <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '600', flex: 1 }}>
              Notifications are disabled. Enable them in Settings → Notifications.
            </Text>
          </View>
        )}

        {/* Quick Templates */}
        <View>
          <Text style={{ color: C.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>
            Quick Templates
          </Text>
          <View style={{ gap: 8 }}>
            {QUICK_TEMPLATES.map((tpl) => (
              <TouchableOpacity
                key={tpl.title}
                onPress={() => applyTemplate(tpl)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isDark ? Colors.dark.surface : '#fff',
                  borderRadius: 14,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: C.border,
                  gap: 12,
                }}
              >
                <Text style={{ fontSize: 24 }}>{tpl.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.text, fontSize: 14, fontWeight: '600' }}>{tpl.title}</Text>
                  <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{tpl.body}</Text>
                </View>
                <Zap size={16} color={Colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Composer */}
        <View>
          <Text style={{ color: C.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>
            Custom Notification
          </Text>

          <View style={{ gap: 12 }}>
            <View>
              <Text style={{ color: C.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. 📚 Time to Learn!"
                placeholderTextColor={C.textMuted}
                style={{
                  backgroundColor: isDark ? Colors.dark.surface : '#fff',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: C.border,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: C.text,
                }}
              />
            </View>

            <View>
              <Text style={{ color: C.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>Message</Text>
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder="Enter notification message..."
                placeholderTextColor={C.textMuted}
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: isDark ? Colors.dark.surface : '#fff',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: C.border,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: C.text,
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
              />
            </View>

            <View>
              <Text style={{ color: C.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>
                Delay (seconds) — 0 = instant
              </Text>
              <TextInput
                value={delaySeconds}
                onChangeText={setDelaySeconds}
                placeholder="0"
                placeholderTextColor={C.textMuted}
                keyboardType="numeric"
                style={{
                  backgroundColor: isDark ? Colors.dark.surface : '#fff',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: C.border,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: C.text,
                  width: 120,
                }}
              />
            </View>
          </View>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          onPress={() => sendNotification(undefined, undefined, delay)}
          disabled={isSending || !masterEnabled}
          activeOpacity={0.8}
          style={{
            height: 56,
            borderRadius: 18,
            backgroundColor: isSending || !masterEnabled ? C.border : Colors.primary,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Send size={18} color="white" />
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>
            {isSending ? 'Sending...' : delay > 0 ? `Schedule in ${delay}s` : 'Send Now'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
