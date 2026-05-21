import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';

interface CourseHeroProps {
  insets: { top: number };
  thumbnail: string;
}

export const CourseHero = ({ insets, thumbnail }: CourseHeroProps) => {
  const { C } = useTheme();

  return (
    <View className="px-4 mt-2" style={{ paddingTop: insets.top + 60 }}>
      <View className="rounded-[34px] overflow-hidden border shadow-xl" style={{ borderColor: C.border, backgroundColor: C.surface }}>
        <View className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(15,23,42,0.72)' }}>
          <Text className="text-white text-[11px] font-extrabold tracking-[1.4px] uppercase">Course Preview</Text>
        </View>

        <Image
          source={thumbnail}
          className="w-full h-[300px]"
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={300}
        />

        <View className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-10" style={{ backgroundColor: 'rgba(15,23,42,0.24)' }}>
          <View className="flex-row items-center justify-between">
            <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
              <Text className="text-white text-[11px] font-bold">Tap to explore lessons</Text>
            </View>
            <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: Colors.primary }}>
              <Text className="text-white text-[11px] font-extrabold">Featured</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};
