import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Edit, Trash2, Plus, Download, Shield, User, Calendar, MessageSquare, Gamepad2, Smartphone, Edit3, Key } from 'lucide-react';
import { supabase, Game, Controller, GameUpdate, authenticateWithToken, isAuthenticated, getCurrentApprover, signOut } from '../lib/supabase';
import { EditGameModal } from './EditGameModal';
import { EditControllerModal } from './EditControllerModal';
import { EditGameUpdateModal } from './EditGameUpdateModal';
import { RejectGameModal } from './RejectGameModal';
import { AddControllerForm } from './AddControllerForm';
import { ExportDataModal } from './ExportDataModal';
import { BsAndroid2, BsApple, BsController, BsMicrosoft, BsNintendoSwitch, BsFillHandIndexFill, BsPlaystation, BsXbox } from 'react-icons/bs';
import { TbTableExport } from 'react-icons/tb';

interface ApprovalPageProps {
  onBack: () => void;
}

export const ApprovalPage: React.FC<ApprovalPageProps> = ({ onBack }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [gameUpdates, setGameUpdates] = useState<GameUpdate[]>([]);
  const [controllers, setControllers] = useState<Controller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'pending' | 'approved' | 'rejected' | 'controllers' | 'updates'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editingController, setEditingController] = useState<Controller | null>(null);
  const [editingGameUpdate, setEditingGameUpdate] = useState<GameUpdate | null>(null);
  const [rejectingGame, setRejectingGame] = useState<Game | null>(null);
  const [showAddController, setShowAddController] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [isAuthenticatedState, setIsAuthenticatedState] = useState(false);
  const [currentApprover, setCurrentApprover] = useState<string>('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    // Check if user is already authenticated
    const authenticated = isAuthenticated();
    setIsAuthenticatedState(authenticated);
    
    if (authenticated) {
      const approver = getCurrentApprover();
      if (approver) {
        setCurrentApprover(approver.name);
        fetchData();
      }
    } else {
      setShowTokenModal(true);
    }
  }, []);

  const signInWithToken = async () => {
    if (!tokenInput.trim()) {
      setAuthError('Please enter a token');
      return;
    }

    try {
      setAuthError('');
      const approver = await authenticateWithToken(tokenInput.trim());
      
      setIsAuthenticatedState(true);
      setCurrentApprover(approver.name);
      setShowTokenModal(false);
      setTokenInput('');
      fetchData();
    } catch (error) {
      console.error('Authentication error:', error);
      setAuthError('Invalid token or authentication failed');
    }
  };

  const handleSignOut = async () => {
    signOut();
    setIsAuthenticatedState(false);
    setCurrentApprover('');
    setShowTokenModal(true);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [gamesResponse, gameUpdatesResponse, controllersResponse] = await Promise.all([
        supabase
          .from('games')
          .select(`
            *,
            controllers!testing_controller_id(*),
            testing_controllers:games_testing_controllers!game_id(
              controllers(*)
            )
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('game_updates')
          .select(`
            *,
            original_game:games!original_game_id(*),
            controllers!testing_controller_id(*),
            testing_controllers:game_updates_testing_controllers!game_update_id(
              controllers(*)
            )
          `)
          .order('created_at', { ascending: false }),
        supabase.from('controllers').select('*').order('name')
      ]);

      if (gamesResponse.data) {
        const gamesWithController = gamesResponse.data.map(game => ({
          ...game,
          testing_controller: Array.isArray(game.controllers) 
            ? game.controllers[0] 
            : game.controllers,
          testing_controllers: ((game as any).testing_controllers || [])
            .map((tc: any) => tc.controllers)
            .filter((c: any) => c !== null)
        }));
        setGames(gamesWithController);
      }
      
      if (gameUpdatesResponse.data) {
        const updatesWithController = gameUpdatesResponse.data.map(update => ({
          ...update,
          testing_controller: Array.isArray(update.controllers) 
            ? update.controllers[0] 
            : update.controllers,
          testing_controllers: ((update as any).testing_controllers || [])
            .map((tc: any) => tc.controllers)
            .filter((c: any) => c !== null)
        }));
        setGameUpdates(updatesWithController);
      }
      
      if (controllersResponse.data) setControllers(controllersResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (gameId: string, approverName?: string) => {
    const approver = getCurrentApprover();
    if (!approver) {
      setAuthError('Authentication required');
      return;
    }

    try {
      const { error } = await supabase
        .from('games')
        .update({
          is_approved: true,
          approved_by: approverName || approver.name,
          approved_at: new Date().toISOString()
        })
        .eq('id', gameId);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error approving game:', error);
    }
  };

  const handleReject = async (gameId: string, reason: string) => {
    const approver = getCurrentApprover();
    if (!approver) {
      setAuthError('Authentication required');
      return;
    }

    try {
      const { error } = await supabase
        .from('games')
        .update({
          is_approved: false,
          rejected_reason: reason,
          rejected_by: approver.name,
          rejected_at: new Date().toISOString()
        })
        .eq('id', gameId);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error rejecting game:', error);
    }
  };

  const handleApproveUpdate = async (updateId: string) => {
    const approver = getCurrentApprover();
    if (!approver) {
      setAuthError('Authentication required');
      return;
    }

    try {
      const { error } = await supabase
        .from('game_updates')
        .update({
          is_approved: true,
          approved_by: approver.name,
          approved_at: new Date().toISOString()
        })
        .eq('id', updateId);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error approving update:', error);
    }
  };

  const handleRejectUpdate = async (updateId: string, reason: string) => {
    const approver = getCurrentApprover();
    if (!approver) {
      setAuthError('Authentication required');
      return;
    }

    try {
      const { error } = await supabase
        .from('game_updates')
        .update({
          is_approved: false,
          rejected_reason: reason,
          rejected_by: approver.name,
          rejected_at: new Date().toISOString()
        })
        .eq('id', updateId);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error rejecting update:', error);
    }
  };

  const handleSaveGame = async (gameId: string, updatedData: any, approveAfterSave = false, testing_controller_ids?: string[]) => {
    const approver = getCurrentApprover();
    if (!approver) {
      setAuthError('Authentication required');
      return;
    }

    try {
      // Add admin edit tracking
      const gameUpdateData = {
        ...updatedData,
        edited_by_admin: true,
        edited_at: new Date().toISOString(),
        ...(approveAfterSave && {
          is_approved: true,
          approved_by: approver.name,
          approved_at: new Date().toISOString()
        })
      };

      const { error } = await supabase
        .from('games')
        .update(gameUpdateData)
        .eq('id', gameId);

      if (error) throw error;

      // Update testing controllers junction table if provided
      if (testing_controller_ids && testing_controller_ids.length > 0) {
        // Delete existing relationships
        await supabase
          .from('games_testing_controllers')
          .delete()
          .eq('game_id', gameId);

        // Insert new relationships
        const junctionData = testing_controller_ids.map(controllerId => ({
          game_id: gameId,
          controller_id: controllerId
        }));

        await supabase
          .from('games_testing_controllers')
          .insert(junctionData);
      }

      setEditingGame(null);
      await fetchData();
    } catch (error) {
      console.error('Error updating game:', error);
    }
  };

  const handleSaveGameUpdate = async (updateId: string, updatedData: any, approveAfterSave = false) => {
    const approver = getCurrentApprover();
    if (!approver) {
      setAuthError('Authentication required');
      return;
    }

    try {
      // Add admin edit tracking
      const updateData = {
        ...updatedData,
        edited_by_admin: true,
        edited_at: new Date().toISOString(),
        ...(approveAfterSave && {
          is_approved: true,
          approved_by: approver.name,
          approved_at: new Date().toISOString()
        })
      };

      const { error } = await supabase
        .from('game_updates')
        .update(updateData)
        .eq('id', updateId);

      if (error) throw error;

      // Update testing controllers junction table if provided
      if (updatedData.testing_controller_ids && updatedData.testing_controller_ids.length > 0) {
        // Delete existing relationships
        await supabase
          .from('game_updates_testing_controllers')
          .delete()
          .eq('game_update_id', updateId);

        // Insert new relationships
        const junctionData = updatedData.testing_controller_ids.map((controllerId: string) => ({
          game_update_id: updateId,
          controller_id: controllerId
        }));

        await supabase
          .from('game_updates_testing_controllers')
          .insert(junctionData);
      }

      setEditingGameUpdate(null);
      await fetchData();
    } catch (error) {
      console.error('Error updating game update:', error);
    }
  };

  const handleSaveController = async (controllerId: string, updatedData: any) => {
    const approver = getCurrentApprover();
    if (!approver) {
      setAuthError('Authentication required');
      return;
    }

    try {
      const { error } = await supabase
        .from('controllers')
        .update(updatedData)
        .eq('id', controllerId);

      if (error) throw error;
      setEditingController(null);
      await fetchData();
    } catch (error) {
      console.error('Error updating controller:', error);
    }
  };

  const handleDeleteController = async (controllerId: string) => {
    const approver = getCurrentApprover();
    if (!approver) {
      setAuthError('Authentication required');
      return;
    }

    if (!confirm('Are you sure you want to delete this controller? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('controllers')
        .delete()
        .eq('id', controllerId);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting controller:', error);
    }
  };

  // Show token modal if not authenticated
  if (!isAuthenticatedState) {
    return (
      <div className="min-h-screen bg-black">
        {/* Header */}
        <header className="bg-black border-b border-white/20 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={onBack}
                className="flex items-center gap-3 text-white hover:text-white transition-colors
                           px-4 py-2 rounded-lg hover:bg-white/5 border border-white/20"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to Database</span>
              </button>
              <div className="flex items-center gap-4">
                <img 
                  src="/image.png" 
                  alt="GameSir" 
                  className="h-8 w-auto"
                />
                <div className="h-8 w-px bg-white/20"></div>
                <h1 className="text-xl font-bold text-white">Admin Panel</h1>
              </div>
              <div className="w-32"></div>
            </div>
          </div>
        </header>

        {/* Token Modal */}
        {showTokenModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-black border border-white/30 rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-900/20 rounded-lg flex items-center justify-center border border-red-800">
                  <Key className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Admin Access Required</h2>
                  <p className="text-sm text-white/70">Enter your access token to continue</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="token" className="block text-sm font-medium text-white mb-2">
                    Access Token
                  </label>
                  <input
                    type="password"
                    id="token"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && signInWithToken()}
                    className="w-full px-3 py-2 border border-white/30 rounded-lg 
                               text-white placeholder-white/50 bg-black focus:outline-none focus:ring-2 
                               focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                    placeholder="Enter your token"
                    autoFocus
                  />
                  {authError && (
                    <p className="text-red-400 text-sm mt-2">{authError}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onBack}
                    className="flex-1 px-4 py-2 bg-black hover:bg-black/80 text-white font-medium 
                               rounded-lg transition-all duration-200 border border-white/30"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={signInWithToken}
                    disabled={!tokenInput.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 
                               text-white font-medium rounded-lg transition-all duration-200 
                               disabled:cursor-not-allowed"
                  >
                    Access Panel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (showAddController) {
    return <AddControllerForm onBack={() => setShowAddController(false)} />;
  }

  const filteredGames = games.filter(game => 
    game.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGameUpdates = gameUpdates.filter(update => 
    (update as any).original_game?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredControllers = controllers.filter(controller => 
    controller.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingGames = filteredGames.filter(game => !game.is_approved && !game.rejected_reason);
  const approvedGames = filteredGames.filter(game => game.is_approved);
  const rejectedGames = filteredGames.filter(game => game.rejected_reason);
  const pendingUpdates = filteredGameUpdates.filter(update => !update.is_approved && !update.rejected_reason);

  const getPlatformProtocols = (game: Game | GameUpdate) => {
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
      if (game.android_gip) androidProtocols.push({ protocol: 'GIP', connectivity: game.android_gip });
      if (game.android_gtouch) androidProtocols.push({ protocol: 'G-TOUCH', connectivity: game.android_gtouch });

      platforms.push({
        name: 'Android',
        icon: <BsAndroid2 className="h-4 w-4 text-gray-300" />,
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
      if (game.ios_gip) iosProtocols.push({ protocol: 'GIP', connectivity: game.ios_gip });
      if (game.ios_gtouch) iosProtocols.push({ protocol: 'G-TOUCH', connectivity: game.ios_gtouch });

      platforms.push({
        name: 'iOS',
        icon: <BsApple className="h-4 w-4 text-gray-300" />,
        protocols: iosProtocols
      });
    }

    return platforms;
  };

  const getProtocolIcon = (protocol: string) => {
    switch (protocol.toUpperCase()) {
      case 'HID':
        return <Shield className="h-3 w-3 md:h-4 md:w-4" />;
      case 'XINPUT':
        return <BsXbox className="h-3 w-3 md:h-4 md:w-4" />;
      case 'DS4':
        return <BsPlaystation className="h-3 w-3 md:h-4 md:w-4" />;
      case 'NS':
        return <BsNintendoSwitch className="h-3 w-3 md:h-4 md:w-4" />;
      case 'GIP':
        return <BsMicrosoft className="h-3 w-3 md:h-4 md:w-4" />;
      case 'G-TOUCH':
        return <BsFillHandIndexFill className="h-3 w-3 md:h-4 md:w-4" />;
      default:
        return <BsController className="h-3 w-3 md:h-4 md:w-4" />;
    }
  };

  const getConnectivityIcon = (connectivity: string) => {
    switch (connectivity) {
      case 'Wired/2.4GHz/Bluetooth':
        return <Smartphone className="h-3 w-3" />;
      case 'Wired/2.4GHz':
        return <Smartphone className="h-3 w-3" />;
      case 'Bluetooth':
        return <Smartphone className="h-3 w-3" />;
      default:
        return <Smartphone className="h-3 w-3" />;
    }
  };

  const renderGameCard = (game: Game, showActions = true) => (
    <div key={game.id} className="bg-black border border-white/30 rounded-xl p-4 md:p-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white mb-2 break-words">{game.name}</h3>
            <p className="text-white/70 text-sm leading-relaxed">{game.description}</p>
          </div>
          {game.image_url && (
            <img 
              src={game.image_url} 
              alt={game.name}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0 mx-auto sm:mx-0"
            />
          )}
        </div>

        {/* Protocol Support */}
        <div className="space-y-3">
          {getPlatformProtocols(game).map((platform) => (
            <div key={platform.name} className="space-y-2">
              <div className="flex items-center gap-2">
                {platform.icon}
                <span className="text-sm font-medium text-white">{platform.name}</span>
              </div>
              
              {platform.protocols.length > 0 ? (
                <div className="flex flex-wrap gap-2 ml-6">
                  {platform.protocols.map((item, index) => (
                    <span key={`${platform.name}-${item.protocol}-${index}`} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border bg-zinc-900 text-white border-white/30">
                      {getProtocolIcon(item.protocol)}
                      <span>{item.protocol}</span>
                      <span className="text-xs text-white/50">via</span>
                      <div className="flex items-center gap-1">
                        {getConnectivityIcon(item.connectivity)}
                        <span className="text-xs">{item.connectivity}</span>
                      </div>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="ml-6">
                  <span className="px-3 py-2 bg-zinc-900 text-white/70 rounded-lg text-sm border border-white/30">
                    No protocols supported
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {game.discord_username && (
            <div className="flex items-center gap-2 flex-wrap">
              <User className="h-4 w-4 text-white/50 flex-shrink-0" />
              <span className="text-white text-sm break-all">{game.discord_username}</span>
              {game.edited_by_admin && (
                <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs border border-red-800">
                  Edited by Admin
                </span>
              )}
            </div>
          )}

          {((game.testing_controllers && game.testing_controllers.length > 0) || game.testing_controller) && (
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-white/50" />
              <span className="text-white text-sm">
                Tested with: {(game.testing_controllers && game.testing_controllers.length > 0)
                  ? game.testing_controllers?.map((c: any) => c.name).join(', ')
                  : game.testing_controller?.name || 'Unknown controller'
                }
              </span>
            </div>
          )}
          
          {game.testing_notes && (
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-white/50 mt-0.5 flex-shrink-0" />
              <span className="text-white text-sm break-words">{game.testing_notes}</span>
            </div>
          )}
          
          {game.created_at && (
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="h-4 w-4 text-white/50 flex-shrink-0" />
              <span className="text-white text-sm">
                {new Date(game.created_at).toLocaleDateString()}
              </span>
            </div>
          )}

          {game.rejected_reason && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-red-400 text-sm break-words">
                <span className="font-medium">Rejected:</span> {game.rejected_reason}
              </p>
              {game.rejected_by && (
                <p className="text-red-400/70 text-xs mt-1">
                  By: {game.rejected_by}
                </p>
              )}
            </div>
          )}
        </div>

        {showActions && (
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-white/20">
            {!game.is_approved && !game.rejected_reason && (
              <>
                <button
                  onClick={() => handleApprove(game.id)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 
                             text-white font-medium rounded-lg transition-all duration-200 text-sm"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </button>
                <button
                  onClick={() => setRejectingGame(game)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-black hover:bg-black/80 
                             text-white font-medium rounded-lg transition-all duration-200 border border-white/30 text-sm"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              </>
            )}
            <button
              onClick={() => setEditingGame(game)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-black hover:bg-black/80 
                         text-white font-medium rounded-lg transition-all duration-200 border border-white/30 text-sm"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderGameUpdateCard = (update: GameUpdate) => (
    <div key={update.id} className="bg-black border border-white/30 rounded-xl p-4 md:p-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white mb-2 break-words">
              Update for: {(update as any).original_game?.name}
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs border border-red-800">
                Game Update
              </span>
              {(update as any).edited_by_admin && (
                <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs border border-red-800">
                  Edited by Admin
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Updated Protocol Information */}
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-white mb-2">Supported Protocols (Updated):</h4>
            {getPlatformProtocols(update).map((platform) => (
              <div key={platform.name} className="space-y-2">
                <div className="flex items-center gap-2">
                  {platform.icon}
                  <span className="text-sm font-medium text-white">{platform.name}</span>
                </div>
                
                {platform.protocols.length > 0 ? (
                  <div className="flex flex-wrap gap-2 ml-6">
                    {platform.protocols.map((item, index) => (
                      <span key={`${platform.name}-${item.protocol}-${index}`} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border bg-zinc-900 text-white border-white/30">
                        {getProtocolIcon(item.protocol)}
                        <span>{item.protocol}</span>
                        <span className="text-xs text-white/50">via</span>
                        <div className="flex items-center gap-1">
                          {getConnectivityIcon(item.connectivity)}
                          <span className="text-xs">{item.connectivity}</span>
                        </div>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="ml-6">
                    <span className="px-3 py-2 bg-zinc-900 text-white/70 rounded-lg text-sm border border-white/30">
                      No protocols supported
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {update.discord_username && (
            <div className="flex items-center gap-2 flex-wrap">
              <User className="h-4 w-4 text-white/50 flex-shrink-0" />
              <span className="text-white text-sm break-all">{update.discord_username}</span>
            </div>
          )}

          {((update.testing_controllers && update.testing_controllers.length > 0) || update.testing_controller) && (
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-white/50" />
              <span className="text-white text-sm">
                Tested with: {(update.testing_controllers && update.testing_controllers.length > 0)
                  ? update.testing_controllers?.map((c: any) => c.name).join(', ')
                  : update.testing_controller?.name || 'Unknown controller'
                }
              </span>
            </div>
          )}
          
          {update.testing_notes && (
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-white/50 mt-0.5 flex-shrink-0" />
              <span className="text-white text-sm break-words">{update.testing_notes}</span>
            </div>
          )}
          
          {update.created_at && (
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="h-4 w-4 text-white/50 flex-shrink-0" />
              <span className="text-white text-sm">
                {new Date(update.created_at).toLocaleDateString()}
              </span>
            </div>
          )}

          {update.rejected_reason && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-red-400 text-sm break-words">
                <span className="font-medium">Rejected:</span> {update.rejected_reason}
              </p>
              {update.rejected_by && (
                <p className="text-red-400/70 text-xs mt-1">
                  By: {update.rejected_by}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-white/20">
          {!update.is_approved && !update.rejected_reason && (
            <>
              <button
                onClick={() => handleApproveUpdate(update.id)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 
                           text-white font-medium rounded-lg transition-all duration-200 text-sm"
              >
                <CheckCircle className="h-4 w-4" />
                Approve Update
              </button>
              <button
                onClick={() => handleRejectUpdate(update.id, 'Rejected by admin')}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-black hover:bg-black/80 
                           text-white font-medium rounded-lg transition-all duration-200 border border-white/30 text-sm"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            </>
          )}
          <button
            onClick={() => setEditingGameUpdate(update)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-black hover:bg-black/80 
                       text-white font-medium rounded-lg transition-all duration-200 border border-white/30 text-sm"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onBack}
              className="flex items-center gap-3 text-white hover:text-white transition-colors
                         px-4 py-2 rounded-lg hover:bg-white/5 border border-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Database</span>
            </button>
            <div className="flex items-center gap-4">
              <img 
                src="/image.png" 
                alt="GameSir" 
                className="h-8 w-auto"
              />
              <div className="h-8 w-px bg-white/20"></div>
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/70">Welcome, {currentApprover}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 bg-black hover:bg-black/80 
                           text-white font-medium rounded-lg transition-all duration-200 border border-white/30 text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col xl:flex-row gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCurrentView('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm grow ${
                currentView === 'pending'
                  ? 'bg-red-600 text-white'
                  : 'bg-black text-white border border-white/30 hover:bg-white/5'
              }`}
            >
              Pending ({pendingGames.length})
            </button>
            <button
              onClick={() => setCurrentView('updates')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm grow ${
                currentView === 'updates'
                  ? 'bg-red-600 text-white'
                  : 'bg-black text-white border border-white/30 hover:bg-white/5'
              }`}
            >
              Updates ({pendingUpdates.length})
            </button>
            <button
              onClick={() => setCurrentView('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm grow ${
                currentView === 'approved'
                  ? 'bg-red-600 text-white'
                  : 'bg-black text-white border border-white/30 hover:bg-white/5'
              }`}
            >
              Approved ({approvedGames.length})
            </button>
            <button
              onClick={() => setCurrentView('rejected')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm grow ${
                currentView === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-black text-white border border-white/30 hover:bg-white/5'
              }`}
            >
              Rejected ({rejectedGames.length})
            </button>
            <button
              onClick={() => setCurrentView('controllers')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm grow ${
                currentView === 'controllers'
                  ? 'bg-red-600 text-white'
                  : 'bg-black text-white border border-white/30 hover:bg-white/5'
              }`}
            >
              Controllers ({filteredControllers.length})
            </button>
          </div>
          
          <div className="flex flex-row gap-2 xl:ml-auto">
            <div className="relative grow">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-4 pr-4 py-2 border border-white/30 rounded-lg 
                           text-white placeholder-white/50 bg-black focus:outline-none focus:ring-2 
                           focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-sm w-full"
              />
            </div>
            {currentView === 'controllers' && (
              <button
                onClick={() => setShowAddController(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 
                           text-white font-medium rounded-lg transition-all duration-200 text-sm whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                Add Controller
              </button>
            )}
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-black/80 
                         text-white font-medium rounded-lg transition-all duration-200 text-sm whitespace-nowrap
                         border border-white/30 hover:border-white/50"
            >
              <TbTableExport className="h-4 w-4" />
              Export Data
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-red-600 mx-auto"></div>
              <p className="text-white/70 mt-2">Loading...</p>
            </div>
          ) : (
            <>
              {currentView === 'pending' && (
                <div className="grid gap-6">
                  {pendingGames.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-white/70">No pending games</p>
                    </div>
                  ) : (
                    pendingGames.map(game => renderGameCard(game))
                  )}
                </div>
              )}

              {currentView === 'updates' && (
                <div className="grid gap-6">
                  {pendingUpdates.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-white/70">No pending updates</p>
                    </div>
                  ) : (
                    pendingUpdates.map(update => renderGameUpdateCard(update))
                  )}
                </div>
              )}

              {currentView === 'approved' && (
                <div className="grid gap-6">
                  {approvedGames.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-white/70">No approved games</p>
                    </div>
                  ) : (
                    approvedGames.map(game => renderGameCard(game))
                  )}
                </div>
              )}

              {currentView === 'rejected' && (
                <div className="grid gap-6">
                  {rejectedGames.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-white/70">No rejected games</p>
                    </div>
                  ) : (
                    rejectedGames.map(game => renderGameCard(game))
                  )}
                </div>
              )}

              {currentView === 'controllers' && (
                <div className="grid gap-6">
                  {filteredControllers.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-white/70">No controllers</p>
                    </div>
                  ) : (
                    filteredControllers.map(controller => (
                      <div key={controller.id} className="bg-black border border-white/30 rounded-xl p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-white mb-2 break-words">{controller.name}</h3>
                            <p className="text-white/70 text-sm mb-3">{controller.manufacturer}</p>
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2">
                                <span className="text-sm text-white/70">Wired/2.4GHz:</span>
                                {controller.wired_protocols.map(protocol => (
                                  <span key={protocol} className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs border border-red-800">
                                    {protocol}
                                  </span>
                                ))}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className="text-sm text-white/70">Bluetooth:</span>
                                {controller.bluetooth_protocols.map(protocol => (
                                  <span key={protocol} className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs border border-blue-800">
                                    {protocol}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingController(controller)}
                              className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-black/80 
                                         text-white font-medium rounded-lg transition-all duration-200 border border-white/30 text-sm"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteController(controller.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 
                                         text-white font-medium rounded-lg transition-all duration-200 text-sm"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {editingGame && (
        <EditGameModal
          game={editingGame}
          controllers={controllers}
          onSave={handleSaveGame}
          onClose={() => setEditingGame(null)}
        />
      )}

      {editingGameUpdate && (
        <EditGameUpdateModal
          gameUpdate={editingGameUpdate}
          controllers={controllers}
          onSave={handleSaveGameUpdate}
          onClose={() => setEditingGameUpdate(null)}
        />
      )}

      {rejectingGame && (
        <RejectGameModal
          game={rejectingGame}
          onReject={handleReject}
          onClose={() => setRejectingGame(null)}
        />
      )}

      {editingController && (
        <EditControllerModal
          controller={editingController}
          onSave={handleSaveController}
          onClose={() => setEditingController(null)}
        />
      )}

      {showExportModal && (
        <ExportDataModal
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
};