import { create } from 'zustand';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AIState {
  messages: Message[];
  isTyping: boolean;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string;
  appendMessageChunk: (id: string, chunk: string) => void;
  setTyping: (typing: boolean) => void;
  clearMessages: () => void;
}

export const useAIStore = create<AIState>((set) => ({
  messages: [
    {
      id: 'welcome',
      text: "Hi! I'm your AI Tutor. I can help you find courses, explain concepts, or plan your learning path. What would you like to learn today?",
      sender: 'ai',
      timestamp: new Date(),
    },
  ],
  isTyping: false,
  
  addMessage: (msg) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(7);
    set((state) => ({
      messages: [...state.messages, { ...msg, id, timestamp: new Date() }],
    }));
    return id;
  },
  
  appendMessageChunk: (id, chunk) => set((state) => ({
    messages: state.messages.map((m) => 
      m.id === id ? { ...m, text: m.text + chunk } : m
    )
  })),
  
  setTyping: (isTyping) => set({ isTyping }),
  
  clearMessages: () => set({ 
    messages: [{
      id: 'welcome-reset',
      text: "Hi! I'm your AI Tutor. Let's start fresh. How can I assist you?",
      sender: 'ai',
      timestamp: new Date(),
    }]
  }),
}));
