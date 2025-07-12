import React, { useState } from 'react';
import { Save, ArrowLeft, AlertCircle, CheckCircle, Gamepad2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AddControllerFormProps {
  onBack: () => void;
}

interface FormData {
  name: string;
  manufacturer: string;
  wiredProtocols: {
    HID: boolean;
    XINPUT: boolean;
    DS4: boolean;
    NS: boolean;
    'G-TOUCH': boolean;
    GIP: boolean;
  };
  bluetoothProtocols: {
    HID: boolean;
    XINPUT: boolean;
    DS4: boolean;
    NS: boolean;
    'G-TOUCH': boolean;
  };
}

export const AddControllerForm: React.FC<AddControllerFormProps> = ({ onBack }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    manufacturer: 'GameSir',
    wiredProtocols: {
      HID: false,
      XINPUT: false,
      DS4: false,
      NS: false
      'G-TOUCH': false,
      GIP: false
    },
    bluetoothProtocols: {
      HID: false,
      XINPUT: false,
      DS4: false,
      NS: false
      'G-TOUCH': false
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (submitStatus !== 'idle') {
      setSubmitStatus('idle');
      setErrorMessage('');
    }
  };

  const handleProtocolChange = (
    category: 'wiredProtocols' | 'bluetoothProtocols',
    protocol: keyof FormData['wiredProtocols'],
    checked: boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [protocol]: checked
      }
    }));
    if (submitStatus !== 'idle') {
      setSubmitStatus('idle');
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setErrorMessage('Controller name is required');
      setSubmitStatus('error');
      return;
    }

    const wiredProtocolsArray = Object.entries(formData.wiredProtocols)
      .filter(([_, enabled]) => enabled)
      .map(([protocol, _]) => protocol);

    const bluetoothProtocolsArray = Object.entries(formData.bluetoothProtocols)
      .filter(([_, enabled]) => enabled)
      .map(([protocol, _]) => protocol);

    if (wiredProtocolsArray.length === 0 && bluetoothProtocolsArray.length === 0) {
      setErrorMessage('At least one protocol must be selected');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const allProtocols = [...new Set([...wiredProtocolsArray, ...bluetoothProtocolsArray])];

      const controllerData = {
        name: formData.name.trim(),
        manufacturer: formData.manufacturer,
        supported_protocols: allProtocols,
        wired_protocols: wiredProtocolsArray,
        bluetooth_protocols: bluetoothProtocolsArray
      };

      const { error } = await supabase
        .from('controllers')
        .insert([controllerData]);

      if (error) throw error;

      setSubmitStatus('success');
      setTimeout(() => {
        setFormData({
          name: '',
          manufacturer: 'GameSir',
          wiredProtocols: {
            HID: false,
            XINPUT: false,
            DS4: false,
            NS: false
          },
          bluetoothProtocols: {
            HID: false,
            XINPUT: false,
            DS4: false,
            NS: false
          }
        });
        setSubmitStatus('idle');
      }, 2000);

    } catch (error: any) {
      console.error('Error adding controller:', error);
      setErrorMessage(error.message || 'Failed to add controller');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const protocols = [
    { key: 'HID', label: 'HID', description: 'Human Interface Device' },
    { key: 'XINPUT', label: 'XINPUT', description: 'Xbox Input API' },
    { key: 'DS4', label: 'DS4', description: 'DualShock 4 Protocol' },
    { key: 'NS', label: 'NS', description: 'Nintendo Switch Protocol' },
    { key: 'G-TOUCH', label: 'G-Touch', description: 'GameSir G-Touch Protocol' },
    { key: 'GIP', label: 'GIP', description: 'GameInput Protocol' }
  ] as const;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black border-b border-white/20 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onBack}
              className="flex items-center gap-3 text-white hover:text-white transition-colors
                         px-4 py-2 rounded-lg hover:bg-black/50 border border-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Database</span>
            </button>
            <div className="flex items-center gap-4">
              <Gamepad2 className="h-8 w-8 text-white/70" />
              <h1 className="text-xl font-bold text-white">Add New Controller</h1>
            </div>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-black border border-white/30 rounded-xl p-4 md:p-6 lg:p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white border-b border-white/20 pb-2">
                Basic Information
              </h2>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                  Controller Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-white/30 rounded-lg 
                             text-white placeholder-white/50 bg-black focus:outline-none focus:ring-2 
                             focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                  placeholder="e.g., GameSir G7 SE"
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
                  className="w-full px-4 py-3 border border-white/30 rounded-lg 
                             text-white placeholder-white/50 bg-black focus:outline-none focus:ring-2 
                             focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                  placeholder="Controller manufacturer"
                />
              </div>
            </div>

            {/* Wired/2.4GHz Protocols */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white border-b border-white/20 pb-2">
                Wired/2.4GHz Protocols
              </h2>
              <p className="text-sm text-white/70">
                Select protocols supported when connected via wired or 2.4GHz wireless connection
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer 
                                 transition-all duration-200 hover:border-red-600
                                 ${formData.wiredProtocols[key] 
                                   ? 'border-red-600 bg-red-900/20' 
                                   : 'border-white/30 bg-black'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-base font-semibold text-white">{label}</span>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center
                                       ${formData.wiredProtocols[key] 
                                         ? 'border-red-600 bg-red-600' 
                                         : 'border-white/50'}`}>
                          {formData.wiredProtocols[key] && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-white/70">{description}</p>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Bluetooth Protocols */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white border-b border-white/20 pb-2">
                Bluetooth Protocols
              </h2>
              <p className="text-sm text-white/70">
                Select protocols supported when connected via Bluetooth
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer 
                                 transition-all duration-200 hover:border-red-600
                                 ${formData.bluetoothProtocols[key] 
                                   ? 'border-red-600 bg-red-900/20' 
                                   : 'border-white/30 bg-black'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-base font-semibold text-white">{label}</span>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center
                                       ${formData.bluetoothProtocols[key] 
                                         ? 'border-red-600 bg-red-600' 
                                         : 'border-white/50'}`}>
                          {formData.bluetoothProtocols[key] && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-white/70">{description}</p>
                    </label>
                  </div>
                ))}
              </div>
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
                <span className="text-red-400">Controller added successfully!</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-white/20">
              <button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="flex items-center gap-3 px-8 py-3 bg-red-600 hover:bg-red-700 
                           disabled:bg-black disabled:cursor-not-allowed text-white 
                           font-semibold rounded-lg transition-all duration-200 
                           focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                           border border-white/30"
              >
                <Save className="h-5 w-5" />
                {isSubmitting ? 'Adding Controller...' : 'Add Controller'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};