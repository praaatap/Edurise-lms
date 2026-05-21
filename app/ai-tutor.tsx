import { analytics } from '@/core/services/analyticsService';
import { clarityService } from '@/core/services/clarityService';
import { trackUserAction } from '@/core/services/sentryPerformance';
import { Colors } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/useTheme';
import { processUserMessage } from '@/features/ai/services/groqAgent';
import { useAIStore } from '@/features/ai/store/aiStore';
import { useCourseStore } from '@/features/courses/store/courseStore';
import { useScreenTracking } from '@/shared/hooks/useScreenTracking';
import { LegendList } from '@legendapp/list';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Bot, Camera, Image as ImageIcon, Lightbulb, SendHorizonal, Sparkles, User, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SUGGESTED_PROMPTS = [
  "Recommend a React course",
  "Explain State Management",
  "How much are courses?",
];

type InlineNode =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string }
  | { type: 'code'; text: string }
  | { type: 'link'; text: string; href: string };

function parseInlineMarkdown(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  const pattern = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|\*([^*]+)\*|_([^_]+)_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    }

    if (match[2] && match[3]) {
      nodes.push({ type: 'link', text: match[2], href: match[3] });
    } else if (match[4] || match[5]) {
      nodes.push({ type: 'bold', text: match[4] ?? match[5] ?? '' });
    } else if (match[6]) {
      nodes.push({ type: 'code', text: match[6] });
    } else if (match[7] || match[8]) {
      nodes.push({ type: 'italic', text: match[7] ?? match[8] ?? '' });
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', text: text.slice(lastIndex) });
  }

  return nodes;
}

function MarkdownText({ text, color }: { text: string; color: string }) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let codeBlock: string[] = [];
  let inCodeBlock = false;

  const flushCodeBlock = () => {
    if (!codeBlock.length) return;
    blocks.push(
      <View key={`code-${blocks.length}`} style={{ backgroundColor: 'rgba(15,23,42,0.06)' }} className="rounded-2xl p-3 my-2 border border-slate-200">
        <Text style={{ color: '#0F172A', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13, lineHeight: 20 }}>
          {codeBlock.join('\n')}
        </Text>
      </View>,
    );
    codeBlock = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlock.push(line);
      return;
    }

    if (!trimmed) {
      blocks.push(<View key={`gap-${index}`} style={{ height: 10 }} />);
      return;
    }

    if (/^#{1,3}\s/.test(trimmed)) {
      const level = trimmed.match(/^#{1,3}/)?.[0].length ?? 1;
      const headingText = trimmed.replace(/^#{1,3}\s*/, '');
      blocks.push(
        <Text
          key={`heading-${index}`}
          style={{
            color,
            fontSize: level === 1 ? 20 : level === 2 ? 18 : 16,
            fontWeight: '800',
            marginTop: 2,
            marginBottom: 4,
          }}
        >
          {headingText}
        </Text>,
      );
      return;
    }

    if (/^([-*])\s+/.test(trimmed)) {
      const bulletText = trimmed.replace(/^([-*])\s+/, '');
      blocks.push(
        <View key={`bullet-${index}`} className="flex-row items-start my-1">
          <Text style={{ color, fontSize: 15, lineHeight: 22, marginRight: 8 }}>•</Text>
          <Text style={{ color, fontSize: 15, lineHeight: 22, flex: 1 }}>
            {parseInlineMarkdown(bulletText).map((node, nodeIndex) => {
              if (node.type === 'bold') {
                return <Text key={nodeIndex} style={{ fontWeight: '800' }}>{node.text}</Text>;
              }
              if (node.type === 'italic') {
                return <Text key={nodeIndex} style={{ fontStyle: 'italic' }}>{node.text}</Text>;
              }
              if (node.type === 'code') {
                return <Text key={nodeIndex} style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', backgroundColor: '#E2E8F0' }}>{node.text}</Text>;
              }
              if (node.type === 'link') {
                return <Text key={nodeIndex} style={{ color: Colors.primary, textDecorationLine: 'underline' }}>{node.text}</Text>;
              }
              return <Text key={nodeIndex}>{node.text}</Text>;
            })}
          </Text>
        </View>,
      );
      return;
    }

    blocks.push(
      <Text key={`para-${index}`} style={{ color, fontSize: 15, lineHeight: 22 }}>
        {parseInlineMarkdown(line).map((node, nodeIndex) => {
          if (node.type === 'bold') {
            return <Text key={nodeIndex} style={{ fontWeight: '800' }}>{node.text}</Text>;
          }
          if (node.type === 'italic') {
            return <Text key={nodeIndex} style={{ fontStyle: 'italic' }}>{node.text}</Text>;
          }
          if (node.type === 'code') {
            return <Text key={nodeIndex} style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', backgroundColor: '#E2E8F0' }}>{node.text}</Text>;
          }
          if (node.type === 'link') {
            return <Text key={nodeIndex} style={{ color: Colors.primary, textDecorationLine: 'underline' }}>{node.text}</Text>;
          }
          return <Text key={nodeIndex}>{node.text}</Text>;
        })}
      </Text>,
    );
  });

  if (inCodeBlock) {
    flushCodeBlock();
  }

  return <View style={{ gap: 2 }}>{blocks}</View>;
}

