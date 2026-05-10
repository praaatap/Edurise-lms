import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/core/api/client';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface AIState {
  messages: Message[];
  sessionId: string | null;
  isTyping: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;
}

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm your Edu-Buddy 🎓 Ask me anything about your lessons, get explanations, or request a quick quiz!",
  timestamp: Date.now(),
};

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      messages: [WELCOME],
      sessionId: null,
      isTyping: false,
      error: null,

      sendMessage: async (content: string) => {
        const userMsg: Message = {
          id: `u_${Date.now()}`,
          role: 'user',
          content,
          timestamp: Date.now(),
        };

        set((state) => ({
          messages: [...state.messages, userMsg],
          isTyping: true,
          error: null,
        }));

        try {
          const response = await apiClient.post('/ai/chat', {
            message: content,
            sessionId: get().sessionId ?? undefined,
          });

          const { reply, sessionId } = response.data.data;

          const aiMsg: Message = {
            id: `a_${Date.now()}`,
            role: 'assistant',
            content: reply,
            timestamp: Date.now(),
          };

          set((state) => ({
            messages: [...state.messages, aiMsg],
            sessionId: sessionId ?? state.sessionId,
            isTyping: false,
          }));
        } catch {
          // Graceful fallback so the app doesn't crash
          const fallback: Message = {
            id: `a_${Date.now()}`,
            role: 'assistant',
            content: "I'm having trouble connecting right now. Please check your internet and try again.",
            timestamp: Date.now(),
          };
          set((state) => ({
            messages: [...state.messages, fallback],
            isTyping: false,
            error: 'AI service unavailable',
          }));
        }
      },

      clearHistory: () => set({
        messages: [{ ...WELCOME, timestamp: Date.now() }],
        sessionId: null,
        error: null,
      }),
    }),
    {
      name: 'edu-buddy-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ messages: state.messages.slice(-30), sessionId: state.sessionId }),
    }
  )
);
