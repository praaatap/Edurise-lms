import { smartSearch } from './groqAgent';
import { useCourseStore } from '@/features/courses/store/courseStore';

jest.mock('@/features/courses/store/courseStore', () => ({
  useCourseStore: {
    getState: jest.fn(),
  }
}));

jest.mock('expo/fetch', () => ({
  fetch: jest.fn(),
}));

// Mock Groq SDK
jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: '{"ids": ["course_1", "course_2"]}'
            }
          }]
        })
      }
    }
  }));
});

describe('Groq Agent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return smart search results', async () => {
    (useCourseStore.getState as jest.Mock).mockReturnValue({
      courses: [
        { id: 'course_1', title: 'React', category: 'Web' },
        { id: 'course_2', title: 'Nextjs', category: 'Web' }
      ]
    });

    const results = await smartSearch('I want to learn web dev');

    expect(results).toEqual(['course_1', 'course_2']);
  });
});
