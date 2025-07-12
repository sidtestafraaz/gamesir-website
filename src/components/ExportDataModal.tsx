import React, { useState } from 'react';
import { Download, X, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';

interface ExportDataModalProps {
  onClose: () => void;
}

export const ExportDataModal: React.FC<ExportDataModalProps> = ({ onClose }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const exportGamesData = async () => {
    try {
      const { data: games, error } = await supabase
        .from('games')
        .select(`
          *,
          controllers!testing_controller_id(*),
          testing_controllers:games_testing_controllers!game_id(
            controllers(*)
          )
        `)
        .eq('is_approved', true)
        .order('name');

      if (error) throw error;

      const gamesData = games.map(game => {
        const testingControllers = ((game as any).testing_controllers || [])
          .map((tc: any) => tc.controllers?.name)
          .filter((name: any) => name)
          .join(', ');

        // Android protocols
        const androidProtocols = [];
        if (game.android_tested) {
          if (game.android_hid) androidProtocols.push(`HID (${game.android_hid})`);
          if (game.android_xinput) androidProtocols.push(`XINPUT (${game.android_xinput})`);
          if (game.android_ds4) androidProtocols.push(`DS4 (${game.android_ds4})`);
          if (game.android_ns) androidProtocols.push(`NS (${game.android_ns})`);
          if (game.android_gip) androidProtocols.push(`GIP (${game.android_gip})`);
          if (game.android_gtouch) androidProtocols.push(`G-TOUCH (${game.android_gtouch})`);
          
        }

        // iOS protocols
        const iosProtocols = [];
        if (game.ios_tested) {
          if (game.ios_hid) iosProtocols.push(`HID (${game.ios_hid})`);
          if (game.ios_xinput) iosProtocols.push(`XINPUT (${game.ios_xinput})`);
          if (game.ios_ds4) iosProtocols.push(`DS4 (${game.ios_ds4})`);
          if (game.ios_ns) iosProtocols.push(`NS (${game.ios_ns})`);
          if (game.ios_gip) iosProtocols.push(`GIP (${game.ios_gip})`);
          if (game.ios_gtouch) iosProtocols.push(`G-TOUCH (${game.ios_gtouch})`);
        }

        return {
          'Game Name': game.name,
          'Description': game.description || '',
          'IGDB ID': game.igdb_id || '',
          'Android Tested': game.android_tested ? 'Yes' : 'No',
          'Android Protocols': androidProtocols.join(', ') || 'None',
          'iOS Tested': game.ios_tested ? 'Yes' : 'No',
          'iOS Protocols': iosProtocols.join(', ') || 'None',
          'Testing Controllers': testingControllers || 'None',
          'Testing Notes': game.testing_notes || '',
          'Discord Username': game.discord_username || '',
          'Approved By': game.approved_by || '',
          'Approved At': game.approved_at ? new Date(game.approved_at).toLocaleDateString() : '',
          'Created At': game.created_at ? new Date(game.created_at).toLocaleDateString() : '',
          'Edited by Admin': game.edited_by_admin ? 'Yes' : 'No'
        };
      });

      return gamesData;
    } catch (error) {
      console.error('Error fetching games data:', error);
      throw error;
    }
  };

  const exportControllersData = async () => {
    try {
      const { data: controllers, error } = await supabase
        .from('controllers')
        .select('*')
        .order('name');

      if (error) throw error;

      const controllersData = controllers.map(controller => ({
        'Controller Name': controller.name,
        'Manufacturer': controller.manufacturer,
        'Wired/2.4GHz Protocols': controller.wired_protocols.join(', ') || 'None',
        'Bluetooth Protocols': controller.bluetooth_protocols.join(', ') || 'None',
        'All Supported Protocols': controller.supported_protocols.join(', ') || 'None',
        'Created At': controller.created_at ? new Date(controller.created_at).toLocaleDateString() : ''
      }));

      return controllersData;
    } catch (error) {
      console.error('Error fetching controllers data:', error);
      throw error;
    }
  };

  const exportCreditsData = async () => {
    try {
      const { data: games, error } = await supabase
        .from('games')
        .select('name, discord_username')
        .eq('is_approved', true)
        .not('discord_username', 'is', null)
        .order('discord_username');

      if (error) throw error;

      // Group games by discord username
      const contributorMap = new Map<string, string[]>();
      
      games.forEach(game => {
        if (game.discord_username) {
          // Handle multiple usernames separated by commas
          const usernames = game.discord_username.split(',').map((u: string) => u.trim());
          usernames.forEach((username: string) => {
            if (username) {
              if (!contributorMap.has(username)) {
                contributorMap.set(username, []);
              }
              contributorMap.get(username)!.push(game.name);
            }
          });
        }
      });

      const creditsData = Array.from(contributorMap.entries())
        .map(([discordName, gameNames]) => ({
          'Discord Name': discordName,
          'Number of Games Contributed': gameNames.length,
          'List of Game Names Contributed': gameNames.join(', ')
        }))
        .sort((a, b) => b['Number of Games Contributed'] - a['Number of Games Contributed']);

      return creditsData;
    } catch (error) {
      console.error('Error fetching credits data:', error);
      throw error;
    }
  };

  const handleExport = async (exportType: 'games' | 'controllers' | 'credits' | 'all') => {
    setIsExporting(true);
    setExportStatus('idle');
    setErrorMessage('');

    try {
      const workbook = XLSX.utils.book_new();

      if (exportType === 'games' || exportType === 'all') {
        const gamesData = await exportGamesData();
        const gamesWorksheet = XLSX.utils.json_to_sheet(gamesData);
        
        // Auto-size columns
        const gamesColWidths = Object.keys(gamesData[0] || {}).map(key => ({
          wch: Math.max(key.length, 15)
        }));
        gamesWorksheet['!cols'] = gamesColWidths;
        
        XLSX.utils.book_append_sheet(workbook, gamesWorksheet, 'Games Data');
      }

      if (exportType === 'controllers' || exportType === 'all') {
        const controllersData = await exportControllersData();
        const controllersWorksheet = XLSX.utils.json_to_sheet(controllersData);
        
        // Auto-size columns
        const controllersColWidths = Object.keys(controllersData[0] || {}).map(key => ({
          wch: Math.max(key.length, 15)
        }));
        controllersWorksheet['!cols'] = controllersColWidths;
        
        XLSX.utils.book_append_sheet(workbook, controllersWorksheet, 'Controllers Data');
      }

      if (exportType === 'credits' || exportType === 'all') {
        const creditsData = await exportCreditsData();
        const creditsWorksheet = XLSX.utils.json_to_sheet(creditsData);
        
        // Auto-size columns
        const creditsColWidths = Object.keys(creditsData[0] || {}).map(key => ({
          wch: key === 'List of Game Names Contributed' ? 50 : Math.max(key.length, 20)
        }));
        creditsWorksheet['!cols'] = creditsColWidths;
        
        XLSX.utils.book_append_sheet(workbook, creditsWorksheet, 'Credits Data');
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = exportType === 'all' 
        ? `GameSir_Database_Export_${timestamp}.xlsx`
        : `GameSir_${exportType.charAt(0).toUpperCase() + exportType.slice(1)}_Data_${timestamp}.xlsx`;

      // Download the file
      XLSX.writeFile(workbook, filename);

      setExportStatus('success');
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error('Export error:', error);
      setErrorMessage(error.message || 'Failed to export data');
      setExportStatus('error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-white/30 rounded-xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-bold text-white">Export Data</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white/50" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-white/70 text-sm">
            Export database information as Excel files. Choose what data to export:
          </p>

          <div className="space-y-3">
            <button
              onClick={() => handleExport('games')}
              disabled={isExporting}
              className="w-full flex items-center gap-3 p-4 bg-black hover:bg-white/5 
                         border border-white/30 hover:border-white/50 rounded-lg 
                         text-white transition-all duration-200 disabled:opacity-50"
            >
              <Download className="h-5 w-5 text-red-600" />
              <div className="text-left">
                <div className="font-medium">Games Data</div>
                <div className="text-sm text-white/70">
                  Mobile Games, Supported Protocols and Testing info
                </div>
              </div>
            </button>

            <button
              onClick={() => handleExport('controllers')}
              disabled={isExporting}
              className="w-full flex items-center gap-3 p-4 bg-black hover:bg-white/5 
                         border border-white/30 hover:border-white/50 rounded-lg 
                         text-white transition-all duration-200 disabled:opacity-50"
            >
              <Download className="h-5 w-5 text-red-600" />
              <div className="text-left">
                <div className="font-medium">Controllers Data</div>
                <div className="text-sm text-white/70">
                  Controllers and Supported Protocols
                </div>
              </div>
            </button>

            <button
              onClick={() => handleExport('credits')}
              disabled={isExporting}
              className="w-full flex items-center gap-3 p-4 bg-black hover:bg-white/5 
                         border border-white/30 hover:border-white/50 rounded-lg 
                         text-white transition-all duration-200 disabled:opacity-50"
            >
              <Download className="h-5 w-5 text-red-600" />
              <div className="text-left">
                <div className="font-medium">Credits Data</div>
                <div className="text-sm text-white/70">
                  Game Contributors and List of Games
                </div>
              </div>
            </button>

            <button
              onClick={() => handleExport('all')}
              disabled={isExporting}
              className="w-full flex items-center gap-3 p-4 bg-red-600 hover:bg-red-700 
                         rounded-lg text-white transition-all duration-200 disabled:opacity-50"
            >
              <Download className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Export All Data</div>
                <div className="text-sm text-red-200">
                  Complete database export (all sheets in one file)
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {exportStatus === 'error' && (
          <div className="flex items-center gap-3 p-4 bg-black border border-white/30 rounded-lg mb-4">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <span className="text-red-400">{errorMessage}</span>
          </div>
        )}

        {exportStatus === 'success' && (
          <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-800 rounded-lg mb-4">
            <CheckCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <span className="text-red-400">Export completed successfully!</span>
          </div>
        )}

        {isExporting && (
          <div className="flex items-center justify-center gap-3 p-4 bg-white/5 border border-white/20 rounded-lg">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-red-600"></div>
            <span className="text-white">Exporting data...</span>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-white/20">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-6 py-3 border border-white/30 text-white hover:bg-white/5 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       font-medium rounded-lg transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
