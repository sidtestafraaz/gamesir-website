import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase, Controller } from '../lib/supabase';
import { GameSearchDropdown } from './GameSearchDropdown';
import { CustomGameForm } from './CustomGameForm';
import { ControllerMultiSelect } from './ControllerMultiSelect';
import { ProtocolSelector } from './ProtocolSelector';
import { IGDBGame } from '../lib/igdb';

interface AddGameFormProps {
  onBack: () => void;
}

interface FormData {
  selectedGame: IGDBGame | null;
  androidTested: boolean;
  iosTested: boolean;
  androidProtocols: {
    hid: string;
    xinput: string;
    ds4: string;
    ns: string;
    gtouch: string;
    gip: string;
  };
  iosProtocols: {
    hid: string;
    xinput: string;
    ds4: string;
    ns: string;
    gtouch: string;
    gip: string;
  };
  testingControllerIds: string[];
  notes: string;
  discordUsername: string;
}

export const AddGameForm: React.FC<AddGameFormProps> = ({ onBack }) => {
  const [controllers, setControllers] = useState<Controller[]>([]);
  const [currentView, setCurrentView] = useState<'search' | 'custom'>('search');
  const [formData, setFormData] = useState<FormData>({
    selectedGame: null,
    androidTested: false,
    iosTested: false,
    androidProtocols: {
      hid: '',
      xinput: '',
      ds4: '',
      ns: '',
      gtouch: '',
      gip: ''
    },
    iosProtocols: {
      hid: '',
      xinput: '',
      ds4: '',
      ns: '',
      gtouch: '',
      gip: ''
    },
    testingControllerIds: [],
    notes: '',
    discordUsername: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchControllers = async () => {
      try {
        const { data, error } = await supabase
          .from('controllers')
          .select('*')
          .order('name');
        
        if (error) throw error;
        if (data) setControllers(data);
      } catch (error) {
        console.error('Error fetching controllers:', error);
      }
    };

    fetchControllers();
  }, []);

  const handleInputChange = (field: keyof FormData, value: string | boolean | IGDBGame | null | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (submitStatus !== 'idle') {
      setSubmitStatus('idle');
      setErrorMessage('');
    }
  };

  const handleProtocolChange = (platform: 'androidProtocols' | 'iosProtocols', protocol: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [protocol]: value
      }
    }));
    if (submitStatus !== 'idle') {
      setSubmitStatus('idle');
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.selectedGame) {
      setErrorMessage('Please select a game from the search results');
      setSubmitStatus('error');
      return;
    }

    if (!formData.androidTested && !formData.iosTested) {
      setErrorMessage('Please test the game on at least one platform (Android or iOS)');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Create legacy supported_protocols array for backward compatibility
      const supportedProtocols: string[] = [];
      
      if (formData.androidTested) {
        Object.entries(formData.androidProtocols).forEach(([protocol, connectivity]) => {
          if (connectivity && !supportedProtocols.includes(protocol.toUpperCase())) {
            supportedProtocols.push(protocol.toUpperCase());
          }
        });
      }
      
      if (formData.iosTested) {
        Object.entries(formData.iosProtocols).forEach(([protocol, connectivity]) => {
          if (connectivity && !supportedProtocols.includes(protocol.toUpperCase())) {
            supportedProtocols.push(protocol.toUpperCase());
          }
        });
      }

      const gameData = {
        name: formData.selectedGame.name,
        supported_protocols: supportedProtocols,
        description: formData.selectedGame.description,
        image_url: formData.selectedGame.image_url,
        igdb_id: formData.selectedGame.id,
        testing_controller_id: formData.testingControllerIds.length > 0 ? formData.testingControllerIds[0] : null,
        testing_notes: formData.notes || null,
        discord_username: formData.discordUsername || null,
        is_approved: false,
        // Store multiple testing controllers
        testing_controller_ids: formData.testingControllerIds,
        // New Android/iOS testing fields
        android_tested: formData.androidTested,
        ios_tested: formData.iosTested,
        android_hid: formData.androidTested ? formData.androidProtocols.hid || null : null,
        android_xinput: formData.androidTested ? formData.androidProtocols.xinput || null : null,
        android_ds4: formData.androidTested ? formData.androidProtocols.ds4 || null : null,
        android_ns: formData.androidTested ? formData.androidProtocols.ns || null : null,
        android_gip: formData.androidTested ? formData.androidProtocols.gip || null : null,
        android_gtouch: formData.androidTested ? formData.androidProtocols.gtouch || null : null,
        ios_hid: formData.iosTested ? formData.iosProtocols.hid || null : null,
        ios_xinput: formData.iosTested ? formData.iosProtocols.xinput || null : null,
        ios_ds4: formData.iosTested ? formData.iosProtocols.ds4 || null : null,
        ios_ns: formData.iosTested ? formData.iosProtocols.ns || null : null,
        ios_gip: formData.iosTested ? formData.iosProtocols.gip || null : null,
        ios_gtouch: formData.iosTested ? formData.iosProtocols.gtouch || null : null,
      };

      const { error } = await supabase
        .from('games')
        .insert([gameData]);

      if (error) throw error;

      // Insert testing controllers into junction table
      if (formData.testingControllerIds.length > 0) {
        const { data: insertedGame } = await supabase
          .from('games')
          .select('id')
          .eq('name', gameData.name)
          .eq('igdb_id', gameData.igdb_id)
          .single();

        if (insertedGame) {
          const junctionData = formData.testingControllerIds.map(controllerId => ({
            game_id: insertedGame.id,
            controller_id: controllerId
          }));

          await supabase
            .from('games_testing_controllers')
            .insert(junctionData);
        }
      }

      setSubmitStatus('success');
      setTimeout(() => {
        onBack(); // Redirect to search page
      }, 2000);

    } catch (error: any) {
      console.error('Error adding game:', error);
      setErrorMessage(error.message || 'Failed to add game');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomGameSubmit = async (customGameData: any) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const { error } = await supabase
        .from('games')
        .insert([{
          ...customGameData,
          is_approved: false
        }]);

      if (error) throw error;

      setSubmitStatus('success');
      setTimeout(() => {
        onBack(); // Redirect to search page
      }, 2000);

    } catch (error: any) {
      console.error('Error adding custom game:', error);
      setErrorMessage(error.message || 'Failed to add custom game');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentView === 'custom') {
    return (
      <CustomGameForm
        onBack={() => setCurrentView('search')}
        onSubmit={handleCustomGameSubmit}
        controllers={controllers}
        isSubmitting={isSubmitting}
        submitStatus={submitStatus}
        errorMessage={errorMessage}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black border-b border-white/20 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between h-16">
            <button
              onClick={onBack}
              className="flex items-center gap-3 text-white hover:text-white transition-colors
                         px-4 py-2 rounded-lg hover:bg-white/5 border border-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Database</span>
            </button>
            <div className="flex items-center gap-4">
              <img 
                src="/image.png" 
                alt="GameSir" 
                className="h-8 w-auto"
              />
              <h1 className="text-xl font-bold text-white">Add New Game</h1>
            </div>
            <div className="w-32"></div>
          </div>

          {/* Mobile Header */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between h-14 py-2">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-white hover:text-white transition-colors
                           px-3 py-2 rounded-lg hover:bg-white/5 border border-white/20"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2">
                <img 
                  src="/image.png" 
                  alt="GameSir" 
                  className="h-6 w-auto"
                />
                <div className="h-8 w-px bg-white/20"></div>
                <div className="flex flex-col">
                  <h1 className="text-sm font-bold text-white leading-tight">
                      Add New
                  </h1>
                  <span className="text-xs text-white/70">Game</span>
                </div>
              </div>
              <div className="w-16"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-black border border-white/30 rounded-xl p-4 md:p-6 lg:p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            {/* Game Search */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Search Mobile Game *
              </label>
              <GameSearchDropdown
                selectedGame={formData.selectedGame}
                onSelect={(game) => handleInputChange('selectedGame', game)}
                onCreateCustom={() => setCurrentView('custom')}
                placeholder="Search for mobile games on IGDB..."
              />
              <p className="text-xs text-white/50 mt-2">
                Search and select a mobile game from the IGDB database
              </p>
            </div>

            {/* Selected Game Preview */}
            {formData.selectedGame && (
              <div className="p-4 md:p-6 bg-black border border-white/30 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Selected Game</h3>
                <div className="flex items-start gap-4">
                  {formData.selectedGame.image_url && (
                    <img 
                      src={formData.selectedGame.image_url} 
                      alt={formData.selectedGame.name}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-lg md:text-xl mb-2">{formData.selectedGame.name}</h4>
                    <p className="text-white/70 text-sm leading-relaxed line-clamp-3">
                      {formData.selectedGame.description}
                    </p>
                    {formData.selectedGame.genres.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.selectedGame.genres.map((genre) => (
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
              </div>
            )}

            {/* Platform Testing */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Platform Testing *</h3>
                <p className="text-sm text-white/70 mb-6">
                  Select the platforms you've tested this game on and specify protocol support for each.
                </p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Android Testing */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        id="androidTested"
                        type="checkbox"
                        checked={formData.androidTested}
                        onChange={(e) => handleInputChange('androidTested', e.target.checked)}
                        className="w-5 h-5 text-red-600 bg-black border-white/30 rounded focus:ring-red-500"
                      />
                      <label htmlFor="androidTested" className="text-base font-semibold text-white">
                        Tested on Android
                      </label>
                    </div>
                    
                    {formData.androidTested && (
                      <div className="ml-8 p-4 bg-zinc-900/50 border border-white/20 rounded-lg">
                        <ProtocolSelector
                          platform="android"
                          protocols={formData.androidProtocols}
                          onChange={(protocol, value) => handleProtocolChange('androidProtocols', protocol, value)}
                          title="Android"
                        />
                      </div>
                    )}
                  </div>

                  {/* iOS Testing */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        id="iosTested"
                        type="checkbox"
                        checked={formData.iosTested}
                        onChange={(e) => handleInputChange('iosTested', e.target.checked)}
                        className="w-5 h-5 text-red-600 bg-black border-white/30 rounded focus:ring-red-500"
                      />
                      <label htmlFor="iosTested" className="text-base font-semibold text-white">
                        Tested on iOS
                      </label>
                    </div>
                    
                    {formData.iosTested && (
                      <div className="ml-8 p-4 bg-zinc-900/50 border border-white/20 rounded-lg">
                        <ProtocolSelector
                          platform="ios"
                          protocols={formData.iosProtocols}
                          onChange={(protocol, value) => handleProtocolChange('iosProtocols', protocol, value)}
                          title="iOS"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Testing Controllers - Searchable Multi-select */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                GameSir Controllers Used for Testing
              </label>
              <p className="text-xs text-white/50 mb-3">
                Search and select all controllers you used to test this game
              </p>
              
              <ControllerMultiSelect
                controllers={controllers}
                selectedControllerIds={formData.testingControllerIds}
                onSelectionChange={(ids) => handleInputChange('testingControllerIds', ids)}
                placeholder="Search and select controllers..."
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-semibold text-white mb-3">
                Testing Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-white/30 rounded-lg 
                           text-white placeholder-white/50 bg-black focus:outline-none focus:ring-2 
                           focus:ring-red-500 focus:border-red-500 transition-all duration-200 
                           resize-vertical"
                placeholder="Share your testing experience, performance notes, or compatibility details..."
              />
            </div>

            {/* Discord Username */}
            <div>
              <label htmlFor="discordUsername" className="block text-sm font-semibold text-white mb-3">
                Discord Username
              </label>
              <input
                type="text"
                id="discordUsername"
                value={formData.discordUsername}
                onChange={(e) => handleInputChange('discordUsername', e.target.value)}
                className="w-full px-4 py-3 border border-white/30 rounded-lg 
                           text-white placeholder-white/50 bg-black focus:outline-none focus:ring-2 
                           focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                placeholder="Your Discord username (optional)"
              />
              <p className="text-xs text-white/50 mt-2">
                Optional: For community recognition and follow-up questions
              </p>
            </div>

            {/* Status Messages */}
            {submitStatus === 'error' && (
              <div className="flex items-center gap-3 p-4 bg-black border border-white/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <span className="text-red-400">{errorMessage}</span>
              </div>
            )}

            {submitStatus === 'success' && (
              <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-800 rounded-lg">
                <CheckCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <span className="text-red-400">Game submitted successfully! Redirecting to search page...</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={isSubmitting || !formData.selectedGame}
                className="flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 bg-red-600 hover:bg-red-700 
                           disabled:bg-zinc-900 disabled:cursor-not-allowed text-white 
                           font-semibold rounded-lg transition-all duration-200 border border-white/30"
              >
                <Save className="h-5 w-5" />
                {isSubmitting ? 'Submitting Game...' : 'Submit for Approval'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
