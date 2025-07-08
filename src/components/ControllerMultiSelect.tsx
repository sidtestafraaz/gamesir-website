import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Gamepad2 } from 'lucide-react';
import { Controller } from '../lib/supabase';

interface ControllerMultiSelectProps {
  controllers: Controller[];
  selectedControllerIds: string[];
  onSelectionChange: (controllerIds: string[]) => void;
  placeholder?: string;
}

export const ControllerMultiSelect: React.FC<ControllerMultiSelectProps> = ({
  controllers,
  selectedControllerIds,
  onSelectionChange,
  placeholder = "Search and select controllers..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredControllers = controllers.filter(controller =>
    controller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    controller.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedControllers = controllers.filter(c => selectedControllerIds.includes(c.id));

  const handleControllerToggle = (controllerId: string) => {
    const newSelection = selectedControllerIds.includes(controllerId)
      ? selectedControllerIds.filter(id => id !== controllerId)
      : [...selectedControllerIds, controllerId];
    
    onSelectionChange(newSelection);
  };

  const handleRemoveController = (controllerId: string) => {
    onSelectionChange(selectedControllerIds.filter(id => id !== controllerId));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Controllers Display */}
      {selectedControllers.length > 0 && (
        <div className="mb-3 p-3 bg-zinc-900/50 border border-white/20 rounded-lg">
          <div className="flex flex-wrap gap-2">
            {selectedControllers.map((controller) => (
              <span
                key={controller.id}
                className="flex items-center gap-2 px-3 py-1 bg-red-900/30 text-red-400 rounded-lg text-sm border border-red-800"
              >
                <Gamepad2 className="h-3 w-3" />
                {controller.name}
                <button
                  type="button"
                  onClick={() => handleRemoveController(controller.id)}
                  className="hover:bg-red-800/50 rounded p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-black 
                   border border-white/30 rounded-lg text-white hover:border-white/50 
                   focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-white/50" />
          <span className="text-left font-medium text-white/70">
            {selectedControllers.length > 0 
              ? `${selectedControllers.length} controller${selectedControllers.length > 1 ? 's' : ''} selected`
              : placeholder
            }
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
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

          {/* Controller Options */}
          <div className="max-h-64 overflow-y-auto">
            {filteredControllers.length === 0 && searchQuery ? (
              <div className="px-4 py-3 text-white/50 text-sm">
                No controllers found matching "{searchQuery}"
              </div>
            ) : (
              filteredControllers.map((controller) => (
                <label
                  key={controller.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors
                             cursor-pointer border-b border-white/20 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedControllerIds.includes(controller.id)}
                    onChange={() => handleControllerToggle(controller.id)}
                    className="w-4 h-4 text-red-600 bg-black border-white/30 rounded focus:ring-red-500"
                  />
                  <Gamepad2 className="h-4 w-4 text-white/50 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white">{controller.name}</div>
                    <div className="text-sm text-white/70">{controller.manufacturer}</div>
                  </div>
                </label>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-white/20 bg-zinc-900/50">
            <div className="text-xs text-white/50">
              {selectedControllers.length} of {controllers.length} controllers selected
            </div>
          </div>
        </div>
      )}
    </div>
  );
};