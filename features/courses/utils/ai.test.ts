import { aiService } from './ai';

// Mock Groq
const mockCreate = jest.fn();

jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate
      }
    }
  }));
});

describe('AI Service', () => {
  const mockCourses = [
    { id: '1', title: 'React Masterclass', category: 'Web' },
    { id: '2', title: 'Cooking with Chef', category: 'Food' },
  ] as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockResolvedValue({
      choices: [{
        message: {
          content: '{"recommendedIds": ["1"]}'
        }
      }]
    });
  });

  it('should return mock recommendations when API key is missing', async () => {
    const originalKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    delete process.env.EXPO_PUBLIC_GROQ_API_KEY;

    const res = await aiService.getRecommendedCourses(mockCourses, ['Web']);
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('1');

    process.env.EXPO_PUBLIC_GROQ_API_KEY = originalKey;
  });

  it('should call Groq API when key is present', async () => {
    process.env.EXPO_PUBLIC_GROQ_API_KEY = 'valid_key';
    
    const res = await aiService.getRecommendedCourses(mockCourses, ['Web']);
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('1');
    expect(mockCreate).toHaveBeenCalled();
  });

  it('should fallback to first courses on error', async () => {
    process.env.EXPO_PUBLIC_GROQ_API_KEY = 'valid_key';
    mockCreate.mockRejectedValueOnce(new Error('API Error'));

    const res = await aiService.getRecommendedCourses(mockCourses, ['Web']);
    expect(res).toHaveLength(2); // Fallback returns slice(0, 3)
  });
});
