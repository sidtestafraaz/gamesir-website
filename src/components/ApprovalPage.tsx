import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, CheckCircle, XCircle, User, Calendar, MessageSquare, Gamepad2, Plus, Edit3, Trash2, ChevronLeft, ChevronRight, Smartphone } from 'lucide-react';
import { supabase, Game, Controller, GameUpdate } from '../lib/supabase';
import { AddControllerForm } from './AddControllerForm';
import { EditGameModal } from './EditGameModal';
import { EditGameUpdateModal } from './EditGameUpdateModal';
import { RejectGameModal } from './RejectGameModal';
import { BsAndroid, BsApple, BsXbox, BsPlaystation, BsNintendoSwitch, BsController } from 'react-icons/bs';

interface ApprovalPageProps {
  onBack: () => void;
}

const ITEMS_PER_PAGE = 5;

export const ApprovalPage: React.FC<ApprovalPageProps> = ({ onBack }) => {
  const [token, setToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [approverName, setApproverName] = useState('');
  const [pendingGames, setPendingGames] = useState<Game[]>([]);
  const [pendingGameUpdates, setPendingGameUpdates] = useState<any[]>([]);
  const [rejectedGames, setRejectedGames] = useState<Game[]>([]);
  const [rejectedGameUpdates, setRejectedGameUpdates] = useState<any[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<GameUpdate[]>([]);
  const [controllers, setControllers] = useState<Controller[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState<'approval' | 'add-controller'>('approval');
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editingGameUpdate, setEditingGameUpdate] = useState<any>(null);
  const [editingUpdate, setEditingUpdate] = useState<GameUpdate | null>(null);
  const [rejectingGame, setRejectingGame] = useState<Game | null>(null);
  const [rejectingGameUpdate, setRejectingGameUpdate] = useState<any>(null);
  
  // Pagination states
  const [pendingPage, setPendingPage] = useState(1);
  const [rejectedPage, setRejectedPage] = useState(1);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPendingGames();
      fetchPendingGameUpdates();
      fetchPendingUpdates();
      fetchRejectedGames();
      fetchRejectedGameUpdates();
      fetchControllers();
    }
  }, [isAuthenticated]);

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

  const fetchPendingGames = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          controllers!testing_controller_id(*),
          testing_controllers:games_testing_controllers!game_id(
            controllers(*)
          )
        `)
        .eq('is_approved', false)
        .is('rejected_reason', null)
        .order('created_at', { ascending: true }); // Show oldest first
      
      if (error) throw error;
      if (data) {
        const gamesWithController = data.map(game => ({
          ...game,
          testing_controller: Array.isArray(game.controllers) 
            ? game.controllers[0] 
            : game.controllers,
          testing_controllers: ((game as any).testing_controllers || [])
            .map((tc: any) => tc.controllers)
            .filter((c: any) => c !== null)
        }));
        setPendingGames(gamesWithController);
      }
    } catch (error) {
      console.error('Error fetching pending games:', error);
      setError('Failed to fetch pending games');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from('game_updates')
        .select(`
          *,
          games!original_game_id(name, image_url),
          controllers!testing_controller_id(*),
          testing_controllers:game_updates_testing_controllers!game_update_id(
            controllers(*)
          )
        `)
        .eq('is_approved', false)
        .is('rejected_reason', null)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      if (data) setPendingUpdates(data as any);
    } catch (error) {
      console.error('Error fetching pending updates:', error);
    }
  };

  const fetchRejectedGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_approved', false)
        .not('rejected_reason', 'is', null)
        .order('rejected_at', { ascending: false }); // Show latest rejected first
      
      if (error) throw error;
      if (data) setRejectedGames(data);
    } catch (error) {
      console.error('Error fetching rejected games:', error);
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const { data, error } = await supabase
        .from('approvers')
        .select('name')
        .eq('token', token)
        .single();
      
      if (error || !data) {
        setError('Invalid token. Please check your credentials.');
        return;
      }
      
      setApproverName(data.name);
      setIsAuthenticated(true);
    } catch (error) {
      setError('Authentication failed. Please try again.');
    }
  };

  const handleApproval = async (gameId: string, approved: boolean) => {
    try {
      const updateData = {
        is_approved: approved,
        approved_by: approved ? approverName : null,
        approved_at: approved ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('games')
        .update(updateData)
        .eq('id', gameId);

      if (error) throw error;

      setPendingGames(prev => prev.filter(game => game.id !== gameId));
    } catch (error) {
      console.error('Error updating game approval:', error);
      setError('Failed to update game approval status');
    }
  };

  const handleUpdateApproval = async (updateId: string, approved: boolean) => {
    try {
      let mergedControllerIds: string[] = [];
      
      if (approved) {
        // Get the update data with testing controllers
        const { data: updateData, error: fetchError } = await supabase
          .from('game_updates')
          .select(`
            *,
            testing_controllers:game_updates_testing_controllers!game_update_id(
              controllers(*)
            )
          `)
          .eq('id', updateId)
          .single();

        if (fetchError) throw fetchError;

        // Get original game data
        const { data: originalGame, error: gameError } = await supabase
          .from('games')
          .select('*')
          .eq('id', updateData.original_game_id)
          .single();

        if (gameError) throw gameError;

        // Get existing testing controllers from junction table
        const { data: existingControllers, error: existingControllersError } = await supabase
          .from('games_testing_controllers')
          .select('controller_id')
          .eq('game_id', updateData.original_game_id);

        if (existingControllersError) throw existingControllersError;

        const existingControllerIds = existingControllers?.map(c => c.controller_id) || [];

        // Merge discord usernames and testing controllers
        const mergedDiscordUsername = [originalGame.discord_username, updateData.discord_username]
          .filter(Boolean)
          .join(', ');

        mergedControllerIds = [
          ...existingControllerIds,
          ...(updateData.testing_controller_ids || [])
        ].filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

        // Update the original game with merged data
        const { error: updateGameError } = await supabase
          .from('games')
          .update({
            android_tested: updateData.android_tested,
            ios_tested: updateData.ios_tested,
            android_hid: updateData.android_hid,
            android_xinput: updateData.android_xinput,
            android_ds4: updateData.android_ds4,
            android_ns: updateData.android_ns,
            ios_hid: updateData.ios_hid,
            ios_xinput: updateData.ios_xinput,
            ios_ds4: updateData.ios_ds4,
            ios_ns: updateData.ios_ns,
            testing_notes: updateData.testing_notes,
            discord_username: mergedDiscordUsername,
            testing_controller_ids: mergedControllerIds,
            testing_controller_id: mergedControllerIds[0] || null
          })
          .eq('id', updateData.original_game_id);

        if (updateGameError) throw updateGameError;

        // Update the games_testing_controllers junction table
        if (mergedControllerIds.length > 0) {
          // First, delete existing entries
          await supabase
            .from('games_testing_controllers')
            .delete()
            .eq('game_id', updateData.original_game_id);

          // Then insert merged controllers
          const junctionData = mergedControllerIds.map(controllerId => ({
            game_id: updateData.original_game_id,
            controller_id: controllerId
          }));

          await supabase
            .from('games_testing_controllers')
            .insert(junctionData);
        }
      }

      // Update the game update status
      const { error } = await supabase
        .from('game_updates')
        .update({
          is_approved: approved,
          approved_by: approved ? approverName : null,
          approved_at: approved ? new Date().toISOString() : null
        })
        .eq('id', updateId);

      if (error) throw error;

      setPendingUpdates(prev => prev.filter(update => update.id !== updateId));
    } catch (error) {
      console.error('Error updating game update approval:', error);
      setError('Failed to update game update approval status');
    }
  };

  const handleReject = async (gameId: string, reason: string) => {
    try {
      const updateData = {
        is_approved: false,
        rejected_reason: reason,
        rejected_by: approverName,
        rejected_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('games')
        .update(updateData)
        .eq('id', gameId);

      if (error) throw error;

      setPendingGames(prev => prev.filter(game => game.id !== gameId));
      fetchRejectedGames(); // Refresh rejected games list
    } catch (error) {
      console.error('Error rejecting game:', error);
      setError('Failed to reject game');
    }
  };

  const handleEditGame = async (gameId: string, updatedData: any, approveAfterSave = false) => {
    try {
      const updateData = {
        ...updatedData,
        edited_by_admin: true,
        edited_at: new Date().toISOString()
      };

      // If approving after save, add approval data
      if (approveAfterSave) {
        updateData.is_approved = true;
        updateData.approved_by = approverName;
        updateData.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('games')
        .update(updateData)
        .eq('id', gameId);

      if (error) throw error;

      // Refresh pending games
      fetchPendingGames();
      fetchPendingUpdates();
      setEditingGame(null);
    } catch (error) {
      console.error('Error updating game:', error);
      setError('Failed to update game');
    }
  };

  const handleEditGameUpdate = async (updateId: string, updatedData: any, approveAfterSave = false) => {
    try {
      const updatePayload = {
        ...updatedData,
        edited_by_admin: true,
        edited_at: new Date().toISOString()
      };

      // If approving after save, add approval data
      if (approveAfterSave) {
        updatePayload.is_approved = true;
        updatePayload.approved_by = approverName;
        updatePayload.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('game_updates')
        .update(updatePayload)
        .eq('id', updateId);

      if (error) throw error;

      // Update testing controllers junction table
      if (updatedData.testingControllerIds) {
        // Delete existing entries
        await supabase
          .from('game_updates_testing_controllers')
          .delete()
          .eq('game_update_id', updateId);

        // Insert new entries
        if (updatedData.testingControllerIds.length > 0) {
          const junctionData = updatedData.testingControllerIds.map((controllerId: string) => ({
            game_update_id: updateId,
            controller_id: controllerId
          }));

          await supabase
            .from('game_updates_testing_controllers')
            .insert(junctionData);
        }
      }

      // If approved after save, handle the approval process
      if (approveAfterSave) {
        await handleUpdateApproval(updateId, true);
      }

      // Refresh pending updates
      fetchPendingUpdates();
      setEditingUpdate(null);
    } catch (error) {
      console.error('Error updating game update:', error);
      setError('Failed to update game update');
    }
  };

  const handleDeleteRejectedGame = async (gameId: string) => {
    if (!confirm('Are you sure you want to permanently delete this rejected game?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId);

      if (error) throw error;

      setRejectedGames(prev => prev.filter(game => game.id !== gameId));
    } catch (error) {
      console.error('Error deleting game:', error);
      setError('Failed to delete game');
    }
  };

  const getControllerName = (controllerId?: string) => {
    if (!controllerId) return 'Not specified';
    const controller = controllers.find(c => c.id === controllerId);
    return controller ? controller.name : 'Unknown controller';
  };

  const getProtocolIcon = (protocol: string) => {
    switch (protocol.toUpperCase()) {
      case 'HID':
        return <BsController className="h-3 w-3" />;
      case 'XINPUT':
        return <BsXbox className="h-3 w-3" />;
      case 'DS4':
        return <BsPlaystation className="h-3 w-3" />;
      case 'NS':
        return <BsNintendoSwitch className="h-3 w-3" />;
      default:
        return <BsController className="h-3 w-3" />;
    }
  };

  const getSelectedControllers = (game: Game) => {
    const selectedControllers: Controller[] = [];
    
    // Get controllers from testing_controller_ids array
    if (game.testing_controller_ids && game.testing_controller_ids.length > 0) {
      game.testing_controller_ids.forEach(id => {
        const controller = controllers.find(c => c.id === id);
        if (controller) selectedControllers.push(controller);
      });
    }
    
    // Fallback to single testing_controller_id if array is empty
    if (selectedControllers.length === 0 && game.testing_controller_id) {
      const controller = controllers.find(c => c.id === game.testing_controller_id);
      if (controller) selectedControllers.push(controller);
    }
    
    return selectedControllers;
  };

  const getPlatformProtocols = (game: Game) => {
    const platforms: Array<{
      name: string;
      icon: React.ReactNode;
      protocols: Array<{ protocol: string; connectivity: string }>;
    }> = [];

    // Android protocols
    if (game.android_tested) {
      const androidProtocols: Array<{ protocol: string; connectivity: string }> = [];
      
      if (game.android_hid) androidProtocols.push({ protocol: 'HID', connectivity: game.android_hid });
      if (game.android_xinput) androidProtocols.push({ protocol: 'XINPUT', connectivity: game.android_xinput });
      if (game.android_ds4) androidProtocols.push({ protocol: 'DS4', connectivity: game.android_ds4 });
      if (game.android_ns) androidProtocols.push({ protocol: 'NS', connectivity: game.android_ns });

      platforms.push({
        name: 'Android',
        icon: <BsAndroid className="h-4 w-4 text-green-400" />,
        protocols: androidProtocols
      });
    }

    // iOS protocols
    if (game.ios_tested) {
      const iosProtocols: Array<{ protocol: string; connectivity: string }> = [];
      
      if (game.ios_hid) iosProtocols.push({ protocol: 'HID', connectivity: game.ios_hid });
      if (game.ios_xinput) iosProtocols.push({ protocol: 'XINPUT', connectivity: game.ios_xinput });
      if (game.ios_ds4) iosProtocols.push({ protocol: 'DS4', connectivity: game.ios_ds4 });
      if (game.ios_ns) iosProtocols.push({ protocol: 'NS', connectivity: game.ios_ns });

      platforms.push({
        name: 'iOS',
        icon: <BsApple className="h-4 w-4 text-gray-300" />,
        protocols: iosProtocols
      });
    }

    return platforms;
  };

  const handleBackToApproval = () => {
    setCurrentView('approval');
    fetchControllers(); // Refresh controllers list
    fetchPendingGames();
    fetchPendingGameUpdates();
    fetchPendingUpdates(); // Refresh updates list
  };

  // Pagination helpers
  const getPaginatedItems = (items: Game[], page: number) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / ITEMS_PER_PAGE);
  };

  const PaginationControls = ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    label 
  }: { 
    currentPage: number; 
    totalPages: number; 
    onPageChange: (page: number) => void;
    label: string;
  }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-6 p-4 bg-black border border-white/30 rounded-lg">
        <span className="text-sm text-white/70">
          {label} - Page {currentPage} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 bg-black hover:bg-black/80 
                       disabled:opacity-50 disabled:cursor-not-allowed text-white 
                       font-medium rounded-lg transition-all duration-200 border border-white/30 text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-2 bg-black hover:bg-black/80 
                       disabled:opacity-50 disabled:cursor-not-allowed text-white 
                       font-medium rounded-lg transition-all duration-200 border border-white/30 text-sm"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  if (currentView === 'add-controller') {
    return <AddControllerForm onBack={handleBackToApproval} />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black">
        <header className="bg-black border-b border-white/20 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="hidden lg:flex items-center justify-between h-16">
              <button
                onClick={onBack}
                className="flex items-center gap-3 text-white hover:text-white transition-colors
                           px-4 py-2 rounded-lg hover:bg-black/50 border border-white/20"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to Database</span>
              </button>
              <div className="flex items-center gap-4">
                <Shield className="h-8 w-8 text-red-600" />
                <h1 className="text-xl font-bold text-white">Admin Center</h1>
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
                  <Shield className="h-6 w-6 text-red-600" />
                  <h1 className="text-lg font-bold text-white">Admin Center</h1>
                </div>
                <div className="w-16"></div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-20">
          <div className="bg-black border border-white/30 rounded-xl p-6 md:p-8 shadow-lg">
            <div className="text-center mb-8">
              <Shield className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Access Required</h2>
              <p className="text-white/70">Enter your Admin token to continue</p>
            </div>

            <form onSubmit={handleTokenSubmit} className="space-y-6">
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-white mb-2">
                  Admin Token
                </label>
                <input
                  type="password"
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-4 py-3 border border-white/30 rounded-lg 
                             text-white placeholder-white/50 bg-black focus:outline-none focus:ring-2 
                             focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                  placeholder="Enter your token"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-black border border-white/30 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-400" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 
                           hover:bg-red-700 text-white font-semibold rounded-lg 
                           transition-all duration-200 focus:outline-none focus:ring-2 
                           focus:ring-red-500 focus:ring-offset-2"
              >
                <Shield className="h-5 w-5" />
                Authenticate
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  const paginatedPendingGames = getPaginatedItems(pendingGames, pendingPage);
  const paginatedRejectedGames = getPaginatedItems(rejectedGames, rejectedPage);
  const pendingTotalPages = getTotalPages(pendingGames.length);
  const rejectedTotalPages = getTotalPages(rejectedGames.length);

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-black border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between h-auto md:h-16 py-4 md:py-0 gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-3 text-white hover:text-white transition-colors
                         px-4 py-2 rounded-lg hover:bg-black/50 self-start md:self-center border border-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Database</span>
            </button>
            <div className="flex items-center gap-4">
              <Shield className="h-6 md:h-8 w-6 md:w-8 text-red-600" />
              <div className="text-center md:text-left">
                <h1 className="text-lg md:text-xl font-bold text-white">Admin Center</h1>
                <p className="text-xs md:text-sm text-white/70">Welcome, {approverName}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-4">
              <button
                onClick={() => setCurrentView('add-controller')}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-red-600 hover:bg-red-700 
                           text-white font-medium rounded-lg transition-all duration-200
                           focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm md:text-base"
              >
                <Plus className="h-4 w-4" />
                Add Controller
              </button>
              <div className="flex items-center gap-2 text-white">
                <span className="text-xs md:text-sm font-medium">{pendingGames.length + pendingUpdates.length} pending</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Pending Games Section */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Pending Game Approvals</h2>
          <p className="text-white/70 mb-6 md:mb-8">Review and approve new games and updates for the public database (oldest first)</p>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-red-600"></div>
            </div>
          ) : pendingGames.length === 0 && pendingUpdates.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle className="h-16 md:h-24 w-16 md:w-24 text-red-500 mx-auto mb-6" />
              <h3 className="text-xl md:text-2xl font-semibold text-white mb-3">All caught up!</h3>
              <p className="text-white/70 text-base md:text-lg">No pending games require approval at this time.</p>
            </div>
          ) : (
            <>
              {/* Pending Game Updates */}
              {pendingUpdates.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Edit3 className="h-5 w-5 text-red-600" />
                    Game Updates ({pendingUpdates.length})
                  </h3>
                  <div className="space-y-4">
                    {pendingUpdates.map((update) => {
                      const originalGame = (update as any).games;
                      const testingControllers = ((update as any).testing_controllers || [])
                        .map((tc: any) => tc.controllers)
                        .filter((c: any) => c !== null);
                      
                      return (
                        <div key={update.id} className="bg-black border border-red-800/50 rounded-xl p-4 md:p-6 shadow-lg">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-black rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/20">
                              {originalGame?.image_url ? (
                                <img 
                                  src={originalGame.image_url} 
                                  alt={originalGame.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Gamepad2 className="h-6 w-6 md:h-8 md:w-8 text-white/50" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-3 gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Edit3 className="h-4 w-4 text-red-600" />
                                    <span className="text-sm font-medium text-red-400">UPDATE FOR:</span>
                                  </div>
                                  <h3 className="text-base md:text-lg font-bold text-white mb-1">{originalGame?.name}</h3>
                                  
                                  {/* Platform Testing Info */}
                                  {(update.android_tested || update.ios_tested) && (
                                    <div className="flex items-center gap-3 mt-2">
                                      {update.android_tested && (
                                        <div className="flex items-center gap-1">
                                          <BsAndroid className="h-3 w-3 text-green-400" />
                                          <span className="text-white/70 text-xs">Android</span>
                                        </div>
                                      )}
                                      {update.ios_tested && (
                                        <div className="flex items-center gap-1">
                                          <BsApple className="h-3 w-3 text-gray-300" />
                                          <span className="text-white/70 text-xs">iOS</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-3 flex-shrink-0">
                                  <button
                                    onClick={() => setEditingUpdate(update)}
                                    className="flex items-center gap-2 px-3 md:px-4 py-2 bg-black hover:bg-black/80 
                                               text-white hover:text-white font-medium rounded-lg transition-all duration-200
                                               border border-white/30 hover:border-white/50 text-sm md:text-base w-full sm:w-auto justify-center"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleUpdateApproval(update.id, false)}
                                    className="flex items-center gap-2 px-3 md:px-4 py-2 bg-black hover:bg-black/80 
                                               text-white hover:text-white font-medium rounded-lg transition-all duration-200
                                               border border-white/30 hover:border-white/50 text-sm md:text-base w-full sm:w-auto justify-center"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Reject
                                  </button>
                                  <button
                                    onClick={() => handleUpdateApproval(update.id, true)}
                                    className="flex items-center gap-2 px-3 md:px-4 py-2 bg-red-600 hover:bg-red-700 
                                               text-white font-medium rounded-lg transition-all duration-200 text-sm md:text-base w-full sm:w-auto justify-center"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    Approve Update
                                  </button>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-semibold text-white mb-2">Update Details</h4>
                                  <div className="space-y-1">
                                    {testingControllers.length > 0 && (
                                      <div className="flex items-center gap-2">
                                        <Gamepad2 className="h-4 w-4 text-white/50" />
                                        <span className="text-white text-xs">
                                          Controllers: {testingControllers.map((c: any) => c.name).join(', ')}
                                        </span>
                                      </div>
                                    )}
                                    {(update as any).edited_by_admin && (
                                      <div className="flex items-center gap-2">
                                        <Edit3 className="h-4 w-4 text-white/50" />
                                        <span className="text-white text-xs">Edited by Admin</span>
                                      </div>
                                    )}
                                    {update.discord_username && (
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-white/50" />
                                        <span className="text-white text-xs">By: {update.discord_username}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-white/50" />
                                      <span className="text-white text-xs">
                                        {new Date(update.created_at!).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {update.testing_notes && (
                                <div className="mt-4 p-3 bg-black rounded-lg border border-white/30">
                                  <div className="flex items-start gap-2">
                                    <MessageSquare className="h-4 w-4 text-white/50 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <h4 className="text-sm font-semibold text-white mb-1">Update Notes</h4>
                                      <p className="text-white text-xs leading-relaxed">{update.testing_notes}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pending New Games */}
              {pendingGames.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-red-600" />
                    New Games ({pendingGames.length})
                  </h3>
              <div className="space-y-4 md:space-y-6">
                {paginatedPendingGames.map((game) => {
                  const selectedControllers = getSelectedControllers(game);
                  const platformProtocols = getPlatformProtocols(game);
                  const testingControllers = (game as any).testing_controllers || [];
                  
                  return (
                    <div key={game.id} className="bg-black border border-white/30 rounded-xl p-4 md:p-6 shadow-lg">
                      <div className="flex flex-col lg:flex-row items-start gap-4 md:gap-6">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-black rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/20">
                          {game.image_url ? (
                            <img 
                              src={game.image_url} 
                              alt={game.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Gamepad2 className="h-8 w-8 md:h-10 md:w-10 text-white/50" />
                          )}
                        </div>
                        
                        <div className="flex-1 w-full">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-4 gap-4">
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                <h3 className="text-lg md:text-xl font-bold text-white">{game.name}</h3>
                                {(game as any).edited_by_admin && (
                                  <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs border border-red-800 self-start">
                                    Edited by Admin
                                  </span>
                                )}
                              </div>
                              <p className="text-white/70 leading-relaxed text-sm md:text-base">{game.description}</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-3 flex-shrink-0">
                              <button
                                onClick={() => setEditingGame(game)}
                                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-black hover:bg-black/80 
                                           text-white hover:text-white font-medium rounded-lg transition-all duration-200
                                           border border-white/30 hover:border-white/50 text-sm md:text-base w-full sm:w-auto justify-center"
                              >
                                <Edit3 className="h-4 w-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => setRejectingGame(game)}
                                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-black hover:bg-black/80 
                                           text-white hover:text-white font-medium rounded-lg transition-all duration-200
                                           border border-white/30 hover:border-white/50 text-sm md:text-base w-full sm:w-auto justify-center"
                              >
                                <XCircle className="h-4 w-4" />
                                Reject
                              </button>
                              <button
                                onClick={() => handleApproval(game.id, true)}
                                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-red-600 hover:bg-red-700 
                                           text-white font-medium rounded-lg transition-all duration-200 text-sm md:text-base w-full sm:w-auto justify-center"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Approve
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {/* Platform Testing and Protocol Info */}
                            <div>
                              <h4 className="text-sm font-semibold text-white mb-3">Platform Support</h4>
                              
                              {platformProtocols.length > 0 ? (
                                <div className="space-y-3">
                                  {platformProtocols.map((platform) => (
                                    <div key={platform.name} className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        {platform.icon}
                                        <span className="text-sm font-medium text-white">{platform.name}</span>
                                      </div>
                                      
                                      {platform.protocols.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 ml-6">
                                          {platform.protocols.map((item, index) => (
                                            <span
                                              key={`${platform.name}-${item.protocol}-${index}`}
                                              className="flex items-center gap-1 px-2 py-1 bg-zinc-900 
                                                         text-white rounded text-xs font-medium border border-white/30"
                                            >
                                              {getProtocolIcon(item.protocol)}
                                              <span>{item.protocol}</span>
                                              <span className="text-xs text-white/50">via</span>
                                              <span className="text-xs">{item.connectivity}</span>
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="ml-6">
                                          <span className="px-2 py-1 bg-zinc-900 text-white/70 rounded text-xs border border-white/30">
                                            No protocols supported
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-white/50 text-sm">No platform testing specified</div>
                              )}
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-semibold text-white mb-2">Testing Details</h4>
                              <div className="space-y-2">
                                {(testingControllers.length > 0 || selectedControllers.length > 0) && (
                                  <div className="flex items-center gap-2">
                                    <Gamepad2 className="h-4 w-4 text-white/50" />
                                    <span className="text-white text-xs md:text-sm">
                                      Controllers: {testingControllers.length > 0 
                                        ? testingControllers.map((c: any) => c.name).join(', ')
                                        : selectedControllers.map(c => c.name).join(', ')
                                      }
                                    </span>
                                  </div>
                                )}
                                {game.discord_username && (
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-white/50" />
                                    <span className="text-white text-xs md:text-sm">{game.discord_username}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-white/50" />
                                  <span className="text-white text-xs md:text-sm">
                                    {new Date(game.created_at!).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {game.testing_notes && (
                            <div className="mt-4 p-3 md:p-4 bg-black rounded-lg border border-white/30">
                              <div className="flex items-start gap-2">
                                <MessageSquare className="h-4 w-4 text-white/50 mt-0.5 flex-shrink-0" />
                                <div>
                                  <h4 className="text-sm font-semibold text-white mb-1">Testing Notes</h4>
                                  <p className="text-white text-xs md:text-sm leading-relaxed">{game.testing_notes}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

                </div>
              )}

              <PaginationControls
                currentPage={pendingPage}
                totalPages={pendingTotalPages}
                onPageChange={setPendingPage}
                label="Pending Games"
              />
            </>
          )}
        </div>

        {/* Rejected Games Section */}
        {rejectedGames.length > 0 && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Rejected Games</h2>
            <p className="text-white/70 mb-4 md:mb-6">Games that have been rejected with reasons (latest first)</p>
            
            <div className="space-y-4">
              {paginatedRejectedGames.map((game) => (
                <div key={game.id} className="bg-black border border-red-800/50 rounded-xl p-4 md:p-6 shadow-lg">
                  <div className="flex flex-col lg:flex-row items-start gap-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-black rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/20">
                      {game.image_url ? (
                        <img 
                          src={game.image_url} 
                          alt={game.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Gamepad2 className="h-6 w-6 md:h-8 md:w-8 text-white/50" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-3 gap-4">
                        <div className="flex-1">
                          <h3 className="text-base md:text-lg font-bold text-white mb-1">{game.name}</h3>
                          <p className="text-white/70 text-sm">{game.description}</p>
                          
                          {/* Platform Testing Info for Rejected Games */}
                          {(game.android_tested || game.ios_tested) && (
                            <div className="flex items-center gap-3 mt-2">
                              {game.android_tested && (
                                <div className="flex items-center gap-1">
                                  <BsAndroid className="h-3 w-3 text-green-400" />
                                  <span className="text-white/70 text-xs">Android</span>
                                </div>
                              )}
                              {game.ios_tested && (
                                <div className="flex items-center gap-1">
                                  <BsApple className="h-3 w-3 text-gray-300" />
                                  <span className="text-white/70 text-xs">iOS</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleDeleteRejectedGame(game.id)}
                          className="flex items-center gap-2 px-3 py-2 bg-red-900/30 hover:bg-red-900/50 
                                     text-red-400 hover:text-red-300 font-medium rounded-lg transition-all duration-200
                                     border border-red-800 hover:border-red-700 flex-shrink-0 text-sm"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                      
                      <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                        <h4 className="text-sm font-semibold text-red-400 mb-1">Rejection Reason</h4>
                        <p className="text-red-300 text-sm">{(game as any).rejected_reason}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-xs text-red-400/70">
                          <span>Rejected by: {(game as any).rejected_by}</span>
                          <span>Date: {new Date((game as any).rejected_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <PaginationControls
              currentPage={rejectedPage}
              totalPages={rejectedTotalPages}
              onPageChange={setRejectedPage}
              label="Rejected Games"
            />
          </div>
        )}
      </main>

      {/* Modals */}
      {editingGame && (
        <EditGameModal
          game={editingGame}
          controllers={controllers}
          onSave={handleEditGame}
          onClose={() => setEditingGame(null)}
        />
      )}

      {editingUpdate && (
        <EditGameUpdateModal
          gameUpdate={editingUpdate}
          controllers={controllers}
          onSave={handleEditGameUpdate}
          onClose={() => setEditingUpdate(null)}
        />
      )}

      {rejectingGame && (
        <RejectGameModal
          game={rejectingGame}
          onReject={handleReject}
          onClose={() => setRejectingGame(null)}
        />
      )}
    </div>
  );
};