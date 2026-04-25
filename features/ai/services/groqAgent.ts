import { useAIStore } from '../store/aiStore';
import { useCourseStore } from '../../courses/store/courseStore';
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
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile', // Fast, reliable Groq model
      messages: conversationContext,
      tools: tools,
      tool_choice: "auto",
    });

    const responseMessage = response.choices[0].message;

    // 4. Handle Tool Calls (Tool Node Simulation)
    if (responseMessage.tool_calls) {
      conversationContext.push(responseMessage); // Add assistant tool call

      for (const toolCall of responseMessage.tool_calls as any[]) {
        if (toolCall.function.name === 'get_courses') {
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

      const stream = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: conversationContext,
        stream: true,
      });

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
    } else {
      // 6. Direct response without tools
      const aiMessageId = addMessage({ text: '', sender: 'ai' });

      const stream = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: conversationContext,
        stream: true,
      });

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
    }
  } catch (error: any) {
    console.error("Groq AI Error:", error);
    
    // Always fallback to mock mode if the real Groq API fails (due to key, network, or RN fetch limitations)
    console.warn("Falling back to local mock mode.");
    
    // Process using mock logic but without re-adding the user message
    const { courses } = useCourseStore.getState();
    const lowerMsg = userMessage.toLowerCase();
    let fullResponse = "";

    if (lowerMsg.includes('course') || lowerMsg.includes('learn') || lowerMsg.includes('recommend')) {
      const recommended = courses.slice(0, 2);
      fullResponse = `Based on our catalog, I highly recommend checking out these courses:\n\n` +
        recommended.map(c => `• **${c.title}** by ${c.instructor.name} (⭐ ${c.rating})\n   *${c.description.substring(0, 50)}...*`).join('\n\n') +
        `\n\nWould you like more details on any of these?`;
    } else if (lowerMsg.includes('react') || lowerMsg.includes('react native')) {
      const reactCourse = courses.find(c => c.title.toLowerCase().includes('react'));
      if (reactCourse) {
        fullResponse = `Great choice! We have an excellent course: **${reactCourse.title}**. It has ${reactCourse.lessonsCount || 12} lessons. Do you want to enroll?`;
      } else {
        fullResponse = `React is a powerful library for building UIs. While I don't see a dedicated React course right now, our Web Development basics might be a good start!`;
      }
    } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
      fullResponse = "Hello there! I'm here to assist you with your learning journey. How can I help today?";
    } else if (lowerMsg.includes('price') || lowerMsg.includes('cost')) {
      fullResponse = "Our courses range from $10 to $50, but many are frequently discounted. You can find the exact price on each course card.";
    } else {
      fullResponse = "That's an interesting question! As an AI Tutor, I can help you find the right courses, summarize topics, or test your knowledge. What specifically are you studying right now?";
    }

    const aiMessageId = addMessage({ text: '', sender: 'ai' });
    const chunks = fullResponse.split(' ');
    setTyping(false);

    for (let i = 0; i < chunks.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 10 + Math.random() * 20));
      appendMessageChunk(aiMessageId, chunks[i] + ' ');
    }

    // Attach courseId to mock response if applicable
    if (lowerMsg.includes('react') || lowerMsg.includes('react native')) {
      const { courses } = useCourseStore.getState();
      const reactCourse = courses.find(c => c.title.toLowerCase().includes('react'));
      if (reactCourse) {
        useAIStore.setState(state => ({
          messages: state.messages.map(m => m.id === aiMessageId ? { ...m, courseId: reactCourse.id } : m)
        }));
      }
    }
  } finally {
    setTyping(false);
  }
};

export const smartSearch = async (query: string): Promise<string[]> => {
  try {
    const { courses } = useCourseStore.getState();
    const courseContext = courses.map(c => ({ id: c.id, title: c.title, category: c.category, description: c.description }));

    const response = await groq.chat.completions.create({
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
    });

    const content = response.choices[0].message.content || '{"ids": []}';
    const parsed = JSON.parse(content);
    return parsed.ids || [];
  } catch (error) {
    console.error("Smart Search Error:", error);
    return [];
  }
};
