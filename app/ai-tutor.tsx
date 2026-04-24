import { Colors } from '@/core/theme/colors';
import { processUserMessage } from '@/features/ai/services/groqAgent';
import { useAIStore } from '@/features/ai/store/aiStore';
import { LegendList } from '@legendapp/list';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bot, SendHorizonal, Sparkles, User, Lightbulb } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

const SUGGESTED_PROMPTS = [
  "Recommend a React course",
  "Explain State Management",
  "How much are courses?",
];

export default function AITutorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const listRef = useRef<any>(null);
  
  const [inputText, setInputText] = useState('');
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
    if (!text.trim()) return;
    setInputText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Process the message via our Groq agent
    await processUserMessage(text.trim());
  };

  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    const isUser = item.sender === 'user';
    const isLast = index === messages.length - 1;

    return (
      <Animated.View
        entering={FadeInDown.duration(300).springify()}
        className={`w-full px-4 mb-5 flex-row ${isUser ? 'justify-end' : 'justify-start'}`}
        style={{ paddingBottom: isLast ? 20 : 0 }}
      >
        {!isUser && (
          <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3 mt-auto shadow-sm">
            <Bot size={16} color={Colors.primary} />
          </View>
        )}

        <View
          className={`max-w-[82%] rounded-3xl px-5 py-3.5 shadow-sm ${
            isUser ? 'bg-primary rounded-br-sm' : 'bg-white border border-slate-100 rounded-bl-sm'
          }`}
        >
          <Text
            className={`text-[15px] leading-6 tracking-wide ${
              isUser ? 'text-white font-medium' : 'text-slate-800'
            }`}
          >
            {item.text}
          </Text>
        </View>

        {isUser && (
          <View className="w-8 h-8 rounded-full bg-slate-200 items-center justify-center ml-3 mt-auto shadow-sm">
            <User size={16} color={Colors.textMuted} />
          </View>
        )}
      </Animated.View>
    );
  }, [messages.length]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-slate-100 flex-row items-center justify-between px-4 pb-4 shadow-sm z-10"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center bg-slate-50 rounded-full"
        >
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        
        <View className="items-center flex-row">
          <Sparkles size={16} color={Colors.primary} className="mr-2" />
          <Text className="text-lg font-bold text-slate-800 tracking-tight">AI Tutor</Text>
        </View>
        
        <View className="w-10" /> {/* Spacer */}
      </View>

      {/* Chat List */}
      <View className="flex-1">
        <LegendList
          ref={listRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item: any) => item.id}
          estimatedItemSize={80}
          contentContainerStyle={{ paddingTop: 24, paddingBottom: 100 }}
        />
        
        {/* Typing Indicator */}
        {isTyping && (
          <Animated.View entering={FadeIn} exiting={FadeOut} className="px-4 mb-4 flex-row items-end absolute bottom-4 left-0">
            <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3 shadow-sm">
              <Bot size={16} color={Colors.primary} />
            </View>
            <View className="bg-white border border-slate-100 rounded-3xl rounded-bl-sm px-5 py-4 shadow-sm flex-row items-center gap-1.5">
              <View className="w-2.5 h-2.5 bg-primary/40 rounded-full animate-pulse" />
              <View className="w-2.5 h-2.5 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <View className="w-2.5 h-2.5 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </View>
          </Animated.View>
        )}
      </View>

      {/* Input Area */}
      <View
        style={{ paddingBottom: insets.bottom || 16 }}
        className="bg-white border-t border-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
      >
        {/* Suggested Prompts */}
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
          <View className="flex-row items-end bg-slate-50 border border-slate-200 rounded-3xl px-2 py-1 shadow-inner">
            <TextInput
              className="flex-1 min-h-[44px] max-h-32 px-3 py-2 text-[15px] text-slate-800"
              placeholder="Ask me anything..."
              placeholderTextColor="#94A3B8"
              multiline
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity
              className={`w-10 h-10 mb-1 rounded-full items-center justify-center ${
                inputText.trim() ? 'bg-primary' : 'bg-slate-200'
              }`}
              onPress={() => handleSend(inputText)}
              disabled={!inputText.trim() || isTyping}
            >
              <SendHorizonal size={18} color={inputText.trim() ? 'white' : '#94A3B8'} />
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
