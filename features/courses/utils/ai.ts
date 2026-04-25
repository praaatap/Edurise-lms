import Groq from 'groq-sdk';
import { Course } from '@/shared/types';

const getGroqClient = () => new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || 'gsk_placeholder_replace_me',
  dangerouslyAllowBrowser: true // Necessary for client-side demo
});

export const aiService = {
  getRecommendedCourses: async (allCourses: Course[], userInterests: string[]): Promise<Course[]> => {
    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    const isPlaceholder = !apiKey || apiKey === 'gsk_placeholder_replace_me';

    if (isPlaceholder) {
      // Mocked logic for demo purposes if no API key
      return allCourses
        .filter(c => userInterests.some(interest => 
          c.category.toLowerCase().includes(interest.toLowerCase()) ||
          c.title.toLowerCase().includes(interest.toLowerCase())
        ))
        .slice(0, 3);
    }

    try {
      const groq = getGroqClient();
      const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are a learning assistant. Based on the user's interests, recommend the best courses from the provided list. Return a JSON object with a key 'recommendedIds' containing an array of course IDs."
          },
          {
            role: "user",
            content: `User Interests: ${userInterests.join(', ')}\n\nCourses: ${JSON.stringify(allCourses.map(c => ({ id: c.id, title: c.title, category: c.category })))}`
          }
        ],
      });

      const content = response.choices[0].message.content;
      if (!content) return [];
      
      const parsed = JSON.parse(content);
      const recommendedIds = parsed.recommendedIds || [];
      return allCourses.filter(c => recommendedIds.includes(c.id));
    } catch (error) {
      console.error('AI Recommendation Error:', error);
      return allCourses.slice(0, 3); // Fallback
    }
  }
};
