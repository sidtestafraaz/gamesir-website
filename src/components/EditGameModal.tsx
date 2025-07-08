import React, { useState } from 'react';
import { Save, X, CheckCircle } from 'lucide-react';
import { Game, Controller } from '../lib/supabase';
import { ControllerMultiSelect } from './ControllerMultiSelect';
import { ProtocolSelector } from './ProtocolSelector';

interface EditGameModalProps {
  game: Game;
  controllers: Controller[];
  onSave: (gameId: string, updatedData: any, approveAfterSave?: boolean) => void;
  onClose: () => void;
}

export const EditGameModal: React.FC<EditGameModalProps> = ({
  game,
  controllers,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState({
    name: game.name,
    description: game.description || '',
    image_url: game.image_url || '',
    androidTested: game.android_tested || false,
    iosTested: game.ios_tested || false,
    androidProtocols: {
      hid: game.android_hid || '',
      xinput: game.android_xinput || '',
      ds4: game.android_ds4 || '',
      ns: game.android_ns || ''
    },
    iosProtocols: {
      hid: game.ios_hid || '',
      xinput: game.ios_xinput || '',
      ds4: game.ios_ds4 || '',
      ns: game.ios_ns || ''
    },
    testingControllerIds: game.testing_controller_id ? [game.testing_controller_id] : [],
    notes: game.testing_notes || ''
  });

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
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

  const handleSubmit = (e: React.FormEvent, approveAfterSave = false) => {
    e.preventDefault();
    
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

    const updatedData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      image_url: formData.image_url.trim() || null,
      supported_protocols: supportedProtocols,
      testing_controller_id: formData.testingControllerIds.length > 0 ? formData.testingControllerIds[0] : null,
      testing_notes: formData.notes.trim() || null,
      // New Android/iOS testing fields
      android_tested: formData.androidTested,
      ios_tested: formData.iosTested,
      android_hid: formData.androidTested ? formData.androidProtocols.hid || null : null,
      android_xinput: formData.androidTested ? formData.androidProtocols.xinput || null : null,
      android_ds4: formData.androidTested ? formData.androidProtocols.ds4 || null : null,
      android_ns: formData.androidTested ? formData.androidProtocols.ns || null : null,
      ios_hid: formData.iosTested ? formData.iosProtocols.hid || null : null,
      ios_xinput: formData.iosTested ? formData.iosProtocols.xinput || null : null,
      ios_ds4: formData.iosTested ? formData.iosProtocols.ds4 || null : null,
      ios_ns: formData.iosTested ? formData.iosProtocols.ns || null : null,
    };

    onSave(game.id, updatedData, approveAfterSave, formData.testingControllerIds);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/30 rounded-xl p-4 md:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg md:text-xl font-bold text-white">Edit Game</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white/50" />
          </button>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4 md:space-y-6">
          {/* Game Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-white mb-2">
              Game Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 md:px-4 py-2 md:py-3 border border-white/30 rounded-lg 
                         text-white placeholder-white/50 bg-black focus:outline-none focus:ring-2 
                         focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-sm md:text-base"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-white mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 md:px-4 py-2 md:py-3 border border-white/30 rounded-lg 
                         text-white placeholder-white/50 bg-black focus:outline-none focus:ring-2 
                         focus:ring-red-500 focus:border-red-500 transition-all duration-200 
                         resize-vertical text-sm md:text-base"
            />
          </div>

          {/* Image URL */}
          <div>
            <label htmlFor="image_url" className="block text-sm font-semibold text-white mb-2">
              Image URL
            </label>
            <input
              type="url"
              id="image_url"
              value={formData.image_url}
              onChange={(e) => handleInputChange('image_url', e.target.value)}
              className="w-full px-3 md:px-4 py-2 md:py-3 border border-white/30 rounded-lg 
                         text-white placeholder-white/50 bg-black focus:outline-none focus:ring-2 
                         focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-sm md:text-base"
              placeholder="https://example.com/game-image.jpg"
            />
          </div>

          {/* Platform Testing */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white">Platform Testing</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Android Testing */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    id="androidTested"
                    type="checkbox"
                    checked={formData.androidTested}
                    onChange={(e) => handleInputChange('androidTested', e.target.checked)}
                    className="w-4 h-4 text-red-600 bg-black border-white/30 rounded focus:ring-red-500"
                  />
                  <label htmlFor="androidTested" className="text-sm font-semibold text-white">
                    Tested on Android
                  </label>
                </div>
                
                {formData.androidTested && (
                  <div className="ml-7 p-3 bg-zinc-900/50 border border-white/20 rounded-lg">
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
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    id="iosTested"
                    type="checkbox"
                    checked={formData.iosTested}
                    onChange={(e) => handleInputChange('iosTested', e.target.checked)}
                    className="w-4 h-4 text-red-600 bg-black border-white/30 rounded focus:ring-red-500"
                  />
                  <label htmlFor="iosTested" className="text-sm font-semibold text-white">
                    Tested on iOS
                  </label>
                </div>
                
                {formData.iosTested && (
                  <div className="ml-7 p-3 bg-zinc-900/50 border border-white/20 rounded-lg">
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

          {/* Testing Controllers - Searchable Multi-select */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Testing Controllers
            </label>
            <p className="text-xs text-white/50 mb-3">
              Search and select all controllers used to test this game
            </p>
            
            <ControllerMultiSelect
              controllers={controllers}
              selectedControllerIds={formData.testingControllerIds}
              onSelectionChange={(ids) => handleInputChange('testingControllerIds', ids)}
              placeholder="Search and select controllers..."
            />
          </div>

          {/* Testing Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-white mb-2">
              Testing Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 md:px-4 py-2 md:py-3 border border-white/30 rounded-lg 
                         text-white placeholder-white/50 bg-black focus:outline-none focus:ring-2 
                         focus:ring-red-500 focus:border-red-500 transition-all duration-200 
                         resize-vertical text-sm md:text-base"
              placeholder="Testing experience, performance notes, or compatibility details..."
            />
          </div>

          {/* Discord Username - Read Only */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Discord Username (Read Only)
            </label>
            <input
              type="text"
              value={game.discord_username || 'Not provided'}
              disabled
              className="w-full px-3 md:px-4 py-2 md:py-3 border border-white/30 rounded-lg 
                         text-white/50 bg-black/50 cursor-not-allowed text-sm md:text-base"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 md:pt-6 border-t border-white/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 md:px-6 py-2 md:py-3 border border-white/30 text-white hover:bg-white/5 
                         font-medium rounded-lg transition-all duration-200 text-sm md:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name.trim()}
              className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-black hover:bg-black/80 
                         disabled:bg-zinc-900 disabled:cursor-not-allowed text-white 
                         font-medium rounded-lg transition-all duration-200 border border-white/30 text-sm md:text-base"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={!formData.name.trim()}
              className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-red-600 hover:bg-red-700 
                         disabled:bg-zinc-900 disabled:cursor-not-allowed text-white 
                         font-medium rounded-lg transition-all duration-200 text-sm md:text-base"
            >
              <CheckCircle className="h-4 w-4" />
              Save & Approve
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};