import { Colors } from '@/core/theme/colors';
import { CourseCard } from '@/features/courses/components/CourseCard';
import { SearchBar } from '@/features/courses/components/SearchBar';
import { SmartSearch } from '@/features/ai/components/SmartSearch';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Course } from '@/shared/types';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { LegendList } from '@legendapp/list';
import * as Haptics from 'expo-haptics';
import { Href, useRouter } from 'expo-router';
import { Code, SlidersHorizontal, X } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORIES = [
  'All',
  'Web Dev',
  'Mobile App',
  'AI & ML',
  'Cloud Computing',
  'Cybersecurity',
  'Data Science',
];

const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const PRICE_RANGES = ['All', 'Free', 'Paid'];

function useExploreLogic() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { courses, searchQuery, searchCourses, bookmarks, toggleBookmark, aiRecommendedIds } = useCourseStore();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedPrice, setSelectedPrice] = useState('All');

  const filteredCourses = useMemo(() => {
    // If we have AI recommendations, prioritize them
    if (aiRecommendedIds.length > 0) {
      return courses.filter((c) => aiRecommendedIds.includes(c.id));
    }

    return courses.filter((course) => {
      const matchesSearch =
        !searchQuery ||
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' || course.category === selectedCategory;

      const matchesLevel =
        selectedLevel === 'All' || (course as any).level === selectedLevel;

      const matchesPrice =
        selectedPrice === 'All' ||
        (selectedPrice === 'Free' ? course.price === 0 : course.price > 0);

      return matchesSearch && matchesCategory && matchesLevel && matchesPrice;
    });
  }, [courses, searchQuery, selectedCategory, selectedLevel, selectedPrice, aiRecommendedIds]);

  const handleSearch = useCallback((text: string) => {
    searchCourses(text);
  }, [searchCourses]);

  const handleCategoryPress = useCallback((category: string) => {
    setSelectedCategory(category);
    Haptics.selectionAsync();
  }, []);

  const handleCoursePress = useCallback((course: Course) => {
    router.push(`/course/${course.id}` as Href);
  }, [router]);

  const resetFilters = useCallback(() => {
    setSelectedLevel('All');
    setSelectedPrice('All');
    setSelectedCategory('All');
    searchCourses('');
  }, [searchCourses]);

  return {
    insets,
    filteredCourses,
    searchQuery,
    bookmarks,
    toggleBookmark,
    selectedCategory,
    selectedLevel,
    setSelectedLevel,
    selectedPrice,
    setSelectedPrice,
    handleSearch,
    handleCategoryPress,
    handleCoursePress,
    resetFilters,
    aiRecommendedIds,
  };
}

export default function TechExploreScreen() {
  const {
    insets,
    filteredCourses,
    searchQuery,
    bookmarks,
    toggleBookmark,
    selectedCategory,
    selectedLevel,
    setSelectedLevel,
    selectedPrice,
    setSelectedPrice,
    handleSearch,
    handleCategoryPress,
    handleCoursePress,
    resetFilters,
    aiRecommendedIds,
  } = useExploreLogic();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%'], []);

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />,
    []
  );

  const renderItem = useCallback(({ item, index }: { item: Course, index: number }) => (
    <Animated.View 
      entering={FadeInUp.delay(index * 50).springify()}
      className="mb-5"
    >
      <CourseCard
        course={item}
        onPress={handleCoursePress}
        onToggleBookmark={toggleBookmark}
        isBookmarked={bookmarks.includes(item.id)}
      />
    </Animated.View>
  ), [handleCoursePress, toggleBookmark, bookmarks]);

  const ListHeader = useMemo(() => (
    <View className="px-1">
      <View className="px-1 mb-4 flex-row justify-between items-end">
        <View>
          <Text className="text-3xl font-extrabold text-text tracking-tighter">Tech Academy</Text>
          <Text className="text-base text-text-muted mt-1">Master latest tech skills</Text>
        </View>
        <TouchableOpacity 
          className="bg-primary/10 w-12 h-12 rounded-2xl items-center justify-center border border-primary/20"
          onPress={() => bottomSheetRef.current?.expand()}
        >
          <SlidersHorizontal size={22} color={Colors.primary} />
          {(selectedLevel !== 'All' || selectedPrice !== 'All') && (
            <View className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full items-center justify-center border-2 border-white">
              <View className="w-1.5 h-1.5 bg-white rounded-full" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={handleSearch}
        placeholder="Search React, Python, AWS..." 
      />

      <View className="mt-4">
        <SmartSearch />
      </View>

      <View className="mt-6 mb-4">
        <Text className="text-lg font-bold text-text mb-3 px-1">Tech Tracks</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 4 }}
        >
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <TouchableOpacity
                key={category}
                onPress={() => handleCategoryPress(category)}
                style={{
                  backgroundColor: isSelected ? Colors.primary : Colors.surface,
                  borderColor: isSelected ? Colors.primary : Colors.border,
                }}
                className="mr-3 px-5 py-2.5 rounded-full border"
              >
                <Text
                  style={{ color: isSelected ? 'white' : Colors.text }}
                  className="font-medium"
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      <View className="flex-row items-center justify-between mt-2 mb-4 px-1">
        <Text className="text-lg font-bold text-text">
          {aiRecommendedIds.length > 0 ? 'AI Recommended' : searchQuery ? 'Search Results' : 'Recommended for you'}
        </Text>
        <Text className="text-sm font-medium text-text-muted">{filteredCourses.length} results</Text>
      </View>
    </View>
  ), [searchQuery, handleSearch, selectedCategory, handleCategoryPress, selectedLevel, selectedPrice, filteredCourses.length, aiRecommendedIds]);

  return (
    <View className="flex-1 bg-background">
      <LegendList
        data={filteredCourses}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={340}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100
        }}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View className="mt-20">
            <EmptyState
              icon={Code}
              title="No matches found"
              message="Try adjusting your filters or search query."
              actionTitle="Reset All Filters"
              onAction={resetFilters}
            />
          </View>
        }
      />

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: '#E2E8F0', width: 40 }}
        backgroundStyle={{ borderRadius: 32, backgroundColor: 'white' }}
      >
        <BottomSheetView className="px-6 py-4">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-extrabold text-text">Filters</Text>
            <TouchableOpacity onPress={() => bottomSheetRef.current?.close()}>
               <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <Text className="text-base font-bold text-text mb-3">Skill Level</Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedLevel(level);
                }}
                className={`px-4 py-2.5 rounded-2xl border ${selectedLevel === level ? 'bg-primary border-primary' : 'bg-surface border-border'}`}
              >
                <Text className={`font-bold ${selectedLevel === level ? 'text-white' : 'text-text'}`}>{level}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-base font-bold text-text mb-3">Price</Text>
          <View className="flex-row flex-wrap gap-2 mb-8">
            {PRICE_RANGES.map((range) => (
              <TouchableOpacity
                key={range}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedPrice(range);
                }}
                className={`px-4 py-2.5 rounded-2xl border ${selectedPrice === range ? 'bg-primary border-primary' : 'bg-surface border-border'}`}
              >
                <Text className={`font-bold ${selectedPrice === range ? 'text-white' : 'text-text'}`}>{range}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            className="bg-primary w-full py-4 rounded-2xl items-center justify-center shadow-lg"
            onPress={() => bottomSheetRef.current?.close()}
          >
            <Text className="text-white text-lg font-bold">Apply Filters</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}