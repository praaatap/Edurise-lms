import { View } from 'react-native';
import { Image } from 'expo-image';

interface CourseHeroProps {
  insets: { top: number };
  thumbnail: string;
}

export const CourseHero = ({ insets, thumbnail }: CourseHeroProps) => {
  return (
    <View className="px-4 mt-2" style={{ paddingTop: insets.top + 60 }}>
      <Image 
        source={thumbnail} 
        className="w-full h-[280px] rounded-[32px] shadow-xl" 
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={300}
      />
    </View>
  );
};
