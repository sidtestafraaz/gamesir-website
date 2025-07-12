import React, { useState } from 'react';
import { Save, ArrowLeft, AlertCircle, CheckCircle, Gamepad2 } from 'lucide-react';
import { Controller } from '../lib/supabase';
import { ControllerMultiSelect } from './ControllerMultiSelect';
import { ProtocolSelector } from './ProtocolSelector';

interface CustomGameFormProps {
  onBack: () => void;
  onSubmit: (gameData: any) => void;
  controllers: Controller[];
  isSubmitting: boolean;
  submitStatus: 'idle' | 'success' | 'error';
  errorMessage: string;
}

interface CustomGameData {
  name: string;
  description: string;
  image_url: string;
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

export const CustomGameForm: React.FC<CustomGameFormProps> = ({
  onBack,
  onSubmit,
  controllers,
  isSubmitting,
  submitStatus,
  errorMessage
}) => {
  const [formData, setFormData] = useState<CustomGameData>({
    name: '',
    description: '',
    image_url: '',
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

  const handleInputChange = (field: keyof CustomGameData, value: string | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProtocolChange = (platform: 'androidProtocols' | 'iosProtocols', protocol: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [protocol]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    if (!formData.androidTested && !formData.iosTested) {
      return;
    }

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
      name: formData.name.trim(),
      supported_protocols: supportedProtocols,
      description: formData.description.trim() || 'Custom game entry',
      image_url: formData.image_url.trim() || null,
      testing_controller_id: formData.testingControllerIds.length > 0 ? formData.testingControllerIds[0] : null,
      testing_notes: formData.notes || null,
      discord_username: formData.discordUsername || null,
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

    onSubmit(gameData);
  };

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
              <span className="font-medium">Back to Search</span>
            </button>
            <div className="flex items-center gap-4">
              <Gamepad2 className="h-8 w-8 text-red-600" />
              <h1 className="text-xl font-bold text-white">Create Custom Game</h1>
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
                <Gamepad2 className="h-6 w-6 text-red-600" />
                <div className="flex flex-col">
                  <h1 className="text-sm font-bold text-white leading-tight">
                    Custom Game
                  </h1>
                  <span className="text-xs text-white/70">Create</span>
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
            {/* Game Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-white mb-3">
                Game Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-white/30 rounded-lg 
                           text-white placeholder-white/50 bg-black focus:outline-none focus:ring-2 
                           focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                placeholder="Enter the game name"
                required
              />
            </div>

            {/* Game Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-white mb-3">
                Game Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-white/30 rounded-lg 
                           text-white placeholder-white/50 bg-black focus:outline-none focus:ring-2 
                           focus:ring-red-500 focus:border-red-500 transition-all duration-200 
                           resize-vertical"
                placeholder="Describe the game, its genre, and gameplay..."
              />
            </div>

            {/* Image URL */}
            <div>
              <label htmlFor="image_url" className="block text-sm font-semibold text-white mb-3">
                Game Image URL (Optional)
              </label>
              <input
                type="url"
                id="image_url"
                value={formData.image_url}
                onChange={(e) => handleInputChange('image_url', e.target.value)}
                className="w-full px-4 py-3 border border-white/30 rounded-lg 
                           text-white placeholder-white/50 bg-black focus:outline-none focus:ring-2 
                           focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                placeholder="https://example.com/game-image.jpg"
              />
              <p className="text-xs text-white/50 mt-2">
                Optional: Provide a direct link to the game's cover image
              </p>
            </div>

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
                <span className="text-red-400">Custom game submitted successfully! Redirecting to search page...</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={isSubmitting || !formData.name.trim() || (!formData.androidTested && !formData.iosTested)}
                className="flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 bg-red-600 hover:bg-red-700 
                           disabled:bg-zinc-900 disabled:cursor-not-allowed text-white 
                           font-semibold rounded-lg transition-all duration-200 border border-white/30"
              >
                <Save className="h-5 w-5" />
                {isSubmitting ? 'Submitting Game...' : 'Submit Custom Game'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
