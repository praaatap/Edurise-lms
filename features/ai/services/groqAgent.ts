import { useAIStore } from '../store/aiStore';
import { useCourseStore } from '../../courses/store/courseStore';
import { analytics } from '@/core/services/analyticsService';
import { withSentrySpan, trackUserAction } from '@/core/services/sentryPerformance';
import Groq from 'groq-sdk';
import { fetch as expoFetch } from 'expo/fetch';
// import { processUserMessage as processMockMessage } from './mockAgent';

// Initialize Groq SDK with expo/fetch for streaming support
const groq = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || 'gsk_placeholder_replace_me',
  fetch: expoFetch as any,
  dangerouslyAllowBrowser: true,
});

// Simulated Tool: Fetch available courses
const getAvailableCourses = () => {
  const { courses } = useCourseStore.getState();
  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    category: c.category,
    price: c.price,
    instructor: c.instructor.name,
    lessons: c.lessonsCount || 12,
  }));
};

const SYSTEM_PROMPT = `You are an expert AI Tutor. 
- If the user asks about courses, you MUST use 'get_courses' to see what is available.
- Keep responses concise and friendly.
- Use markdown for formatting.`;

const tools: any = [
  {
    type: "function",
    function: {
      name: "get_courses",
      description: "Get the current list of tech courses available in the catalog.",
      parameters: {
        type: "object",
        properties: {
          filter: {
            type: "string",
            description: "Optional category to filter courses by.",
          },
        },
        required: [],
      },
    },
  },
];

export const processUserMessage = async (userMessage: string) => {
  const { addMessage, appendMessageChunk, setTyping, messages } = useAIStore.getState();

  // 1. Add user message to UI
  addMessage({ text: userMessage, sender: 'user' });
  trackUserAction('ai_message_sent', { length: userMessage.length });
  analytics.logEvent('ai_message_sent', { messageLength: userMessage.length });
  setTyping(true);

  // 2. Prepare conversation history for LLM
  const conversationContext: any[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
    { role: 'user', content: userMessage }
  ];

  try {
    // Check if we have a valid key
    const isPlaceholder = !process.env.EXPO_PUBLIC_GROQ_API_KEY || process.env.EXPO_PUBLIC_GROQ_API_KEY === 'gsk_placeholder_replace_me';

    if (isPlaceholder) {
      throw new Error('401: Missing API Key');
    }

    // 3. First call to LLM (Agent Node)
    const response = await withSentrySpan('ai-agent-call', 'ai.groq.chat', () =>
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: conversationContext,
        tools: tools,
        tool_choice: "auto",
      }),
    );

    const responseMessage = response.choices[0].message;

    // 4. Handle Tool Calls (Tool Node Simulation)
    if (responseMessage.tool_calls) {
      conversationContext.push(responseMessage);
      for (const toolCall of responseMessage.tool_calls as any[]) {
        if (toolCall.function.name === 'get_courses') {
          analytics.logEvent('ai_tool_called', { tool: 'get_courses' });
          const courses = getAvailableCourses();
          conversationContext.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: "get_courses",
            content: JSON.stringify(courses),
          });
        }
      }

      // 5. Second LLM call with tool results, STREAMING response
      const aiMessageId = addMessage({ text: '', sender: 'ai' });

      const stream = await withSentrySpan('ai-tool-response', 'ai.groq.stream', () =>
        groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: conversationContext,
          stream: true,
        }),
      );

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          appendMessageChunk(aiMessageId, content);
        }
      }

      // 5.5 Check for course mentions in the final text
      const finalMsg = useAIStore.getState().messages.find(m => m.id === aiMessageId);
      if (finalMsg) {
        const { courses } = useCourseStore.getState();
        const mentionedCourse = courses.find(c => finalMsg.text.includes(c.title));
        if (mentionedCourse) {
          useAIStore.setState(state => ({
            messages: state.messages.map(m => m.id === aiMessageId ? { ...m, courseId: mentionedCourse.id } : m)
          }));
        }
      }
      analytics.logEvent('ai_response_received', { usedTool: true });
    } else {
      // 6. Direct response without tools
      const aiMessageId = addMessage({ text: '', sender: 'ai' });

      const stream = await withSentrySpan('ai-direct-response', 'ai.groq.stream', () =>
        groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: conversationContext,
          stream: true,
        }),
      );

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          appendMessageChunk(aiMessageId, content);
        }
      }

      // 6.5 Check for course mentions in the final text
      const finalMsg = useAIStore.getState().messages.find(m => m.id === aiMessageId);
      if (finalMsg) {
        const { courses } = useCourseStore.getState();
        const mentionedCourse = courses.find(c => finalMsg.text.includes(c.title));
        if (mentionedCourse) {
          useAIStore.setState(state => ({
            messages: state.messages.map(m => m.id === aiMessageId ? { ...m, courseId: mentionedCourse.id } : m)
          }));
        }
      }
      analytics.logEvent('ai_response_received', { usedTool: false });
    }
  } catch (error: any) {
    console.error("Groq AI Error:", error);
    analytics.logEvent('ai_error', { message: error?.message || 'unknown' });
    addMessage({
      text: "I'm sorry, I encountered an error connecting to my server. Please check your API key or network connection and try again.",
      sender: 'ai'
    });
  } finally {
    setTyping(false);
  }
};

export const smartSearch = async (query: string): Promise<string[]> => {
  analytics.logEvent('ai_smart_search', { query });
  try {
    const { courses } = useCourseStore.getState();
    const courseContext = courses.map(c => ({ id: c.id, title: c.title, category: c.category, description: c.description }));

    const response = await withSentrySpan('ai-smart-search', 'ai.groq.search', () =>
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a course recommendation engine. Given a list of courses and a user intent, return a JSON object with a key "ids" containing an array of course IDs that best match the intent. ONLY return the JSON object.'
          },
          {
            role: 'user',
            content: `Courses: ${JSON.stringify(courseContext)}\nUser Intent: ${query}`
          }
        ],
        response_format: { type: "json_object" }
      }),
    );

    const content = response.choices[0].message.content || '{"ids": []}';
    const parsed = JSON.parse(content);
    return parsed.ids || [];
  } catch (error) {
    console.error("Smart Search Error:", error);
    return [];
  }
};
