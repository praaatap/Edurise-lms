import OpenAI from 'openai';
import { Course } from '@/shared/types';

// In a real app, this would be an environment variable
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY || 'mock-key',
  dangerouslyAllowBrowser: true // Necessary for client-side demo
});

export const aiService = {
  getRecommendedCourses: async (allCourses: Course[], userInterests: string[]): Promise<Course[]> => {
    if (!OPENAI_API_KEY) {
      // Mocked logic for demo purposes if no API key
      console.log('OpenAI API key missing. Using mock recommendation logic.');
      return allCourses
        .filter(c => userInterests.some(interest => 
          c.category.toLowerCase().includes(interest.toLowerCase()) ||
          c.title.toLowerCase().includes(interest.toLowerCase())
        ))
        .slice(0, 3);
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a learning assistant. Based on the user's interests, recommend the best courses from the provided list. Return ONLY a JSON array of course IDs."
          },
          {
            role: "user",
            content: `User Interests: ${userInterests.join(', ')}\n\nCourses: ${JSON.stringify(allCourses.map(c => ({ id: c.id, title: c.title, category: c.category })))}`
          }
        ],
      });

      const content = response.choices[0].message.content;
      if (!content) return [];
      
      const recommendedIds = JSON.parse(content) as string[];
      return allCourses.filter(c => recommendedIds.includes(c.id));
    } catch (error) {
      console.error('AI Recommendation Error:', error);
      return allCourses.slice(0, 3); // Fallback
    }
  }
};
