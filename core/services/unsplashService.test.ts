import { fetchUnsplashImages } from './unsplashService';

describe('Unsplash Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock global fetch
    global.fetch = jest.fn();
  });

  it('should return mock images when API key is missing', async () => {
    const res = await fetchUnsplashImages('query');
    expect(res).toHaveLength(10);
    expect(res[0].id).toContain('random');
  });

  it('should call fetch when API key is present', async () => {
    // We need to set the environment variable
    process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY = 'valid_key';
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({ results: [{ id: '1' }] })
    });

    const res = await fetchUnsplashImages('query');
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('1');
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('api.unsplash.com'), expect.any(Object));

    delete process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
  });

  it('should return empty array on error', async () => {
    process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY = 'valid_key';
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

    const res = await fetchUnsplashImages('query');
    expect(res).toEqual([]);

    delete process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
  });
});
