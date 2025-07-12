import React, { useState, useEffect } from 'react';
import { Save, X, AlertCircle, CheckCircle, Gamepad2 } from 'lucide-react';
import { supabase, Game, Controller } from '../lib/supabase';
import { ControllerMultiSelect } from './ControllerMultiSelect';
import { ProtocolSelector } from './ProtocolSelector';

interface AddGameInfoModalProps {
  game: Game;
  onClose: () => void;
  onSubmit: () => void;
}

interface FormData {
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

export const AddGameInfoModal: React.FC<AddGameInfoModalProps> = ({
  game,
  onClose,
  onSubmit
}) => {
  const [controllers, setControllers] = useState<Controller[]>([]);
  const [formData, setFormData] = useState<FormData>({
    androidTested: false,
    iosTested: false,
    androidProtocols: {
      hid: '',
      xinput: '',
      ds4: '',
      ns: ''
      gtouch: '',
      gip: ''
    },
    iosProtocols: {
      hid: '',
      xinput: '',
      ds4: '',
      ns: ''
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

  const handleInputChange = (field: keyof FormData, value: string | boolean | string[]) => {
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
    
    if (!formData.androidTested && !formData.iosTested) {
      setErrorMessage('Please test the game on at least one platform (Android or iOS)');
      setSubmitStatus('error');
      return;
    }

    if (!formData.discordUsername.trim()) {
      setErrorMessage('Discord username is required');
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
          if (connectivity && connectivity !== 'None' && !supportedProtocols.includes(protocol.toUpperCase())) {
            supportedProtocols.push(protocol.toUpperCase());
          }
        });
      }
      
      if (formData.iosTested) {
        Object.entries(formData.iosProtocols).forEach(([protocol, connectivity]) => {
          if (connectivity && connectivity !== 'None' && !supportedProtocols.includes(protocol.toUpperCase())) {
            supportedProtocols.push(protocol.toUpperCase());
          }
        });
      }

      // Create a new game entry with additional info (for approval)
      const gameData = {
        name: game.name,
        supported_protocols: supportedProtocols,
        description: game.description,
        image_url: game.image_url,
        igdb_id: game.igdb_id,
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
        android_gtouch: formData.androidTested ? formData.androidProtocols.gtouch || null : null,
        android_gip: formData.androidTested ? formData.androidProtocols.gip || null : null,
        ios_hid: formData.iosTested ? formData.iosProtocols.hid || null : null,
        ios_xinput: formData.iosTested ? formData.iosProtocols.xinput || null : null,
        ios_ds4: formData.iosTested ? formData.iosProtocols.ds4 || null : null,
        ios_ns: formData.iosTested ? formData.iosProtocols.ns || null : null,
        ios_gtouch: formData.iosTested ? formData.iosProtocols.gtouch || null : null,
        ios_gip: formData.iosTested ? formData.iosProtocols.gip || null : null,
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
          .eq('is_approved', false)
          .order('created_at', { ascending: false })
          .limit(1)
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
        onSubmit();
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error('Error adding additional game info:', error);
      setErrorMessage(error.message || 'Failed to submit additional information');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/30 rounded-xl p-4 md:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Gamepad2 className="h-6 w-6 text-red-600" />
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white">Add Additional Info</h2>
              <p className="text-sm text-white/70">for {game.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white/50" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
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
              Discord Username *
            </label>
            <input
              type="text"
              id="discordUsername"
              value={formData.discordUsername}
              onChange={(e) => handleInputChange('discordUsername', e.target.value)}
              className="w-full px-4 py-3 border border-white/30 rounded-lg 
                         text-white placeholder-white/50 bg-black focus:outline-none focus:ring-2 
                         focus:ring-red-500 focus:border-red-500 transition-all duration-200"
              placeholder="Your Discord username (required)"
              required
            />
            <p className="text-xs text-white/50 mt-2">
              Required: For community recognition and follow-up questions
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
              <span className="text-red-400">Additional information submitted successfully! It will be reviewed by admins.</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-6 border-t border-white/20">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 md:px-6 py-2 md:py-3 border border-white/30 text-white hover:bg-white/5 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         font-medium rounded-lg transition-all duration-200 text-sm md:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!formData.androidTested && !formData.iosTested) || !formData.discordUsername.trim()}
              className="flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 bg-red-600 hover:bg-red-700 
                         disabled:bg-zinc-900 disabled:cursor-not-allowed text-white 
                         font-semibold rounded-lg transition-all duration-200 text-sm md:text-base"
            >
              <Save className="h-5 w-5" />
              {isSubmitting ? 'Submitting...' : 'Submit Additional Info'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};