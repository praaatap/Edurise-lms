import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';
import { Timer } from 'lucide-react-native';

interface LiveCountdownProps {
  targetDate: string; // ISO string
}

export const LiveCountdown = ({ targetDate }: LiveCountdownProps) => {
  const { C, isDark } = useTheme();
  const [timeLeft, setTimeLeft] = useState<{
    h: string;
    m: string;
    s: string;
  }>({ h: '00', m: '00', s: '00' });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ h: '00', m: '00', s: '00' });
        return;
      }

      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({
        h: h.toString().padStart(2, '0'),
        m: m.toString().padStart(2, '0'),
        s: s.toString().padStart(2, '0'),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF', borderColor: Colors.primary + '30' }]}>
      <View style={styles.header}>
        <View style={styles.liveBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.liveText}>LIVE SESSION</Text>
        </View>
        <Timer size={16} color={Colors.primary} />
      </View>
      
      <Text style={[styles.startsIn, { color: C.textMuted }]}>Starts in:</Text>
      
      <View style={styles.timerRow}>
        <View style={styles.timeBlock}>
          <Text style={[styles.timeText, { color: C.text }]}>{timeLeft.h}</Text>
          <Text style={[styles.timeLabel, { color: C.textMuted }]}>HRS</Text>
        </View>
        <Text style={[styles.separator, { color: C.textMuted }]}>:</Text>
        <View style={styles.timeBlock}>
          <Text style={[styles.timeText, { color: C.text }]}>{timeLeft.m}</Text>
          <Text style={[styles.timeLabel, { color: C.textMuted }]}>MIN</Text>
        </View>
        <Text style={[styles.separator, { color: C.textMuted }]}>:</Text>
        <View style={styles.timeBlock}>
          <Text style={[styles.timeText, { color: C.text }]}>{timeLeft.s}</Text>
          <Text style={[styles.timeLabel, { color: C.textMuted }]}>SEC</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF444415',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  startsIn: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  timeBlock: {
    alignItems: 'center',
    minWidth: 40,
  },
  timeText: {
    fontSize: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  separator: {
    fontSize: 24,
    fontWeight: '300',
    marginBottom: 12,
  },
});
