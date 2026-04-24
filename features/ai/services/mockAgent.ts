import { useCourseStore } from '../../courses/store/courseStore';
import { useAIStore } from '../store/aiStore';

// Simple mock responses based on keywords to simulate an "agentic" workflow
export const processUserMessage = async (userMessage: string) => {
  const { addMessage, appendMessageChunk, setTyping } = useAIStore.getState();
  const { courses } = useCourseStore.getState();

  // 1. Add user message
  addMessage({ text: userMessage, sender: 'user' });

  // 2. Set typing state
  setTyping(true);

  // Reduced simulated network latency for a snappier UI
  await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));

  // 3. Generate response conceptually (Simulating an LLM tool call)
  const lowerMsg = userMessage.toLowerCase();
  let fullResponse = "";

  if (lowerMsg.includes('course') || lowerMsg.includes('learn') || lowerMsg.includes('recommend')) {
    const recommended = courses.slice(0, 2); // Recommend top 2
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

  // 4. Create the AI message stub
  const aiMessageId = addMessage({ text: '', sender: 'ai' });

  // 5. Stream the response
  const chunks = fullResponse.split(' ');
  setTyping(false); // Stop typing indicator as we start streaming

  for (let i = 0; i < chunks.length; i++) {
    // Sped up token generation speed for faster streaming
    await new Promise((resolve) => setTimeout(resolve, 5 + Math.random() * 10));
    appendMessageChunk(aiMessageId, chunks[i] + ' ');
  }
};
