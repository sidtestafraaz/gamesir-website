import React, { useState } from 'react';
import { XCircle, X } from 'lucide-react';
import { Game } from '../lib/supabase';

interface RejectGameModalProps {
  game: Game;
  onReject: (gameId: string, reason: string) => void;
  onClose: () => void;
}

export const RejectGameModal: React.FC<RejectGameModalProps> = ({
  game,
  onReject,
  onClose
}) => {
  const [reason, setReason] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const predefinedReasons = [
    'Duplicate game already exists',
    'Insufficient testing information',
    'Incorrect protocol information',
    'Not a mobile game',
    'Inappropriate content',
    'Incomplete submission',
    'Other (specify below)'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalReason = selectedReason === 'Other (specify below)' 
      ? reason.trim() 
      : selectedReason || reason.trim();
    
    if (!finalReason) return;
    
    setIsSubmitting(true);
    try {
      await onReject(game.id, finalReason);
      onClose(); // Close modal after successful submission
    } catch (error) {
      console.error('Error rejecting game:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/30 rounded-xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Reject Game</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white/50" />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">{game.name}</h3>
          <p className="text-white/70 text-sm">
            Please provide a reason for rejecting this game submission.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Predefined Reasons */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Select a reason:
            </label>
            <div className="space-y-2">
              {predefinedReasons.map((predefinedReason) => (
                <label
                  key={predefinedReason}
                  className="flex items-center gap-3 p-3 border border-white/30 rounded-lg 
                             hover:border-white/50 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={predefinedReason}
                    checked={selectedReason === predefinedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-4 h-4 text-red-600 bg-black border-white/30 focus:ring-red-500"
                  />
                  <span className="text-white text-sm">{predefinedReason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Reason */}
          {(selectedReason === 'Other (specify below)' || !selectedReason) && (
            <div>
              <label htmlFor="customReason" className="block text-sm font-semibold text-white mb-2">
                {selectedReason === 'Other (specify below)' ? 'Specify reason:' : 'Or write a custom reason:'}
              </label>
              <textarea
                id="customReason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-white/30 rounded-lg 
                           text-white placeholder-white/50 bg-black focus:outline-none focus:ring-2 
                           focus:ring-red-500 focus:border-red-500 transition-all duration-200 
                           resize-vertical"
                placeholder="Explain why this game is being rejected..."
                required={selectedReason === 'Other (specify below)' || !selectedReason}
              />
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-white/20">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 border border-white/30 text-white hover:bg-white/5 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         font-medium rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={(!selectedReason && !reason.trim()) || isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 
                         disabled:bg-zinc-900 disabled:cursor-not-allowed text-white 
                         font-medium rounded-lg transition-all duration-200"
            >
              <XCircle className="h-4 w-4" />
              {isSubmitting ? 'Rejecting...' : 'Reject Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};