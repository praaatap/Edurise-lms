import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';
import { CourseCard } from '@/features/courses/components/CourseCard';
import { SearchBar } from '@/features/courses/components/SearchBar';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { coursesApi } from '@/features/courses/api/coursesApi';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Course } from '@/shared/types';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { LegendList } from '@legendapp/list';
import * as Haptics from 'expo-haptics';
import { Href, useRouter } from 'expo-router';
import { Code, SlidersHorizontal, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, useWindowDimensions, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { analytics } from '@/core/services/analyticsService';

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

const SORT_TO_PARAM: Record<string, string> = {
  'Newest': 'createdAt:desc',
  'Price: Low to High': 'price:asc',
  'Price: High to Low': 'price:desc',
  'Highest Rated': 'rating:desc',
};

function useExploreLogic() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { bookmarks, toggleBookmark } = useCourseStore();

  const [results, setResults] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedPrice, setSelectedPrice] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchResults = useCallback(async (params: {
    search?: string;
    category?: string;
    difficulty?: string;
    sort?: string;
  }) => {
    setIsLoading(true);
    try {
      const query: Record<string, string> = { limit: '50' };
      if (params.search) query.search = params.search;
      if (params.category && params.category !== 'All') query.category = params.category;
      if (params.difficulty && params.difficulty !== 'All') query.difficulty = params.difficulty.toUpperCase();
      if (params.sort) query.sort = params.sort;

      const courses = await coursesApi.fetchCourses(query as any);

      // Client-side price filter (backend doesn't have it)
      const priceFilter = selectedPrice;
      const filtered = courses.filter(c => {
        if (priceFilter === 'Free') return c.price === 0;
        if (priceFilter === 'Paid') return c.price > 0;
        return true;
      });

      setResults(filtered);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPrice]);

  // Fetch when filters change
  useEffect(() => {
    fetchResults({
      search: searchQuery,
      category: selectedCategory,
      difficulty: selectedLevel,
      sort: SORT_TO_PARAM[sortBy],
    });
  }, [selectedCategory, selectedLevel, sortBy]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchResults({
        search: text,
        category: selectedCategory,
        difficulty: selectedLevel,
        sort: SORT_TO_PARAM[sortBy],
      });
      if (text.length > 2) analytics.logEvent('search_performed', { query: text });
    }, 400);
  }, [selectedCategory, selectedLevel, sortBy, fetchResults]);

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
    setSearchQuery('');
    setSortBy('Newest');
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchResults({
      search: searchQuery,
      category: selectedCategory,
      difficulty: selectedLevel,
      sort: SORT_TO_PARAM[sortBy],
    });
  }, [fetchResults, searchQuery, selectedCategory, selectedLevel, sortBy]);

  const listPaddingHorizontal = width > 600 ? (width - 600) / 2 : 16;

  return {
    insets,
    filteredCourses: results,
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
    sortBy,
    setSortBy,
    aiRecommendedIds: [] as string[],
    handleRefresh,
    isLoading,
    listPaddingHorizontal,
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
    sortBy,
    setSortBy,
    aiRecommendedIds,
    handleRefresh,
    isLoading,
    listPaddingHorizontal,
  } = useExploreLogic();
  const { C, isDark } = useTheme();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['65%'], []);

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />,
    []
  );

  const renderItem = useCallback(({ item }: { item: Course }) => (
    <View className="mb-5">
      <CourseCard
        course={item}
        onPress={handleCoursePress}
        onToggleBookmark={toggleBookmark}
        isBookmarked={bookmarks.includes(item.id)}
      />
    </View>
  ), [handleCoursePress, toggleBookmark, bookmarks]);

  const ListHeader = useMemo(() => (
    <View className="px-1">
      <View className="px-1 mb-4 flex-row justify-between items-end">
        <View>
          <Text className="text-3xl font-extrabold text-text dark:text-dark-text tracking-tighter">Tech Academy</Text>
          <Text className="text-base text-text-muted dark:text-dark-text-muted mt-1">Master latest tech skills</Text>
        </View>
        <TouchableOpacity
          className="bg-primary/10 w-12 h-12 rounded-2xl items-center justify-center border border-primary/20"
          onPress={() => bottomSheetRef.current?.expand()}
        >
          <SlidersHorizontal size={22} color={Colors.primary} />
          {(selectedLevel !== 'All' || selectedPrice !== 'All') && (
            <View className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full items-center justify-center border-2 border-white dark:border-dark-bg">
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

      <View className="mt-4" />

      <View className="mt-6 mb-4">
        <Text className="text-lg font-bold text-text dark:text-dark-text mb-3 px-1">Tech Tracks</Text>
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
                  backgroundColor: isSelected ? Colors.primary : C.surface,
                  borderColor: isSelected ? Colors.primary : C.border,
                }}
                className="mr-3 px-5 py-2.5 rounded-full border"
              >
                <Text
                  style={{ color: isSelected ? 'white' : C.text }}
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
        <Text className="text-lg font-bold text-text dark:text-dark-text">
          {aiRecommendedIds.length > 0 ? 'AI Recommended' : searchQuery ? 'Search Results' : 'Recommended for you'}
        </Text>
        <Text className="text-sm font-medium text-text-muted dark:text-dark-text-muted">{filteredCourses.length} results</Text>
      </View>
    </View>
  ), [searchQuery, handleSearch, selectedCategory, handleCategoryPress, selectedLevel, selectedPrice, filteredCourses.length, aiRecommendedIds, C, sortBy]);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background dark:bg-dark-bg"
    >
      <LegendList
        data={filteredCourses}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={340}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={Colors.primary} />
        }
        contentContainerStyle={{
          paddingHorizontal: listPaddingHorizontal,
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
        handleIndicatorStyle={{ backgroundColor: isDark ? '#374151' : '#E2E8F0', width: 40 }}
        backgroundStyle={{ borderRadius: 32, backgroundColor: C.surface }}
      >
        <BottomSheetView className="px-6 py-4 pb-12">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-extrabold text-text dark:text-dark-text">Filters</Text>
            <TouchableOpacity onPress={() => bottomSheetRef.current?.close()}>
              <X size={24} color={C.text} />
            </TouchableOpacity>
          </View>

          <Text className="text-base font-bold text-text dark:text-dark-text mb-3">Skill Level</Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedLevel(level);
                }}
                style={{
                  backgroundColor: selectedLevel === level ? Colors.primary : C.surfaceElevated,
                  borderColor: selectedLevel === level ? Colors.primary : C.border,
                }}
                className="px-4 py-2.5 rounded-2xl border"
              >
                <Text style={{ color: selectedLevel === level ? 'white' : C.text }} className="font-bold">{level}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-base font-bold text-text dark:text-dark-text mb-3">Price</Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {PRICE_RANGES.map((range) => (
              <TouchableOpacity
                key={range}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedPrice(range);
                }}
                style={{
                  backgroundColor: selectedPrice === range ? Colors.primary : C.surfaceElevated,
                  borderColor: selectedPrice === range ? Colors.primary : C.border,
                }}
                className="px-4 py-2.5 rounded-2xl border"
              >
                <Text style={{ color: selectedPrice === range ? 'white' : C.text }} className="font-bold">{range}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-base font-bold text-text dark:text-dark-text mb-3">Sort By</Text>
          <View className="flex-row flex-wrap gap-2 mb-8">
            {['Newest', 'Price: Low to High', 'Price: High to Low', 'Highest Rated'].map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSortBy(option);
                }}
                style={{
                  backgroundColor: sortBy === option ? Colors.primary : C.surfaceElevated,
                  borderColor: sortBy === option ? Colors.primary : C.border,
                }}
                className="px-4 py-2.5 rounded-2xl border"
              >
                <Text style={{ color: sortBy === option ? 'white' : C.text }} className="font-bold">{option}</Text>
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
    </KeyboardAvoidingView>
  );
}