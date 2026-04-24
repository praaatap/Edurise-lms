import { useAIStore } from '../store/aiStore';
import { useCourseStore } from '../../courses/store/courseStore';
import OpenAI from 'openai';

// Initialize OpenAI SDK pointing to Groq
const openai = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || 'gsk_placeholder_replace_me',
  dangerouslyAllowBrowser: true, // Needed for React Native
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

const SYSTEM_PROMPT = `
You are an expert AI Tutor for a technical course application. 
Your goal is to help users learn, recommend courses, and explain concepts clearly.
Keep your answers concise, friendly, and formatted with markdown.
If the user asks about courses, use the get_courses tool to see what is available.
`;

const tools: any = [
  {
    type: "function",
    function: {
      name: "get_courses",
      description: "Get a list of all available tech courses in the application catalog.",
      parameters: {
        type: "object",
        properties: {},
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
    // 3. First call to LLM (Agent Node)
    const response = await openai.chat.completions.create({
      model: 'llama3-8b-8192', // Fast, reliable Groq model
      messages: conversationContext,
      tools: tools,
      tool_choice: "auto",
    });

    const responseMessage = response.choices[0].message;

    // 4. Handle Tool Calls (Tool Node Simulation)
    if (responseMessage.tool_calls) {
      conversationContext.push(responseMessage); // Add assistant tool call

      for (const toolCall of responseMessage.tool_calls) {
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
      setTyping(false);

      const stream = await openai.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: conversationContext,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          appendMessageChunk(aiMessageId, content);
        }
      }
    } else {
      // 6. Direct response without tools
      const aiMessageId = addMessage({ text: '', sender: 'ai' });
      setTyping(false);

      const stream = await openai.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: conversationContext,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          appendMessageChunk(aiMessageId, content);
        }
      }
    }
  } catch (error: any) {
    console.error("Groq AI Error:", error);
    setTyping(false);
    
    // Fallback UI error message
    const fallbackMsg = error.message?.includes('401') 
      ? "⚠️ Setup required: Please provide a valid Groq API Key in `.env` to enable real AI responses. I am currently running in mock mode."
      : "Sorry, I'm having trouble connecting to my neural network right now. Please try again later.";
      
    addMessage({ text: fallbackMsg, sender: 'ai' });
  }
};
