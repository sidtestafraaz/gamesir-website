import { useState, useEffect, useCallback } from 'react';
import { supabase, Game, Controller, GameControllerCompatibility } from '../lib/supabase';

export const useGameSearch = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [controllers, setControllers] = useState<Controller[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedController, setSelectedController] = useState<Controller | null>(null);
  const [results, setResults] = useState<GameControllerCompatibility[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [gamesResponse, controllersResponse] = await Promise.all([
        supabase
          .from('games')
          .select(`
            *,
            controllers!testing_controller_id(*),
            testing_controllers:games_testing_controllers!game_id(
              controllers(*)
            )
          `)
          .eq('is_approved', true)
          .order('name'),
        supabase.from('controllers').select('*').order('name')
      ]);

      if (gamesResponse.data) {
        const gamesWithController = gamesResponse.data.map(game => ({
          ...game,
          testing_controller: Array.isArray(game.controllers) 
            ? game.controllers[0] 
            : game.controllers,
          testing_controllers: ((game as any).testing_controllers || [])
            .map((tc: any) => tc.controllers)
            .filter((c: any) => c !== null)
        }));
        setGames(gamesWithController);
      }
      if (controllersResponse.data) setControllers(controllersResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fuzzySearch = (text: string, query: string): boolean => {
    if (!query) return true;
    
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    if (textLower.includes(queryLower)) return true;
    
    let textIndex = 0;
    let queryIndex = 0;
    
    while (textIndex < textLower.length && queryIndex < queryLower.length) {
      if (textLower[textIndex] === queryLower[queryIndex]) {
        queryIndex++;
      }
      textIndex++;
    }
    
    return queryIndex === queryLower.length;
  };

  const getCompatibleProtocols = (game: Game, controller: Controller) => {
    const compatibleProtocols: Array<{
      protocol: string;
      connectivity: 'Wired/2.4GHz/Bluetooth'| 'Wired/2.4GHz' | 'Bluetooth';
    }> = [];

    // Check Android protocols
    if (game.android_tested) {
      const androidProtocols = {
        HID: game.android_hid,
        XINPUT: game.android_xinput,
        DS4: game.android_ds4,
        NS: game.android_ns
      };

      Object.entries(androidProtocols).forEach(([protocol, connectivity]) => {
        if (!connectivity || connectivity === '') return;

        // Check if controller supports this protocol
        const controllerSupportsWired = controller.wired_protocols.includes(protocol);
        const controllerSupportsBluetooth = controller.bluetooth_protocols.includes(protocol);

        if (connectivity === 'Wired/2.4GHz/Bluetooth' && controllerSupportsWired && controllerSupportsBluetooth) {
          compatibleProtocols.push({
            protocol,
            connectivity: 'Wired/2.4GHz/Bluetooth'
          });
        } else if (connectivity === 'Wired/2.4GHz' && controllerSupportsWired) {
          compatibleProtocols.push({
            protocol,
            connectivity: 'Wired/2.4GHz'
          });
        } else if (connectivity === 'Bluetooth' && controllerSupportsBluetooth) {
          compatibleProtocols.push({
            protocol,
            connectivity: 'Bluetooth'
          });
        }
      });
    }

    // Check iOS protocols
    if (game.ios_tested) {
      const iosProtocols = {
        HID: game.ios_hid,
        XINPUT: game.ios_xinput,
        DS4: game.ios_ds4,
        NS: game.ios_ns
      };

      Object.entries(iosProtocols).forEach(([protocol, connectivity]) => {
        if (!connectivity || connectivity === '') return;

        // Check if controller supports this protocol
        const controllerSupportsWired = controller.wired_protocols.includes(protocol);
        const controllerSupportsBluetooth = controller.bluetooth_protocols.includes(protocol);

        // Avoid duplicates - check if protocol already exists with same or better connectivity
        const existingProtocol = compatibleProtocols.find(p => p.protocol === protocol);
        if (existingProtocol) {
          // If existing is already 'Both', don't add duplicate
          if (existingProtocol.connectivity === 'Wired/2.4GHz/Bluetooth') return;
          
          // If new connectivity is 'Both' and existing is not, replace it
          if (connectivity === 'Wired/2.4GHz/Bluetooth' && controllerSupportsWired && controllerSupportsBluetooth) {
            existingProtocol.connectivity = 'Wired/2.4GHz/Bluetooth';
            return;
          }
          
          // Otherwise, don't add duplicate
          return;
        }

        if (connectivity === 'Wired/2.4GHz/Bluetooth' && controllerSupportsWired && controllerSupportsBluetooth) {
          compatibleProtocols.push({
            protocol,
            connectivity: 'Wired/2.4GHz/Bluetooth'
          });
        } else if (connectivity === 'Wired/2.4GHz' && controllerSupportsWired) {
          compatibleProtocols.push({
            protocol,
            connectivity: 'Wired/2.4GHz'
          });
        } else if (connectivity === 'Bluetooth' && controllerSupportsBluetooth) {
          compatibleProtocols.push({
            protocol,
            connectivity: 'Bluetooth'
          });
        }
      });
    }

    return compatibleProtocols;
  };

  useEffect(() => {
    const filteredGames = games.filter(game => 
      fuzzySearch(game.name, searchQuery)
    );

    const processedResults: GameControllerCompatibility[] = filteredGames.map(game => {
      if (!selectedController) {
        // Show platform-specific protocols when no controller is selected
        const allProtocols: Array<{
          protocol: string;
          connectivity: 'Wired/2.4GHz' | 'Bluetooth' | 'Wired/2.4GHz/Bluetooth';
        }> = [];

        // Add Android protocols
        if (game.android_tested) {
          const androidProtocols = {
            HID: game.android_hid,
            XINPUT: game.android_xinput,
            DS4: game.android_ds4,
            NS: game.android_ns
          };
          Object.entries(androidProtocols).forEach(([protocol, connectivity]) => {
            if (connectivity && connectivity !== 'Not Supported') {
              allProtocols.push({
                protocol,
                connectivity: connectivity as 'Wired/2.4GHz' | 'Bluetooth' | 'Wired/2.4GHz/Bluetooth'
              });
            }
          });
        }

        // Add iOS protocols (avoid duplicates)
        if (game.ios_tested) {
          const iosProtocols = {
            HID: game.ios_hid,
            XINPUT: game.ios_xinput,
            DS4: game.ios_ds4,
            NS: game.ios_ns
          };

          Object.entries(iosProtocols).forEach(([protocol, connectivity]) => {
            if (connectivity && connectivity !== 'Not Supported') {
              const existingProtocol = allProtocols.find(p => p.protocol === protocol);
              if (!existingProtocol) {
                allProtocols.push({
                  protocol,
                  connectivity: connectivity as 'Wired/2.4GHz' | 'Bluetooth' | 'Wired/2.4GHz/Bluetooth'
                });
              }
            }
          });
        }

        return {
          game,
          is_supported: true,
          supported_protocols: allProtocols,
          connectivity_modes: [],
          testing_controller: (game as any).testing_controller,
          testing_controllers: (game as any).testing_controllers || []
        };
      }

      const compatibleProtocols = getCompatibleProtocols(game, selectedController);

      return {
        game,
        controller: selectedController,
        is_supported: compatibleProtocols.length > 0,
        supported_protocols: compatibleProtocols,
        connectivity_modes: [...new Set(compatibleProtocols.map(p => p.connectivity))],
        testing_controller: (game as any).testing_controller,
        testing_controllers: (game as any).testing_controllers || []
      };
    });

    setResults(processedResults);
  }, [games, searchQuery, selectedController]);

  return {
    controllers,
    results,
    searchQuery,
    setSearchQuery,
    selectedController,
    setSelectedController,
    isLoading,
    refreshData: fetchData
  };
};