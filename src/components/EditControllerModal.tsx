import React, { useState } from 'react';
import { Save, X, CheckCircle } from 'lucide-react';
import { Controller } from '../lib/supabase';

interface EditControllerModalProps {
  controller: Controller;
  onSave: (controllerId: string, updatedData: any) => void;
  onClose: () => void;
}

export const EditControllerModal: React.FC<EditControllerModalProps> = ({
  controller,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState({
    name: controller.name,
    manufacturer: controller.manufacturer,
    wiredProtocols: {
      HID: controller.wired_protocols.includes('HID'),
      XINPUT: controller.wired_protocols.includes('XINPUT'),
      DS4: controller.wired_protocols.includes('DS4'),
      NS: controller.wired_protocols.includes('NS')
    },
    bluetoothProtocols: {
      HID: controller.bluetooth_protocols.includes('HID'),
      XINPUT: controller.bluetooth_protocols.includes('XINPUT'),
      DS4: controller.bluetooth_protocols.includes('DS4'),
      NS: controller.bluetooth_protocols.includes('NS')
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProtocolChange = (
    category: 'wiredProtocols' | 'bluetoothProtocols',
    protocol: keyof typeof formData.wiredProtocols,
    checked: boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [protocol]: checked
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const wiredProtocolsArray = Object.entries(formData.wiredProtocols)
      .filter(([_, enabled]) => enabled)
      .map(([protocol, _]) => protocol);

    const bluetoothProtocolsArray = Object.entries(formData.bluetoothProtocols)
      .filter(([_, enabled]) => enabled)
      .map(([protocol, _]) => protocol);

    const allProtocols = [...new Set([...wiredProtocolsArray, ...bluetoothProtocolsArray])];

    const updatedData = {
      name: formData.name.trim(),
      manufacturer: formData.manufacturer,
      supported_protocols: allProtocols,
      wired_protocols: wiredProtocolsArray,
      bluetooth_protocols: bluetoothProtocolsArray
    };

    onSave(controller.id, updatedData);
  };

  const protocols = [
    { key: 'HID', label: 'HID', description: 'Human Interface Device' },
    { key: 'XINPUT', label: 'XINPUT', description: 'Xbox Input API' },
    { key: 'DS4', label: 'DS4', description: 'DualShock 4 Protocol' },
    { key: 'NS', label: 'NS', description: 'Nintendo Switch Protocol' }
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/30 rounded-xl p-4 md:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg md:text-xl font-bold text-white">Edit Controller</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white/50" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white border-b border-white/20 pb-2">
              Basic Information
            </h3>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                Controller Name *
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

            <div>
              <label htmlFor="manufacturer" className="block text-sm font-medium text-white mb-2">
                Manufacturer
              </label>
              <input
                type="text"
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                className="w-full px-3 md:px-4 py-2 md:py-3 border border-white/30 rounded-lg 
                           text-white placeholder-white/50 bg-black focus:outline-none focus:ring-2 
                           focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-sm md:text-base"
              />
            </div>
          </div>

          {/* Wired/2.4GHz Protocols */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white border-b border-white/20 pb-2">
              Wired/2.4GHz Protocols
            </h3>
            <p className="text-sm text-white/70">
              Select protocols supported when connected via wired or 2.4GHz wireless connection
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {protocols.map(({ key, label, description }) => (
                <div key={`wired-${key}`} className="relative">
                  <input
                    id={`wired-${key}`}
                    type="checkbox"
                    checked={formData.wiredProtocols[key]}
                    onChange={(e) => handleProtocolChange('wiredProtocols', key, e.target.checked)}
                    className="sr-only"
                  />
                  <label
                    htmlFor={`wired-${key}`}
                    className={`flex flex-col p-3 border-2 rounded-lg cursor-pointer 
                               transition-all duration-200 hover:border-red-600
                               ${formData.wiredProtocols[key] 
                                 ? 'border-red-600 bg-red-900/20' 
                                 : 'border-white/30 bg-black'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-white">{label}</span>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center
                                     ${formData.wiredProtocols[key] 
                                       ? 'border-red-600 bg-red-600' 
                                       : 'border-white/50'}`}>
                        {formData.wiredProtocols[key] && (
                          <CheckCircle className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-white/70">{description}</p>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Bluetooth Protocols */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white border-b border-white/20 pb-2">
              Bluetooth Protocols
            </h3>
            <p className="text-sm text-white/70">
              Select protocols supported when connected via Bluetooth
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {protocols.map(({ key, label, description }) => (
                <div key={`bluetooth-${key}`} className="relative">
                  <input
                    id={`bluetooth-${key}`}
                    type="checkbox"
                    checked={formData.bluetoothProtocols[key]}
                    onChange={(e) => handleProtocolChange('bluetoothProtocols', key, e.target.checked)}
                    className="sr-only"
                  />
                  <label
                    htmlFor={`bluetooth-${key}`}
                    className={`flex flex-col p-3 border-2 rounded-lg cursor-pointer 
                               transition-all duration-200 hover:border-red-600
                               ${formData.bluetoothProtocols[key] 
                                 ? 'border-red-600 bg-red-900/20' 
                                 : 'border-white/30 bg-black'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-white">{label}</span>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center
                                     ${formData.bluetoothProtocols[key] 
                                       ? 'border-red-600 bg-red-600' 
                                       : 'border-white/50'}`}>
                        {formData.bluetoothProtocols[key] && (
                          <CheckCircle className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-white/70">{description}</p>
                  </label>
                </div>
              ))}
            </div>
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
              className="flex items-center justify-center gap-2 px-6 md:px-8 py-2 md:py-3 bg-red-600 hover:bg-red-700 
                         disabled:bg-zinc-900 disabled:cursor-not-allowed text-white 
                         font-semibold rounded-lg transition-all duration-200 text-sm md:text-base"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};