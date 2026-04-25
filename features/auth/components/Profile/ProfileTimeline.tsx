import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';

interface ProfileTimelineProps {
  timeline: any[];
}

export const ProfileTimeline = ({ timeline }: ProfileTimelineProps) => {
  const { C } = useTheme();

  return (
    <View className="px-5 mb-8">
      <Text className="text-[11px] font-bold text-text-muted dark:text-dark-text-muted uppercase tracking-widest mb-3 ml-1">Learning Journey</Text>
      <View
        className="rounded-3xl p-5 shadow-sm border border-border/50 dark:border-dark-border"
        style={{ backgroundColor: C.surface }}
      >
        {(timeline.length > 0 ? timeline : [{ id: 'join-event', action: 'Joined Edurise LMS', type: 'join' as const, timestamp: Date.now() }]).map((item, index, arr) => (
          <View key={item.id || index} className="flex-row">
            <View className="items-center mr-4">
              <View className={`w-8 h-8 rounded-full items-center justify-center z-10 
                ${item.type === 'complete' ? 'bg-emerald-100 dark:bg-emerald-950/80' :
                  item.type === 'enroll' ? 'bg-blue-100 dark:bg-blue-950/80' :
                  item.type === 'quiz' ? 'bg-orange-100 dark:bg-orange-950/80' :
                  item.type === 'bookmark' ? 'bg-indigo-100 dark:bg-indigo-950/80' : 'bg-primary-lighter dark:bg-primary/20'}`}>
                <Ionicons
                  name={
                    item.type === 'complete' ? 'checkmark-circle' :
                    item.type === 'enroll' ? 'book' :
                    item.type === 'quiz' ? 'trophy' :
                    item.type === 'bookmark' ? 'bookmark' : 'person-add'
                  }
                  size={16}
                  color={
                    item.type === 'complete' ? '#10B981' :
                    item.type === 'enroll' ? '#3B82F6' :
                    item.type === 'quiz' ? '#F59E0B' :
                    item.type === 'bookmark' ? '#6366F1' : Colors.primary
                  }
                />
              </View>
              {index !== arr.length - 1 && (
                <View className="w-0.5 flex-1 -my-1" style={{ backgroundColor: C.border }} />
              )}
            </View>
            <View className="flex-1 pb-6 pt-1">
              <Text className="text-sm font-bold text-text dark:text-dark-text mb-1">{item.action}</Text>
              <Text className="text-xs text-text-muted dark:text-dark-text-muted">
                {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};
