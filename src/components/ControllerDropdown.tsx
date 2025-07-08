import React, { useState } from 'react';
import { ChevronDown, Gamepad2, X, Search } from 'lucide-react';
import { Controller } from '../lib/supabase';

interface ControllerDropdownProps {
  controllers: Controller[];
  selectedController: Controller | null;
  onSelect: (controller: Controller | null) => void;
}

export const ControllerDropdown: React.FC<ControllerDropdownProps> = ({
  controllers,
  selectedController,
  onSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelect = (controller: Controller | null) => {
    onSelect(controller);
    setIsOpen(false);
    setSearchQuery('');
  };

  const filteredControllers = controllers.filter(controller =>
    controller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    controller.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-black 
                   border border-white/30 rounded-lg text-white hover:border-white/50 
                   focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <Gamepad2 className="h-5 w-5 text-white/50" />
          <span className="text-left font-medium">
            {selectedController ? selectedController.name : 'All Controllers'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {selectedController && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(null);
              }}
              className="p-1 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-white/50" />
            </button>
          )}
          <ChevronDown className={`h-4 w-4 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black border border-white/30 
                        rounded-lg z-50 max-h-80 overflow-hidden shadow-lg">
          {/* Search Input */}
          <div className="p-3 border-b border-white/20">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-white/50" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search controllers..."
                className="w-full pl-10 pr-4 py-2 border border-white/30 rounded-lg 
                           text-white placeholder-white/50 bg-black focus:outline-none focus:ring-2 
                           focus:ring-red-500 focus:border-red-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-y-auto">
            <button
              onClick={() => handleSelect(null)}
              className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors
                         border-b border-white/20 text-white font-medium"
            >
              All Controllers
            </button>
            {filteredControllers.length === 0 && searchQuery ? (
              <div className="px-4 py-3 text-white/50 text-sm">
                No controllers found matching "{searchQuery}"
              </div>
            ) : (
              filteredControllers.map((controller) => (
                <button
                  key={controller.id}
                  onClick={() => handleSelect(controller)}
                  className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors
                             text-white border-b border-white/20 last:border-b-0"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{controller.name}</span>
                    <span className="text-sm text-white/70">{controller.manufacturer}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};