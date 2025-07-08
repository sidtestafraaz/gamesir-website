import React, { useState } from 'react';
import { Search, Database, Plus, Menu, X, Shield } from 'lucide-react';
import { useGameSearch } from './hooks/useGameSearch';
import { SearchBar } from './components/SearchBar';
import { ControllerDropdown } from './components/ControllerDropdown';
import { GameCard } from './components/GameCard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AddGameForm } from './components/AddGameForm';
import { ApprovalPage } from './components/ApprovalPage';
import { Pagination } from './components/Pagination';

const GAMES_PER_PAGE = 10;

function App() {
  const [currentView, setCurrentView] = useState<'search' | 'add' | 'approval'>('search');
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const {
    controllers,
    results,
    searchQuery,
    setSearchQuery,
    selectedController,
    setSelectedController,
    isLoading,
    refreshData
  } = useGameSearch();

  // Get URL search params to auto-search
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
      // Clear the URL parameter
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [setSearchQuery]);

  const handleBackToSearch = () => {
    setCurrentView('search');
    refreshData();
  };

  // Reset page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedController]);

  // Pagination logic
  const totalPages = Math.ceil(results.length / GAMES_PER_PAGE);
  const startIndex = (currentPage - 1) * GAMES_PER_PAGE;
  const paginatedResults = results.slice(startIndex, startIndex + GAMES_PER_PAGE);

  if (currentView === 'add') {
    return <AddGameForm onBack={handleBackToSearch} />;
  }

  if (currentView === 'approval') {
    return <ApprovalPage onBack={handleBackToSearch} />;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <img 
                  src="/image.png" 
                  alt="GameSir" 
                  className="h-10 w-auto"
                />
              </div>
              <div className="h-8 w-px bg-white/20"></div>
              <h1 className="text-xl lg:text-2xl font-bold text-white">
                Mobile Games Database
              </h1>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setCurrentView('approval')}
                className="flex items-center gap-2 px-6 py-2 bg-black hover:bg-black/80 
                           text-white hover:text-white font-medium rounded-lg transition-all duration-200
                           border border-white/30 hover:border-white/50"
              >
                <Shield className="h-4 w-4" />
                Admin
              </button>
              <button
                onClick={() => setCurrentView('add')}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 
                           text-white font-medium rounded-lg transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                Add Game
              </button>
              <div className="flex items-center gap-3 text-white">
                <Database className="h-5 w-5" />
                <span className="text-sm font-medium">{results.length} games</span>
              </div>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <img 
                  src="/image.png" 
                  alt="GameSir" 
                  className="h-6 w-auto"
                />
                <div className="h-8 w-px bg-white/20"></div>
                <div className="flex flex-col">
                  <h1 className="text-sm font-bold text-white leading-tight">
                    Mobile Games
                  </h1>
                  <span className="text-xs text-white/70">Database</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-white">
                  <Database className="h-4 w-4" />
                  <span className="text-xs font-medium">{results.length}</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-lg text-white hover:bg-black/50 transition-colors border border-white/20"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="border-t border-white/20 bg-black">
                <div className="px-4 py-4 space-y-3 flex flex-col items-center">
                  <button
                    onClick={() => {
                      setCurrentView('approval');
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-black hover:bg-black/80 
                              text-white hover:text-white font-medium rounded-lg transition-all duration-200
                              border border-white/30 hover:border-white/50 w-full justify-center"
                  >
                    <Shield className="h-4 w-4" />
                    Admin Page
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('add');
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 
                              text-white font-medium rounded-lg transition-all duration-200
                              w-full justify-center"
                  >
                    <Plus className="h-4 w-4" />
                    Add New Game
                  </button>
                  <div className="flex items-center justify-center gap-3 text-white py-2">
                    <Database className="h-5 w-5" />
                    <span className="text-sm font-medium">{results.length} games in database</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Find Games That Work with Your Controller
          </h2>
          <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            A growing, <span className='font-bold'>community-maintained</span> directory of mobile games confirmed to work with your GameSir controllers on Android and iOS.
            Explore, play, and contribute to keep the list fresh.
          </p>
        </div>
        
        {/* Search Section */}
        <div className="mb-8 md:mb-12">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search games by name or description..."
              />
              <ControllerDropdown
                controllers={controllers}
                selectedController={selectedController}
                onSelect={setSelectedController}
              />
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {isLoading ? (
            <LoadingSpinner />
          ) : results.length === 0 ? (
            <div className="text-center py-12 md:py-16">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20">
                <Search className="h-10 w-10 md:h-12 md:w-12 text-white/50" />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-white mb-3">
                No games found
              </h3>
              <p className="text-white/70 text-base md:text-lg">
                Try adjusting your search query or selecting a different controller.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:gap-6">
                {paginatedResults.map((result) => (
                  <GameCard key={result.game.id} result={result} onRefresh={refreshData} />
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={GAMES_PER_PAGE}
                totalItems={results.length}
                itemName="games"
              />
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-white/20 mt-16 md:mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <img 
              src="/image.png" 
              alt="GameSir" 
              className="h-6 md:h-8 w-auto"
            />
            <div className="h-6 w-px bg-white/20"></div>
            <span className="text-white font-medium text-sm md:text-base">Mobile Games Database</span>
          </div>
          <div className="text-center text-white/70">
            <p className="text-sm md:text-base">Submit. Play. Share.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;