export default function AITutorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const listRef = useRef<any>(null);
  const { C } = useTheme();
  const lightSurface = '#FFFFFF';
  const lightBorder = '#E2E8F0';
  const lightTextMuted = '#64748B';
  
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { messages, isTyping } = useAIStore();

  useScreenTracking('AITutor');

  useEffect(() => {
    analytics.logEvent('ai_chat_open');
    clarityService.logEvent('ai_chat_opened');
  }, []);

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

    trackUserAction('ai_message_sent', { length: text.trim().length, hasImage });
    clarityService.logEvent('ai_message_sent', { length: text.trim().length, has_image: hasImage });
    if (hasImage) clarityService.logEvent('ai_image_attached');
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
            style={!isUser ? { backgroundColor: lightSurface, borderColor: lightBorder } : undefined}
          >
            {isUser ? (
              <Text className="text-[15px] leading-6 tracking-wide text-white font-medium">
                {item.text}
              </Text>
            ) : (
              <MarkdownText text={item.text} color="#0F172A" />
            )}
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
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View
        className="px-4 pb-4 z-10 flex-row items-center justify-between"
        style={{ backgroundColor: '#F8FAFC', paddingTop: insets.top }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full"
          style={{ backgroundColor: '#F1F5F9' }}
        >
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        
        <View className="items-center flex-row">
          <Sparkles size={16} color={Colors.primary} className="mr-2" />
          <Text className="text-lg font-bold text-text tracking-tight ml-2">AITV Assistance</Text>
        </View>
        
        <View className="w-10" />
      </View>

      <View className="flex-1" style={{ backgroundColor: '#F8FAFC' }}>
        <LegendList
          ref={listRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item: any) => item.id}
          estimatedItemSize={80}
          contentContainerStyle={{ paddingTop: 24, paddingBottom: 100, backgroundColor: '#F8FAFC' }}
          style={{ backgroundColor: '#F8FAFC' }}
        />
        
        {isTyping && (
          <Animated.View entering={FadeIn} exiting={FadeOut} className="px-4 mb-4 flex-row items-end absolute bottom-4 left-0">
            <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3 shadow-sm">
              <Bot size={16} color={Colors.primary} />
            </View>
            <View
              style={{ backgroundColor: lightSurface, borderColor: lightBorder }}
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
        style={{ paddingBottom: insets.bottom || 16, backgroundColor: '#F8FAFC' }}
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

          <View className="flex-row items-end rounded-3xl px-2 py-1 shadow-inner border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
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
              placeholderTextColor={lightTextMuted}
              multiline
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity
              className={`w-10 h-10 mb-1 rounded-full items-center justify-center ${
                (inputText.trim() || selectedImage) ? 'bg-primary' : 'bg-slate-100'
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
