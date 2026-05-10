import { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  Dimensions,
  Animated
} from 'react-native';
import { useAIStore } from '../store/aiStore';
import { useTheme } from '@/core/theme/useTheme';
import { Colors } from '@/core/theme/colors';
import { Send, X, Bot, Sparkles, Trash2 } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export const AIChatBubble = () => {
  const { C, isDark } = useTheme();
  const { messages, sendMessage, isTyping, clearHistory } = useAIStore();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(inputText.trim());
      setInputText('');
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isAi = item.role === 'assistant';
    return (
      <View style={[
        styles.messageWrapper, 
        isAi ? styles.aiWrapper : styles.userWrapper
      ]}>
        <View style={[
          styles.messageBubble,
          { 
            backgroundColor: isAi ? (isDark ? '#1E293B' : '#F1F5F9') : Colors.primary,
            borderBottomLeftRadius: isAi ? 4 : 20,
            borderBottomRightRadius: isAi ? 20 : 4,
          }
        ]}>
          {isAi && <Bot size={12} color={Colors.primary} style={{ marginBottom: 4 }} />}
          <Text style={[
            styles.messageText, 
            { color: isAi ? C.text : 'white' }
          ]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  if (!isOpen) {
    return (
      <TouchableOpacity 
        style={[styles.floatingBtn, { shadowColor: Colors.primary }]}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.9}
      >
        <Sparkles size={24} color="white" />
      </TouchableOpacity>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={() => setIsOpen(false)} 
      />
      <Animated.View style={[
        styles.chatContainer, 
        { 
          opacity: fadeAnim,
          transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
          backgroundColor: C.background,
          borderColor: C.border
        }
      ]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: C.border }]}>
          <View style={styles.headerInfo}>
            <View style={styles.botIcon}>
              <Bot size={20} color="white" />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: C.text }]}>Edu-Buddy AI</Text>
              <Text style={styles.headerStatus}>Online • Your Learning Assistant</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={clearHistory} style={styles.headerBtn}>
              <Trash2 size={18} color={C.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.headerBtn}>
              <X size={20} color={C.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        {isTyping && (
          <View style={styles.typingContainer}>
            <Text style={[styles.typingText, { color: C.textMuted }]}>Edu-Buddy is thinking...</Text>
          </View>
        )}

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={[styles.inputContainer, { borderTopColor: C.border }]}>
            <TextInput
              style={[styles.input, { color: C.text, backgroundColor: C.surface }]}
              placeholder="Ask anything about the lesson..."
              placeholderTextColor={C.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity 
              style={[
                styles.sendBtn, 
                { backgroundColor: inputText.trim() ? Colors.primary : C.border }
              ]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Send size={18} color="white" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingBtn: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  chatContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: width * 0.85,
    height: height * 0.6,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerStatus: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerBtn: {
    padding: 4,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  messageWrapper: {
    maxWidth: '85%',
    marginBottom: 4,
  },
  aiWrapper: {
    alignSelf: 'flex-start',
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
