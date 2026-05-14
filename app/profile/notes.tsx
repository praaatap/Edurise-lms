import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { useTheme } from '@/core/theme/useTheme';
import { Colors } from '@/core/theme/colors';
import { ArrowLeft, StickyNote, Calendar } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useScreenTracking } from '@/shared/hooks/useScreenTracking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function NotesScreen() {
  const { notes, courses } = useCourseStore();
  const { C } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useScreenTracking('Notes');

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
    return result;
  }, [notes, courses]);

  return (
    <View className="flex-1" style={{ backgroundColor: C.background }}>
      {/* Header */}
      <View 
        className="px-4 pb-4 border-b flex-row items-center justify-between"
        style={{ paddingTop: insets.top, backgroundColor: C.surface, borderBottomColor: C.border }}
      >
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full" style={{ backgroundColor: C.surfaceElevated }}>
          <ArrowLeft size={20} color={C.text} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-text dark:text-dark-text">My Learning Notes</Text>
        <View className="w-10" />
      </View>

      <ScrollView 
        className="flex-1 px-5 pt-6"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {allNotes.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20 opacity-50">
            <StickyNote size={64} color={C.textMuted} />
            <Text className="text-lg font-bold mt-4" style={{ color: C.text }}>No notes yet</Text>
            <Text className="text-sm text-center px-10 mt-2" style={{ color: C.textMuted }}>
              Your notes from courses will appear here. Start learning and save important concepts!
            </Text>
          </View>
        ) : (
          allNotes.map((item, idx) => (
            <Animated.View
              entering={FadeInDown.delay(idx * 50)}
              key={`${item.courseId}-${item.index}`}
              className="mb-6 p-5 rounded-[32px] border border-border/40 dark:border-dark-border shadow-sm"
              style={{ backgroundColor: C.surface }}
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center flex-1 mr-4">
                   <View className="w-8 h-8 rounded-xl bg-primary/10 items-center justify-center mr-3">
                     <StickyNote size={16} color={Colors.primary} />
                   </View>
                   <Text className="text-xs font-bold text-primary uppercase tracking-wider flex-1" numberOfLines={1}>
                     {item.courseTitle}
                   </Text>
                </View>
                {/* Could add delete functionality here if desired */}
              </View>
              
              <Text className="text-[15px] text-text dark:text-dark-text leading-6 font-medium">
                {item.note}
              </Text>
              
              <View className="mt-4 pt-4 border-t border-border/20 flex-row items-center opacity-60">
                <Calendar size={12} color={C.textMuted} />
                <Text className="text-[10px] font-bold text-text-muted dark:text-dark-text-muted ml-1.5 uppercase tracking-tighter">
                  Saved during lesson
                </Text>
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
