import React, { useState } from 'react';
import { GameControllerCompatibility } from '../lib/supabase';
import { Gamepad2, CheckCircle, XCircle, Shield, User, MessageSquare, Calendar, ChevronDown, ChevronUp, Bluetooth, Wifi, Edit3, Smartphone, Usb, Cable } from 'lucide-react';
import { BsPlaystation, BsXbox, BsNintendoSwitch, BsController, BsApple, BsAndroid2 } from 'react-icons/bs';

interface GameCardProps {
  result: GameControllerCompatibility;
}

export const GameCard: React.FC<GameCardProps> = ({ result }) => {
  const { game, controller, is_supported, supported_protocols, testing_controller, testing_controllers } = result;
  const [isTestingInfoExpanded, setIsTestingInfoExpanded] = useState(false);

  const getProtocolIcon = (protocol: string) => {
    switch (protocol.toUpperCase()) {
      case 'HID':
        return <Cable className="h-3 w-3 md:h-4 md:w-4" />;
      case 'XINPUT':
        return <BsXbox className="h-3 w-3 md:h-4 md:w-4" />;
      case 'DS4':
        return <BsPlaystation className="h-3 w-3 md:h-4 md:w-4" />;
      case 'NS':
        return <BsNintendoSwitch className="h-3 w-3 md:h-4 md:w-4" />;
      default:
        return <BsController className="h-3 w-3 md:h-4 md:w-4" />;
    }
  };

  const getConnectivityIcon = (connectivity: string) => {
    switch (connectivity) {
      case 'Wired/2.4GHz/Bluetooth':
        return <Wifi className="h-3 w-3" />;
      case 'Wired/2.4GHz':
        return <Usb className="h-3 w-3" />;
      case 'Bluetooth':
        return <Bluetooth className="h-3 w-3" />;
      default:
        return <Wifi className="h-3 w-3" />;
    }
  };

  // Get platform-specific protocol support
  const getPlatformProtocols = () => {
    const platforms: Array<{
      name: string;
      icon: React.ReactNode;
      protocols: Array<{ protocol: string; connectivity: string }>;
    }> = [];

    // Android protocols
    if (game.android_tested) {
      const androidProtocols: Array<{ protocol: string; connectivity: string }> = [];
      
      if (game.android_hid) androidProtocols.push({ protocol: 'HID', connectivity: game.android_hid });
      if (game.android_xinput) androidProtocols.push({ protocol: 'XINPUT', connectivity: game.android_xinput });
      if (game.android_ds4) androidProtocols.push({ protocol: 'DS4', connectivity: game.android_ds4 });
      if (game.android_ns) androidProtocols.push({ protocol: 'NS', connectivity: game.android_ns });

      platforms.push({
        name: 'Android',
        icon: <BsAndroid2 className="h-4 w-4 text-gray-300" />,
        protocols: androidProtocols
      });
    }

    // iOS protocols
    if (game.ios_tested) {
      const iosProtocols: Array<{ protocol: string; connectivity: string }> = [];
      
      if (game.ios_hid) iosProtocols.push({ protocol: 'HID', connectivity: game.ios_hid });
      if (game.ios_xinput) iosProtocols.push({ protocol: 'XINPUT', connectivity: game.ios_xinput });
      if (game.ios_ds4) iosProtocols.push({ protocol: 'DS4', connectivity: game.ios_ds4 });
      if (game.ios_ns) iosProtocols.push({ protocol: 'NS', connectivity: game.ios_ns });

      platforms.push({
        name: 'iOS',
        icon: <BsApple className="h-4 w-4 text-gray-300" />,
        protocols: iosProtocols
      });
    }

    return platforms;
  };

  const platformProtocols = getPlatformProtocols();
  const hasTestingInfo = testing_controller || testing_controllers?.length > 0 || game.discord_username || game.testing_notes || game.approved_by || game.created_at || (game as any).edited_by_admin;

  return (
    <div className="bg-black border border-white/30 rounded-xl p-4 md:p-6 hover:border-white/50 
                    transition-all duration-300 shadow-lg hover:shadow-xl">
      <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-zinc-900 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/20">
          {game.image_url ? (
            <img 
              src={game.image_url} 
              alt={game.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Gamepad2 className="h-6 w-6 md:h-8 md:w-8 text-white/50" />
          )}
        </div>
        
        <div className="flex-1 w-full">
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
            <div className="mb-4 md:mb-0 flex-1">
              <h3 className="text-lg md:text-xl font-bold text-white mb-2">{game.name}</h3>
              <p className="text-white/70 text-sm leading-relaxed line-clamp-3">{game.description}</p>
            </div>
            
            {controller && (
              <div className="flex items-center gap-2 md:ml-4 flex-shrink-0">
                {is_supported ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-900/30 text-red-400 rounded-lg border border-red-800">
                    <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
                    <span className="text-sm font-medium">Compatible</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 text-white rounded-lg border border-white/30">
                    <XCircle className="h-4 w-4 md:h-5 md:w-5" />
                    <span className="text-sm font-medium">Not Compatible</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {/* Platform-specific Protocol Support */}
            <div>
              <span className="text-sm font-semibold text-white mb-3 block">Platform Support:</span>
              
              {platformProtocols.length > 0 ? (
                <div className="space-y-3">
                  {platformProtocols.map((platform) => (
                    <div key={platform.name} className="space-y-2">
                      <div className="flex items-center gap-2">
                        {platform.icon}
                        <span className="text-sm font-medium text-white">{platform.name}</span>
                      </div>
                      
                      {platform.protocols.length > 0 ? (
                        <div className="flex flex-wrap gap-2 ml-6">
                          {platform.protocols.map((item, index) => (
                            <span
                              key={`${platform.name}-${item.protocol}-${index}`}
                              className="flex items-center gap-2 px-3 py-2 bg-zinc-900 
                                         text-white rounded-lg text-sm font-medium border border-white/30"
                            >
                              {getProtocolIcon(item.protocol)}
                              <span>{item.protocol}</span>
                              <span className="text-xs text-white/50">via</span>
                              <div className="flex items-center gap-1">
                                {getConnectivityIcon(item.connectivity)}
                                <span className="text-xs">{item.connectivity}</span>
                              </div>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="ml-6">
                          <span className="px-3 py-2 bg-zinc-900 text-white/70 rounded-lg text-sm border border-white/30">
                            No protocols supported
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // Fallback to legacy protocol display
                <div className="flex flex-wrap gap-2">
                  {controller ? (
                    supported_protocols.map((item, index) => (
                      <span
                        key={`${item.protocol}-${item.connectivity}-${index}`}
                        className="flex items-center gap-2 px-3 py-2 bg-zinc-900 
                                   text-white rounded-lg text-sm font-medium border border-white/30"
                      >
                        {getProtocolIcon(item.protocol)}
                        <span>{item.protocol}</span>
                        <span className="text-xs text-white/50">via</span>
                        <div className="flex items-center gap-1">
                          {getConnectivityIcon(item.connectivity)}
                          <span className="text-xs">{item.connectivity}</span>
                        </div>
                      </span>
                    ))
                  ) : (
                    game.supported_protocols.map((protocol) => (
                      <span
                        key={protocol}
                        className="flex items-center gap-2 px-3 py-2 bg-zinc-900 
                                   text-white rounded-lg text-sm font-medium border border-white/30"
                      >
                        {getProtocolIcon(protocol)}
                        {protocol}
                      </span>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Collapsible Testing Information */}
            {hasTestingInfo && (
              <div className="border border-white/30 rounded-lg overflow-hidden">
                <button
                  onClick={() => setIsTestingInfoExpanded(!isTestingInfoExpanded)}
                  className="w-full px-4 py-3 bg-zinc-900 hover:bg-zinc-800 transition-colors
                             flex items-center justify-between text-left"
                >
                  <h4 className="text-sm font-semibold text-white">Testing Information</h4>
                  {isTestingInfoExpanded ? (
                    <ChevronUp className="h-4 w-4 text-white/50" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-white/50" />
                  )}
                </button>
                
                {isTestingInfoExpanded && (
                  <div className="p-4 bg-black border-t border-white/20">
                    <div className="space-y-2">
                      {/* Platform Testing Info */}
                      {(game.android_tested || game.ios_tested) && (
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-white/50" />
                          <span className="text-white text-sm">
                            Tested on: {[
                              game.android_tested && 'Android',
                              game.ios_tested && 'iOS'
                            ].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                      
                      {(testing_controllers?.length > 0 || testing_controller) && (
                        <div className="flex items-center gap-2">
                          <Gamepad2 className="h-4 w-4 text-white/50" />
                          <span className="text-white text-sm">
                            Tested with: {testing_controllers?.length > 0 
                              ? testing_controllers.map((c: any) => c.name).join(', ')
                              : testing_controller?.name || 'Unknown controller'
                            }
                          </span>
                        </div>
                      )}
                      {game.discord_username && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-white/50" />
                          <span className="text-white text-sm">Tested by: {game.discord_username}</span>
                        </div>
                      )}
                      {game.approved_by && (
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-white/50" />
                          <span className="text-white text-sm">
                            Approved by: {game.approved_by}
                            {(game as any).edited_by_admin && (
                              <span className="ml-2 px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs border border-red-800">
                                Edited by Admin
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      {(game as any).edited_by_admin && !game.approved_by && (
                        <div className="flex items-center gap-2">
                          <Edit3 className="h-4 w-4 text-white/50" />
                          <span className="text-white text-sm">Edited by Admin</span>
                        </div>
                      )}
                      {game.created_at && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-white/50" />
                          <span className="text-white text-sm">
                            Added: {new Date(game.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    {game.testing_notes && (
                      <div className="mt-3 pt-3 border-t border-white/20">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-white/50 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-sm font-medium text-white">Notes: </span>
                            <span className="text-white text-sm">{game.testing_notes}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {controller && !is_supported && (
              <div className="p-3 bg-zinc-900 border border-white/30 rounded-lg">
                <p className="text-sm text-white">
                  <span className="font-semibold">Testing with:</span> {controller.name}
                </p>
                <p className="text-sm text-white/70 mt-1">
                  This game is not compatible with the selected controller's protocols.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};