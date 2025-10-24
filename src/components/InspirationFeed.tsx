import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Filter, Grid, List, ArrowRight, Lock, User } from 'lucide-react';
import { LeadService, type RenovationItem } from '../services/leadService';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface InspirationFeedProps {
  user: SupabaseUser | null;
  onShowAuth: () => void;
  filterZipCodes?: string[];
}

const InspirationFeed: React.FC<InspirationFeedProps> = ({ user, onShowAuth, filterZipCodes }) => {
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedProjectType, setSelectedProjectType] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [inspirationItems, setInspirationItems] = useState<RenovationItem[]>([]);
  const [validItems, setValidItems] = useState<RenovationItem[]>([]);
  const [displayedItems, setDisplayedItems] = useState<RenovationItem[]>([]);
  const [showingCount, setShowingCount] = useState(6);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to check if an image loads successfully
  const checkImageLoad = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  // Filter out items with broken after images
  const validateImages = async (items: RenovationItem[]) => {
    const validatedItems: RenovationItem[] = [];
    
    for (const item of items) {
      const afterImageValid = await checkImageLoad(item.afterImage);
      if (afterImageValid) {
        validatedItems.push(item);
      }
    }
    
    return validatedItems;
  };

  // Fetch renovations when component mounts or filterZipCodes changes
  useEffect(() => {
    const fetchRenovations = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const renovations = await LeadService.getRenovations(filterZipCodes);
        const validRenovations = await validateImages(renovations);
        setInspirationItems(validRenovations);
        setValidItems(validRenovations);
      } catch (err) {
        console.error('Error fetching renovations:', err);
        setError('Failed to load renovations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRenovations();
  }, [filterZipCodes]);

  // Update displayed items when filter changes
  useEffect(() => {
    const filtered = validItems.filter(item => {
      if (selectedFilter === 'all') return true;
      return item.tags.some(tag => tag.toLowerCase().includes(selectedFilter));
    });
    
    setDisplayedItems(filtered.slice(0, showingCount));
  }, [validItems, selectedFilter, showingCount]);

  const filters = [
    'all', 
    'kitchen', 
    'backyard', 
    'modern minimalist', 
    'farmhouse chic', 
    'transitional',
    'coastal new england',
    'contemporary luxe',
    'eclectic bohemian',
    'modern zen',
    'mediterranean oasis'
  ];

  const handleLike = (id: string) => {
    if (!user) {
      onShowAuth();
      return;
    }
    
    setValidItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, isLiked: !item.isLiked, likes: item.isLiked ? item.likes - 1 : item.likes + 1 }
          : item
      )
    );
    
    setDisplayedItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, isLiked: !item.isLiked, likes: item.isLiked ? item.likes - 1 : item.likes + 1 }
          : item
      )
    );
  };

  const handleGetQuote = (projectType: string) => {
    if (!user) {
      onShowAuth();
      return;
    }
    
    setSelectedProjectType(projectType);
    setShowQuoteModal(true);
  };

  const handleLoadMore = () => {
    setShowingCount(prev => prev + 8);
  };

  const filteredItems = validItems.filter(item => {
    if (selectedFilter === 'all') return true;
    return item.tags.some(tag => tag.toLowerCase().includes(selectedFilter));
  });

  const hasMoreItems = displayedItems.length < filteredItems.length;
  // Show auth prompt if user is not logged in
  if (!user) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              See What Others Are Creating
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {filterZipCodes 
                ? `Designs created by homeowners in your area. Explore AI-generated transformations and get inspired.`
                : `All designs created by homeowners in MetroWest Massachusetts. Explore AI-generated transformations and get inspired.`
              }
            </p>
          </div>

          <div className="max-w-md mx-auto bg-gray-50 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Sign In to View Community Designs
            </h3>
            <p className="text-gray-600 mb-6">
              {filterZipCodes 
                ? `Join our community to see amazing transformations from homeowners in your area and share your own designs.`
                : `Join our community to see amazing transformations from other MetroWest homeowners and share your own designs.`
              }
            </p>
            <button
              onClick={onShowAuth}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300"
            >
              <User className="w-5 h-5" />
              Sign In to Continue
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {filterZipCodes ? 'Local Home Transformations' : 'See What Others Are Creating'}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {filterZipCodes 
              ? `Real AI-generated transformations from homeowners in your area. Get inspired by what's possible.`
              : `All designs created by homeowners in MetroWest Massachusetts. Explore AI-generated transformations and get inspired.`
            }
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading renovations...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* No Results State */}
        {!isLoading && !error && displayedItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              {filterZipCodes 
                ? `No renovations found in your area yet. Be the first to share your transformation!`
                : `No renovations found. Try adjusting your filters or be the first to share your transformation!`
              }
            </p>
          </div>
        )}

        {/* Filters and View Toggle */}
        {!isLoading && !error && displayedItems.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
          <div className="flex flex-wrap gap-2">
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          </div>
        )}

        {/* Inspiration Grid */}
        {!isLoading && !error && displayedItems.length > 0 && (
          <>
          <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}`}>
          {displayedItems.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Before/After Images */}
              <div className="relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="relative">
                    <img 
                      src={item.beforeImage} 
                      alt="Before" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      Before
                    </div>
                  </div>
                  <div className="relative">
                    <img 
                      src={item.afterImage} 
                      alt="After" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white text-xs px-2 py-1 rounded">
                      After
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {item.tags.map(tag => (
                    <span key={tag} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(item.id)}
                      className={`flex items-center gap-1 text-sm transition-colors ${
                        item.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${item.isLiked ? 'fill-current' : ''}`} />
                      {item.likes}
                    </button>
                    <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      {item.comments}
                    </button>
                  </div>
                  <button
                    onClick={() => handleGetQuote(item.projectType)}
                    className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-2 py-1 rounded-full transition-colors"
                  >
                    Get quote like this
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
          
          {/* View Full Feed Button */}
          <div className="text-center mt-8">
            <a
              href="/inspiration-feed"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300"
            >
              View Full Inspiration Feed
              <ArrowRight className="w-5 h-5" />
            </a>
            <p className="text-gray-600 mt-3 text-sm">
              Browse {filteredItems.length} designs and scroll through endless inspiration
            </p>
          </div>
          </>
        )}
        
        {/* Simple Quote Modal */}
        {showQuoteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative">
              <p className="text-center text-gray-600 mb-4">
                Please complete the ZIP code verification first to request a quote.
              </p>
              <button
                onClick={() => setShowQuoteModal(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default InspirationFeed;