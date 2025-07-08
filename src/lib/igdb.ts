export interface IGDBGame {
  id: number;
  name: string;
  description: string;
  image_url: string | null;
  genres: string[];
  platforms: string[];
}

export const searchMobileGames = async (query: string): Promise<IGDBGame[]> => {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/igdb-proxy?search=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search games');
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching mobile games:', error);
    return [];
  }
};