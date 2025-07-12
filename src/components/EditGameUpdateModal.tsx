import React, { useState } from 'react';
import { Save, X, CheckCircle } from 'lucide-react';
import { GameUpdate, Controller } from '../lib/supabase';
import { ControllerMultiSelect } from './ControllerMultiSelect';
import { ProtocolSelector } from './ProtocolSelector';

interface EditGameUpdateModalProps {
  gameUpdate: GameUpdate;
  controllers: Controller[];
  onSave: (updateId: string, updatedData: any, approveAfterSave?: boolean) => void;
  onClose: () => void;
}

export const EditGameUpdateModal: React.FC<EditGameUpdateModalProps> = ({
  gameUpdate,
  controllers,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState({
    androidTested: gameUpdate.android_tested || false,
    iosTested: gameUpdate.ios_tested || false,
    androidProtocols: {
      hid: gameUpdate.android_hid || '',
      xinput: gameUpdate.android_xinput || '',
      ds4: gameUpdate.android_ds4 || '',
      ns: gameUpdate.android_ns || '',
      gtouch: gameUpdate.android_gtouch || '',
      gip: gameUpdate.android_gip || ''
    },
    iosProtocols: {
      hid: gameUpdate.ios_hid || '',
      xinput: gameUpdate.ios_xinput || '',
      ds4: gameUpdate.ios_ds4 || '',
      ns: gameUpdate.ios_ns || '',
      gtouch: gameUpdate.ios_gtouch || '',
      gip: gameUpdate.ios_gip || ''
    },
    testingControllerIds: gameUpdate.testing_controller_ids || [],
    notes: gameUpdate.testing_notes || '',
    discordUsername: gameUpdate.discord_username || ''
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
    
    const updatedData = {
      testing_controller_id: formData.testingControllerIds.length > 0 ? formData.testingControllerIds[0] : null,
      testing_notes: formData.notes.trim() || null,
      discord_username: formData.discordUsername.trim() || null,
      testing_controller_ids: formData.testingControllerIds,
      // Android/iOS testing fields
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

    onSave(gameUpdate.id, updatedData, approveAfterSave);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/30 rounded-xl p-4 md:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg md:text-xl font-bold text-white">Edit Game Update</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white/50" />
          </button>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4 md:space-y-6">
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

          {/* Testing Controllers */}
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

          {/* Discord Username */}
          <div>
            <label htmlFor="discordUsername" className="block text-sm font-semibold text-white mb-2">
              Discord Username
            </label>
            <input
              type="text"
              id="discordUsername"
              value={formData.discordUsername}
              onChange={(e) => handleInputChange('discordUsername', e.target.value)}
              className="w-full px-3 md:px-4 py-2 md:py-3 border border-white/30 rounded-lg 
                         text-white placeholder-white/50 bg-black focus:outline-none focus:ring-2 
                         focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-sm md:text-base"
              placeholder="Discord username"
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
              disabled={!formData.discordUsername.trim()}
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
              disabled={!formData.discordUsername.trim()}
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