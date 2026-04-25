// export const UNSPLASH_ACCESS_KEY = ... 
// (Moved inside function for testability)

export interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  user: {
    name: string;
  };
}

export const fetchUnsplashImages = async (query: string = 'portrait', page: number = 1): Promise<UnsplashImage[]> => {
  const accessKey = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY || '';
  try {
    // If no key is provided, we use the source API for random images (limited)
    if (!accessKey) {
      return Array.from({ length: 10 }).map((_, i) => ({
        id: `random-${i}`,
        urls: {
          regular: `https://images.unsplash.com/photo-${1500000000000 + i}?auto=format&fit=crop&q=80&w=400`,
          small: `https://images.unsplash.com/photo-${1500000000000 + i}?auto=format&fit=crop&q=80&w=200`,
          thumb: `https://images.unsplash.com/photo-${1500000000000 + i}?auto=format&fit=crop&q=80&w=100`,
        },
        user: { name: 'Unsplash User' }
      }));
    }

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${query}&page=${page}&per_page=12&orientation=squarish`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    );

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching Unsplash images:', error);
    return [];
  }
};

export const getRandomAvatar = () => {
  return `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200`; // Fixed fallback
};
