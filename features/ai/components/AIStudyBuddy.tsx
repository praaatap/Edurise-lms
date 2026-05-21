import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { useTheme } from '@/core/theme/useTheme';
import { Colors } from '@/core/theme/colors';
import { Bot, Send, X, Sparkles, Brain, HelpCircle } from 'lucide-react-native';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { apiClient } from '@/core/api/client';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AIStudyBuddyProps {
  isVisible: boolean;
  onClose: () => void;
  context: {
    lessonTitle?: string;
    lessonContent?: string;
    courseTitle?: string;
  };
}

const { width } = Dimensions.get('window');

export const AIStudyBuddy = ({ isVisible, onClose, context }: AIStudyBuddyProps) => {
  const { C, isDark } = useTheme();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hi! I'm your Study Buddy for "${context.courseTitle}". How can I help you with the lesson "${context.lessonTitle}" today?`,
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const contextNote = context.courseTitle
        ? ` (Context: course "${context.courseTitle}"${context.lessonTitle ? `, lesson "${context.lessonTitle}"` : ''})`
        : '';
      const response = await apiClient.post('/ai/chat', {
        message: input + contextNote,
        sessionId: sessionId ?? undefined,
      });
      const { reply, sessionId: newSessionId } = response.data.data;
      if (newSessionId) setSessionId(newSessionId);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: reply,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "I couldn't reach the AI service. Check your connection and try again.",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    { label: 'Explain simply', icon: Brain },
    { label: 'Quiz me', icon: Sparkles },
    { label: 'Summarize', icon: HelpCircle },
  ];

  if (!isVisible) return null;

  return (
    <Animated.View 
      entering={SlideInRight.duration(400)} 
      exiting={SlideOutRight.duration(400)}
      style={[styles.container, { backgroundColor: C.surface, borderColor: C.border }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.botIcon, { backgroundColor: Colors.primary + '20' }]}>
            <Bot size={20} color={Colors.primary} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: C.text }]}>AI Study Buddy</Text>
            <Text style={[styles.headerStatus, { color: Colors.success }]}>Online & Ready</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <X size={20} color={C.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => (
          <View 
            key={msg.id} 
            style={[
              styles.messageWrapper, 
              msg.sender === 'user' ? styles.userWrapper : styles.aiWrapper
            ]}
          >
            <View style={[
              styles.messageBubble,
              msg.sender === 'user' 
                ? [styles.userBubble, { backgroundColor: Colors.primary }] 
                : [styles.aiBubble, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: C.border }]
            ]}>
              <Text style={[
                styles.messageText, 
                { color: msg.sender === 'user' ? 'white' : C.text }
              ]}>
                {msg.text}
              </Text>
            </View>
            <Text style={styles.timestamp}>
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))}
        {isTyping && (
          <View style={styles.typingContainer}>
            <Text style={[styles.typingText, { color: C.textMuted }]}>Buddy is thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {quickPrompts.map((p, i) => (
          <TouchableOpacity 
            key={i} 
            style={[styles.quickBtn, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}
            onPress={() => {
              setInput(p.label);
            }}
          >
            <p.icon size={14} color={C.text} />
            <Text style={[styles.quickBtnText, { color: C.text }]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.inputArea, { borderTopColor: C.border }]}>
          <TextInput
            style={[styles.input, { color: C.text, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}
            placeholder="Ask anything about the lesson..."
            placeholderTextColor={C.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, { backgroundColor: input.trim() ? Colors.primary : C.border }]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Send size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: Platform.OS === 'web' ? 400 : width * 0.85,
    borderLeftWidth: 1,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    marginTop: Platform.OS === 'ios' ? 40 : 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 16,
  },
  messageWrapper: {
    maxWidth: '85%',
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  aiWrapper: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingContainer: {
    padding: 8,
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  quickBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputArea: {
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 40 : 16,
  },
  input: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
