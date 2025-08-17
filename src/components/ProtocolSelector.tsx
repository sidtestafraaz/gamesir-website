import React from 'react';
import { BsAndroid, BsApple, BsXbox, BsPlaystation, BsNintendoSwitch, BsController, BsMicrosoft, BsFillHandIndexFill } from 'react-icons/bs';

interface ProtocolSelectorProps {
  platform: 'android' | 'ios';
  protocols: {
    hid: string;
    xinput: string;
    ds4: string;
    ns: string;
    gtouch: string;
    gip: string;
  };
  onChange: (protocol: string, value: string) => void;
  title: string;
}

export const ProtocolSelector: React.FC<ProtocolSelectorProps> = ({
  platform,
  protocols,
  onChange,
  title
}) => {
  const protocolOptions = [
    { 
      key: 'hid', 
      label: 'HID', 
      description: 'Human Interface Device',
      icon: <BsController className="h-3 w-3" />
    },
    { 
      key: 'xinput', 
      label: 'XINPUT', 
      description: 'Xbox Input API',
      icon: <BsXbox className="h-3 w-3" />
    },
    { 
      key: 'ds4', 
      label: 'DS4', 
      description: 'DualShock 4 Protocol',
      icon: <BsPlaystation className="h-3 w-3" />
    },
    { 
      key: 'ns', 
      label: 'NS', 
      description: 'Nintendo Switch Protocol',
      icon: <BsNintendoSwitch className="h-3 w-3" />
    },
    { 
      key: 'gtouch', 
      label: 'G-Touch', 
      description: 'GameSir G-Touch Protocol',
      icon: <BsFillHandIndexFill className="h-3 w-3 md:h-4 md:w-4" />
    },
    { 
      key: 'gip', 
      label: 'GIP', 
      description: 'GameInput Protocol',
      icon: <BsMicrosoft className="h-3 w-3 md:h-4 md:w-4" />
    }
  ];

  const connectivityOptions = [
    { value: '', label: 'Untested', shortLabel: 'Untested' },
    { value: 'None', label: 'Not Supported', shortLabel: 'Not Supported' },
    { value: 'Wired/2.4GHz', label: 'Wired/2.4GHz', shortLabel: 'Wired/2.4GHz' },
    { value: 'Bluetooth', label: 'Bluetooth', shortLabel: 'Bluetooth' },
    { value: 'Wired/2.4GHz/Bluetooth', label: 'Both', shortLabel: 'Both' }
  ];

  const platformIcon = platform === 'android' 
    ? <BsAndroid className="h-4 w-4 text-green-400" />
    : <BsApple className="h-4 w-4 text-gray-300" />;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {platformIcon}
        <h4 className="text-sm font-semibold text-white">{title} Protocol Support</h4>
      </div>
      
      <div className="space-y-3">
        {protocolOptions.map(({ key, label, description, icon }) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center gap-2">
              {icon}
              <span className="text-xs font-medium text-white">{label}</span>
              <span className="text-xs text-white/50 hidden md:inline">- {description}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {connectivityOptions.map(option => (
                <label
                  key={option.value}
                  className={`flex items-center justify-center py-2 px-2 border rounded cursor-pointer 
                             transition-all duration-200 hover:border-red-600 text-xs font-medium
                             ${protocols[key as keyof typeof protocols] === option.value
                               ? 'border-red-600 bg-red-900/20 text-red-400' 
                               : 'border-white/30 bg-black text-white/70'}`}
                >
                  <input
                    type="radio"
                    name={`${platform}-${key}`}
                    value={option.value}
                    checked={protocols[key as keyof typeof protocols] === option.value}
                    onChange={(e) => onChange(key, e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-center flex-1">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
