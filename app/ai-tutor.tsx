import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';
import { processUserMessage } from '@/features/ai/services/groqAgent';
import { useAIStore } from '@/features/ai/store/aiStore';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { LegendList } from '@legendapp/list';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bot, SendHorizonal, Sparkles, User, Lightbulb, Camera, Image as ImageIcon, X, ArrowRight } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

const SUGGESTED_PROMPTS = [
  "Recommend a React course",
  "Explain State Management",
  "How much are courses?",
];

export default function AITutorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const listRef = useRef<any>(null);
  const { C, isDark } = useTheme();
  
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { messages, isTyping } = useAIStore();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && listRef.current) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, messages[messages.length - 1]?.text.length]);

  const handleSend = async (text: string) => {
    const hasImage = !!selectedImage;
    const hasText = !!text.trim();
    if (!hasText && !hasImage) return;

    setInputText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // When an image is attached, prepend context so the text-model can respond meaningfully
    let messageToSend = text.trim();
    if (hasImage && !hasText) {
      messageToSend = '[User attached an image. Please acknowledge this and ask what they would like to know about it or how you can help.]';
    } else if (hasImage && hasText) {
      messageToSend = `[User attached an image along with this message]: ${text.trim()}`;
    }

    setSelectedImage(null);
    await processUserMessage(messageToSend);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    const isUser = item.sender === 'user';
    const isLast = index === messages.length - 1;
    const { getCourseById } = useCourseStore.getState();
    const course = item.courseId ? getCourseById(item.courseId) : null;

    return (
      <View>
        <Animated.View
          entering={FadeInDown.duration(300).springify()}
          className={`w-full px-4 mb-5 flex-row ${isUser ? 'justify-end' : 'justify-start'}`}
          style={{ paddingBottom: isLast && !course ? 20 : 0 }}
        >
          {!isUser && (
            <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3 mt-auto shadow-sm">
              <Bot size={16} color={Colors.primary} />
            </View>
          )}

          <View
            className={`max-w-[82%] rounded-3xl px-5 py-3.5 shadow-sm ${
              isUser
                ? 'bg-primary rounded-br-sm'
                : 'rounded-bl-sm border'
            }`}
            style={!isUser ? { backgroundColor: C.surface, borderColor: C.border } : undefined}
          >
            <Text
              className={`text-[15px] leading-6 tracking-wide ${
                isUser ? 'text-white font-medium' : 'text-text dark:text-dark-text'
              }`}
            >
              {item.text}
            </Text>
          </View>

          {isUser && (
            <View className="w-8 h-8 rounded-full ml-3 mt-auto shadow-sm items-center justify-center" style={{ backgroundColor: C.surfaceElevated }}>
              <User size={16} color={Colors.textMuted} />
            </View>
          )}
        </Animated.View>

        {course && (
          <Animated.View 
            entering={FadeInDown.delay(200)}
            className="px-4 ml-11 mb-8"
          >
            <TouchableOpacity
              onPress={() => router.push(`/course/${course.id}`)}
              className="bg-white dark:bg-dark-surface p-4 rounded-3xl border border-primary/20 shadow-sm flex-row items-center"
              style={{ backgroundColor: C.surface }}
            >
              <Image source={{ uri: course.thumbnail }} className="w-14 h-14 rounded-2xl mr-4" />
              <View className="flex-1">
                <Text className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Recommended Course</Text>
                <Text className="text-sm font-bold text-text dark:text-dark-text" numberOfLines={1}>{course.title}</Text>
                <Text className="text-[10px] text-text-muted dark:text-dark-text-muted mt-1">{course.instructor.name}</Text>
              </View>
              <View className="w-10 h-10 rounded-full bg-primary items-center justify-center ml-2">
                <ArrowRight size={20} color="white" />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    );
  }, [messages.length, C, router]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View
        className="border-b px-4 pb-4 shadow-sm z-10 flex-row items-center justify-between"
        style={{ backgroundColor: C.surface, borderBottomColor: C.border, paddingTop: insets.top }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full"
          style={{ backgroundColor: C.surfaceElevated }}
        >
          <ArrowLeft size={22} color={C.text} />
        </TouchableOpacity>
        
        <View className="items-center flex-row">
          <Sparkles size={16} color={Colors.primary} className="mr-2" />
          <Text className="text-lg font-bold text-text dark:text-dark-text tracking-tight ml-2">AI Tutor</Text>
        </View>
        
        <View className="w-10" />
      </View>

      <View className="flex-1">
        <LegendList
          ref={listRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item: any) => item.id}
          estimatedItemSize={80}
          contentContainerStyle={{ paddingTop: 24, paddingBottom: 100 }}
        />
        
        {isTyping && (
          <Animated.View entering={FadeIn} exiting={FadeOut} className="px-4 mb-4 flex-row items-end absolute bottom-4 left-0">
            <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3 shadow-sm">
              <Bot size={16} color={Colors.primary} />
            </View>
            <View
              style={{ backgroundColor: C.surface, borderColor: C.border }}
              className="border rounded-3xl rounded-bl-sm px-5 py-4 shadow-sm flex-row items-center gap-1.5"
            >
              <View className="w-2.5 h-2.5 bg-primary/40 rounded-full animate-pulse" />
              <View className="w-2.5 h-2.5 bg-primary/40 rounded-full animate-pulse" />
              <View className="w-2.5 h-2.5 bg-primary/40 rounded-full animate-pulse" />
            </View>
          </Animated.View>
        )}
      </View>

      <View
        className="border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: insets.bottom || 16, backgroundColor: C.surface, borderTopColor: C.border }}
      >
        {messages.length < 3 && !isTyping && (
          <View className="pt-3 pb-2 px-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSend(prompt)}
                  className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-full flex-row items-center"
                >
                  <Lightbulb size={12} color={Colors.primary} className="mr-1.5" />
                  <Text className="text-primary font-semibold text-xs">{prompt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View className="px-4 pt-3 pb-2">
          {selectedImage && (
            <Animated.View 
              entering={FadeInDown} 
              exiting={FadeOut}
              className="mb-3 relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-sm"
            >
              <Image source={{ uri: selectedImage }} className="w-full h-full" />
              <TouchableOpacity 
                onPress={() => setSelectedImage(null)}
                className="absolute top-1 right-1 bg-black/50 w-6 h-6 rounded-full items-center justify-center"
              >
                <X size={14} color="white" />
              </TouchableOpacity>
            </Animated.View>
          )}

          <View className="flex-row items-end rounded-3xl px-2 py-1 shadow-inner border" style={{ backgroundColor: C.surfaceElevated, borderColor: C.border }}>
            <TouchableOpacity
              onPress={pickImage}
              className="w-10 h-10 mb-1 items-center justify-center"
            >
              <ImageIcon size={20} color={Colors.textMuted} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={takePhoto}
              className="w-10 h-10 mb-1 items-center justify-center"
            >
              <Camera size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            <TextInput
              className="flex-1 min-h-[44px] max-h-32 px-2 py-2 text-[15px] text-text dark:text-dark-text"
              placeholder="Ask me anything..."
              placeholderTextColor={C.textMuted}
              multiline
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity
              className={`w-10 h-10 mb-1 rounded-full items-center justify-center ${
                (inputText.trim() || selectedImage) ? 'bg-primary' : (isDark ? 'bg-dark-surface-elevated' : 'bg-slate-100')
              }`}
              onPress={() => handleSend(inputText)}
              disabled={(!inputText.trim() && !selectedImage) || isTyping}
            >
              <SendHorizonal size={18} color={(inputText.trim() || selectedImage) ? 'white' : '#94A3B8'} />
            </TouchableOpacity>
          </View>
          <Text className="text-center text-[10px] text-slate-400 mt-2 font-medium">
            AI can make mistakes. Verify important course information.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
