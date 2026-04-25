import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { fetchUnsplashImages, UnsplashImage } from '@/core/services/unsplashService';
import { Colors } from '@/core/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface UnsplashPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  onPickFromGallery: () => void;
}

export const UnsplashPicker = ({ visible, onClose, onSelect, onPickFromGallery }: UnsplashPickerProps) => {
  const insets = useSafeAreaInsets();
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('portrait');

  const loadImages = async (query: string) => {
    setLoading(true);
    const results = await fetchUnsplashImages(query);
    setImages(results);
    setLoading(false);
  };

  useEffect(() => {
    if (visible) {
      loadImages(search);
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-background" style={{ paddingTop: 20 }}>
        <View className="px-5 flex-row items-center justify-between mb-6">
          <Text className="text-xl font-bold text-text">Choose Profile Photo</Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View className="px-5 mb-6 flex-row gap-2">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-2xl px-4 h-12">
            <Ionicons name="search" size={18} color="#666" />
            <TextInput
              className="flex-1 ml-2 text-base"
              placeholder="Search Unsplash..."
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => loadImages(search)}
            />
          </View>
          <TouchableOpacity 
            onPress={onPickFromGallery}
            className="w-12 h-12 bg-primary/10 rounded-2xl items-center justify-center border border-primary/20"
          >
            <Ionicons name="image" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: insets.bottom + 20 }}>
            <View className="flex-row flex-wrap justify-between">
              {images.map((img) => (
                <TouchableOpacity
                  key={img.id}
                  className="w-[31%] aspect-square mb-3 rounded-2xl overflow-hidden"
                  onPress={() => onSelect(img.urls.regular)}
                >
                  <Image
                    source={img.urls.small}
                    className="w-full h-full"
                    contentFit="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
            {images.length === 0 && (
              <View className="items-center mt-10">
                <Text className="text-text-muted">No images found. Try another search.</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};
