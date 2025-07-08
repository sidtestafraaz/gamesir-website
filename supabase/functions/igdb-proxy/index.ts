const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface IGDBGame {
  id: number;
  name: string;
  summary?: string;
  cover?: {
    url: string;
  };
  platforms?: Array<{
    id: number;
    name: string;
  }>;
  genres?: Array<{
    id: number;
    name: string;
  }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get('search');
    
    if (!searchQuery) {
      return new Response(
        JSON.stringify({ error: 'Search query is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get Supabase client to check existing games
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Fetch existing approved games from database (exclude rejected/unapproved games)
    const existingGamesResponse = await fetch(`${supabaseUrl}/rest/v1/games?select=igdb_id&is_approved=eq.true`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    });

    const existingGames = await existingGamesResponse.json();
    const existingIgdbIds = new Set(
      existingGames
        .filter((game: any) => game.igdb_id)
        .map((game: any) => game.igdb_id)
    );

    // Get Twitch OAuth token
    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: Deno.env.get('TWITCH_CLIENT_ID') || '',
        client_secret: Deno.env.get('TWITCH_CLIENT_SECRET') || '',
        grant_type: 'client_credentials'
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Twitch OAuth failed:', tokenResponse.status, errorText);
      throw new Error(`Twitch OAuth failed with status ${tokenResponse.status}: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error('No access token received from Twitch OAuth');
      throw new Error('Failed to obtain access token from Twitch OAuth');
    }

    // Search for mobile games on IGDB with stricter mobile platform filtering
    const igdbResponse = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': Deno.env.get('TWITCH_CLIENT_ID') || '',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: `
        search "${searchQuery}";
        fields name,summary,cover.url,platforms.name,genres.name;
        where platforms = (34,39,130,131,166,167,169,170,471,472,473,474) & category = 0;
        limit 20;
      `
    });

    if (!igdbResponse.ok) {
      const errorText = await igdbResponse.text();
      console.error('IGDB API failed:', igdbResponse.status, errorText);
      throw new Error(`IGDB API failed with status ${igdbResponse.status}: ${errorText}`);
    }

    const games: IGDBGame[] = await igdbResponse.json();

    // Filter out only approved games (allow rejected/unapproved games to be shown)
    const mobileGames = games
      .filter(game => {
        // Exclude only approved games from database
        if (existingIgdbIds.has(game.id)) {
          return false;
        }
        
        // Ensure game has mobile platforms
        const hasMobilePlatforms = game.platforms?.some(platform => {
          const mobilePlatformNames = [
            'iOS', 'Android', 'iPhone', 'iPad', 
            'iPod Touch', 'Google Play', 'App Store'
          ];
          return mobilePlatformNames.some(mobile => 
            platform.name.toLowerCase().includes(mobile.toLowerCase())
          );
        });
        
        return hasMobilePlatforms;
      })
      .map(game => ({
        id: game.id,
        name: game.name,
        description: game.summary || 'No description available',
        image_url: game.cover?.url ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : null,
        genres: game.genres?.map(g => g.name) || [],
        platforms: game.platforms?.map(p => p.name) || []
      }))
      .slice(0, 10); // Limit to 10 results

    return new Response(
      JSON.stringify(mobileGames),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('IGDB API Error:', error);
    return new Response(
      JSON.stringify({ error: `Failed to fetch games from IGDB: ${error.message}` }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});