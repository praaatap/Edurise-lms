import { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { useTheme } from '@/core/theme/useTheme';
import { Colors } from '@/core/theme/colors';
import { StickyNote, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

export const ProfileNotes = () => {
  const { notes, courses } = useCourseStore();
  const { C } = useTheme();
  const router = useRouter();

  const allNotes = useMemo(() => {
    const result: { courseTitle: string; courseId: string; note: string; index: number }[] = [];
    Object.entries(notes).forEach(([courseId, noteList]) => {
      const course = courses.find((c) => c.id === courseId);
      noteList.forEach((note, index) => {
        result.push({
          courseId,
          courseTitle: course?.title || 'Unknown Course',
          note,
          index,
        });
      });
    });
    // Sort by most recent first (based on logic in addNote where new notes are prepended)
    return result;
  }, [notes, courses]);

  if (allNotes.length === 0) return null;

  return (
    <View className="px-5 mb-8">
      <Text className="text-[11px] font-bold text-text-muted dark:text-dark-text-muted uppercase tracking-widest mb-3 ml-1">
        My Learning Notes
      </Text>
      
      {allNotes.slice(0, 5).map((item, idx) => (
        <Animated.View
          entering={FadeInDown.delay(idx * 100)}
          key={`${item.courseId}-${item.index}`}
          className="mb-3 p-4 rounded-3xl border border-border/40 dark:border-dark-border shadow-sm"
          style={{ backgroundColor: C.surface }}
        >
          <View className="flex-row items-center mb-2">
            <View className="w-6 h-6 rounded-full bg-primary/10 items-center justify-center mr-2">
              <StickyNote size={12} color={Colors.primary} />
            </View>
            <Text className="text-[10px] font-bold text-primary uppercase tracking-tight flex-1" numberOfLines={1}>
              {item.courseTitle}
            </Text>
          </View>
          
          <Text className="text-sm text-text dark:text-dark-text leading-5 font-medium" numberOfLines={3}>
            {item.note}
          </Text>
          
          <View className="flex-row justify-end mt-2">
             <Text className="text-[10px] text-text-muted dark:text-dark-text-muted font-bold">
               TAP TO VIEW FULL
             </Text>
          </View>
        </Animated.View>
      ))}

      {allNotes.length > 0 && (
        <TouchableOpacity 
          className="flex-row items-center justify-center py-2"
          activeOpacity={0.7}
          onPress={() => router.push('/profile/notes')}
        >
          <Text className="text-primary font-bold text-xs mr-1">
            {allNotes.length > 5 ? `View All ${allNotes.length} Notes` : 'Manage All Notes'}
          </Text>
          <ChevronRight size={14} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};
