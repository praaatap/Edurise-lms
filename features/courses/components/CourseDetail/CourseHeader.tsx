import { View, TouchableOpacity } from 'react-native';
import { ArrowLeft, Share2, Bookmark, BookmarkCheck } from 'lucide-react-native';
import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';
import { useRouter } from 'expo-router';

interface CourseHeaderProps {
  insets: { top: number };
  isBookmarked: boolean;
  onShare: () => void;
  onToggleBookmark: () => void;
}

export const CourseHeader = ({ insets, isBookmarked, onShare, onToggleBookmark }: CourseHeaderProps) => {
  const router = useRouter();
  const { C } = useTheme();

  return (
    <View 
      style={{ paddingTop: insets.top + 8 }} 
      className="absolute top-0 left-0 right-0 flex-row justify-between px-5 z-50"
    >
      <TouchableOpacity
        style={{ backgroundColor: C.surface, borderColor: C.border }}
        className="border w-11 h-11 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color={C.text} />
      </TouchableOpacity>

      <View className="flex-row gap-3">
        <TouchableOpacity
          style={{ backgroundColor: C.surface, borderColor: C.border }}
          className="border w-11 h-11 rounded-full items-center justify-center shadow-lg"
          onPress={onShare}
        >
          <Share2 size={22} color={C.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: C.surface, borderColor: C.border }}
          className="border w-11 h-11 rounded-full items-center justify-center shadow-lg"
          onPress={onToggleBookmark}
        >
          {isBookmarked ? (
            <BookmarkCheck size={22} color={Colors.primary} />
          ) : (
            <Bookmark size={22} color={C.text} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
