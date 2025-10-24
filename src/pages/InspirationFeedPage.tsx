import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, ArrowRight, ArrowLeft, Grid, List, Filter } from 'lucide-react';
import { LeadService, type RenovationItem } from '../services/leadService';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';

interface InspirationFeedPageProps {
  user: SupabaseUser | null;
  onShowAuth: () => void;
}

const InspirationFeedPage: React.FC<InspirationFeedPageProps> = ({ user, onShowAuth }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [inspirationItems, setInspirationItems] = useState<RenovationItem[]>([]);
  const [validItems, setValidItems] = useState<RenovationItem[]>([]);
  const [displayedItems, setDisplayedItems] = useState<RenovationItem[]>([]);
  const [showingCount, setShowingCount] = useState(12);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const checkImageLoad = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

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

  useEffect(() => {
    const fetchRenovations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const renovations = await LeadService.getRenovations();
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
  }, []);

  useEffect(() => {
    const filtered = validItems.filter(item => {
      if (selectedFilter === 'all') return true;
      return item.tags.some(tag => tag.toLowerCase().includes(selectedFilter));
    });

    setDisplayedItems(filtered.slice(0, showingCount));
  }, [validItems, selectedFilter, showingCount]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [isLoadingMore, displayedItems.length]);

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

  const handleLoadMore = () => {
    const filteredItems = validItems.filter(item => {
      if (selectedFilter === 'all') return true;
      return item.tags.some(tag => tag.toLowerCase().includes(selectedFilter));
    });

    if (displayedItems.length < filteredItems.length) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setShowingCount(prev => prev + 12);
        setIsLoadingMore(false);
      }, 500);
    }
  };

  const filteredItems = validItems.filter(item => {
    if (selectedFilter === 'all') return true;
    return item.tags.some(tag => tag.toLowerCase().includes(selectedFilter));
  });

  const hasMoreItems = displayedItems.length < filteredItems.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Inspiration Feed</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Browse real AI-generated transformations from MetroWest Massachusetts homeowners
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
              No renovations found. Try adjusting your filters!
            </p>
          </div>
        )}

        {/* Filters and View Toggle */}
        {!isLoading && !error && displayedItems.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
            <div className="flex flex-wrap gap-2">
              {filters.map(filter => (
                <button
                  key={filter}
                  onClick={() => {
                    setSelectedFilter(filter);
                    setShowingCount(12);
                  }}
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
                    <div className="grid grid-cols-2 gap-2 p-2">
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
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Infinite Scroll Observer Target */}
            {hasMoreItems && (
              <div ref={observerTarget} className="text-center py-8">
                {isLoadingMore && (
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                )}
              </div>
            )}

            {/* End of Feed Message */}
            {!hasMoreItems && displayedItems.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">You've reached the end of the feed!</p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InspirationFeedPage;
