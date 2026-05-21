import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';

interface CourseHeroProps {
  insets: { top: number };
  thumbnail: string;
  isEnrolled?: boolean;
  isCompleted?: boolean;
  lessonsCount?: number;
}

export const CourseHero = ({
  insets,
  thumbnail,
  isEnrolled = false,
  isCompleted = false,
  lessonsCount = 12,
}: CourseHeroProps) => {
  const { C } = useTheme();

  return (
    <View className="px-4 mt-2" style={{ paddingTop: insets.top + 60 }}>
      <View className="rounded-[34px] overflow-hidden border shadow-xl" style={{ borderColor: C.border, backgroundColor: C.surface }}>
        {/* Dynamic Status badge matching CourseCard */}
        <View className="absolute top-4 left-4 z-10 flex-row gap-2">
          {isCompleted ? (
            <View className="rounded-full bg-emerald-500 px-3 py-1.5 flex-row items-center gap-1">
              <Ionicons name="checkmark-circle" size={11} color="white" />
              <Text className="text-[10px] font-bold tracking-[1.5px] text-white">DONE</Text>
            </View>
          ) : isEnrolled ? (
            <View className="rounded-full bg-primary px-3 py-1.5 flex-row items-center gap-1">
              <Ionicons name="play-circle" size={11} color="white" />
              <Text className="text-[10px] font-bold tracking-[1.5px] text-white">ENROLLED</Text>
            </View>
          ) : (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.92)' }} className="rounded-full px-3 py-1.5">
              <Text className="text-[10px] font-bold tracking-[1.5px] text-text">NEW</Text>
            </View>
          )}
        </View>

        <Image
          source={thumbnail}
          className="w-full h-[300px]"
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={300}
        />

        {/* Dynamic Lessons badge & Featured matching CourseCard */}
        <View className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-10" style={{ backgroundColor: 'rgba(15,23,42,0.24)' }}>
          <View className="flex-row items-center justify-between">
            {/* Dynamic Lessons Count */}
            <View className="rounded-full bg-black/55 px-3 py-1.5 flex-row items-center gap-1">
              <Ionicons name="play" size={9} color="white" />
              <Text className="text-[11px] font-semibold tracking-wider text-white">
                {lessonsCount} LESSONS
              </Text>
            </View>
            <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: Colors.primary }}>
              <Text className="text-white text-[11px] font-extrabold">FEATURED</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};
