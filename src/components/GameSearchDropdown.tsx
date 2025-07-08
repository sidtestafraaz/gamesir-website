import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Gamepad2, X, Plus, AlertTriangle } from 'lucide-react';
import { searchMobileGames, IGDBGame } from '../lib/igdb';
import { supabase } from '../lib/supabase';

interface GameSearchDropdownProps {
  selectedGame: IGDBGame | null;
  onSelect: (game: IGDBGame | null) => void;
  onCreateCustom: () => void;
  placeholder?: string;
}

export const GameSearchDropdown: React.FC<GameSearchDropdownProps> = ({
  selectedGame,
  onSelect,
  onCreateCustom,
  placeholder = "Search for mobile games..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [games, setGames] = useState<IGDBGame[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [similarGame, setSimilarGame] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkSimilarApprovedGame = async (query: string) => {
    if (query.length < 3) {
      setSimilarGame(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_approved', true)
        .ilike('name', `%${query}%`)
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const game = data[0];
        const similarity = calculateSimilarity(query.toLowerCase(), game.name.toLowerCase());
        if (similarity > 0.7) { // 70% similarity threshold
          setSimilarGame(game);
        } else {
          setSimilarGame(null);
        }
      } else {
        setSimilarGame(null);
      }
    } catch (error) {
      console.error('Error checking similar games:', error);
      setSimilarGame(null);
    }
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length >= 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          // Check for similar approved games first
          await checkSimilarApprovedGame(searchQuery);
          
          // Then search IGDB
          const results = await searchMobileGames(searchQuery);
          setGames(results);
        } catch (error) {
          console.error('Search error:', error);
          setGames([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setGames([]);
      setSimilarGame(null);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSelect = (game: IGDBGame) => {
    onSelect(game);
    setIsOpen(false);
    setSearchQuery('');
    setSimilarGame(null);
  };

  const handleClear = () => {
    onSelect(null);
    setSearchQuery('');
    setSimilarGame(null);
  };

  const handleViewSimilarGame = () => {
    // Scroll to the game in the main page
    window.location.href = `/?search=${encodeURIComponent(similarGame.name)}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Similar Game Warning */}
      {similarGame && (
        <div className="mb-4 p-4 bg-black border border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-400 mb-1">Similar Game Found</h4>
              <p className="text-sm text-white mb-3">
                A similar game "<span className="font-medium">{similarGame.name}</span>" is already approved in the database.
              </p>
              <button
                onClick={handleViewSimilarGame}
                className="text-sm text-red-400 hover:text-red-300 underline transition-colors"
              >
                View existing game →
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-white/50" />
        </div>
        
        {selectedGame ? (
          <div className="w-full pl-12 pr-12 py-3 border border-white/30 rounded-lg 
                          text-white focus:outline-none focus:ring-2 focus:ring-red-500 
                          focus:border-red-500 transition-all duration-200 hover:border-white/50
                          flex items-center justify-between cursor-pointer bg-black"
               onClick={() => setIsOpen(!isOpen)}>
            <div className="flex items-center gap-3 min-w-0">
              {selectedGame.image_url && (
                <img 
                  src={selectedGame.image_url} 
                  alt={selectedGame.name}
                  className="w-8 h-8 rounded object-cover flex-shrink-0"
                />
              )}
              <span className="font-medium truncate">{selectedGame.name}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-1 hover:bg-black/50 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-white/50" />
              </button>
              <ChevronDown className={`h-4 w-4 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        ) : (
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full pl-12 pr-4 py-3 border border-white/30 rounded-lg 
                       text-white placeholder-white/50 focus:outline-none focus:ring-2 
                       focus:ring-red-500 focus:border-red-500 transition-all duration-200
                       hover:border-white/50 bg-black"
          />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black border border-white/30 
                        rounded-lg z-50 max-h-80 overflow-y-auto shadow-lg">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-red-600 mx-auto"></div>
              <p className="text-white/70 text-sm mt-2">Searching games...</p>
            </div>
          ) : games.length === 0 && searchQuery.length >= 2 ? (
            <div className="p-4 text-center">
              <Gamepad2 className="h-8 w-8 mx-auto mb-2 text-white/50" />
              <p className="text-white/70 mb-3">No mobile games found</p>
              <button
                onClick={() => {
                  onCreateCustom();
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 
                           text-white font-medium rounded-lg transition-all duration-200 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Create Custom Game
              </button>
            </div>
          ) : (
            games.map((game) => (
              <button
                key={game.id}
                onClick={() => handleSelect(game)}
                className="w-full p-4 text-left hover:bg-black/50 transition-colors
                           border-b border-white/20 last:border-b-0 last:rounded-b-lg first:rounded-t-lg"
              >
                <div className="flex items-start gap-3">
                  {game.image_url ? (
                    <img 
                      src={game.image_url} 
                      alt={game.name}
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-black rounded flex items-center justify-center flex-shrink-0 border border-white/20">
                      <Gamepad2 className="h-6 w-6 text-white/50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate">{game.name}</h4>
                    <p className="text-sm text-white/70 line-clamp-2 mt-1">
                      {game.description}
                    </p>
                    {game.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {game.genres.slice(0, 3).map((genre) => (
                          <span
                            key={genre}
                            className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs border border-red-800"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};