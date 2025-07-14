import React, { useState } from 'react';
import { Heart, MessageCircle, Filter, Grid, List, ArrowRight } from 'lucide-react';

interface InspirationItem {
  id: string;
  beforeImage: string;
  afterImage: string;
  title: string;
  tags: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  projectType?: string;
}

const InspirationFeed: React.FC = () => {
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedProjectType, setSelectedProjectType] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [inspirationItems, setInspirationItems] = useState<InspirationItem[]>([
    {
      id: '1',
      beforeImage: 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=400',
      afterImage: 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=400',
      title: 'Modern Kitchen Transformation',
      tags: ['Modern Minimalist', 'Kitchen', 'Clean Lines'],
      likes: 42,
      comments: 8,
      isLiked: false,
      projectType: 'Kitchen'
    },
    {
      id: '2',
      beforeImage: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=400',
      afterImage: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=400',
      title: 'Modern Zen Backyard',
      tags: ['Modern Zen', 'Backyard', 'Natural'],
      likes: 38,
      comments: 12,
      isLiked: true,
      projectType: 'Backyard'
    },
    {
      id: '3',
      beforeImage: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400',
      afterImage: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400',
      title: 'Farmhouse Chic Kitchen',
      tags: ['Farmhouse Chic', 'Kitchen', 'Rustic'],
      likes: 56,
      comments: 15,
      isLiked: false,
      projectType: 'Kitchen'
    },
    {
      id: '4',
      beforeImage: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=400',
      afterImage: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=400',
      title: 'Mediterranean Oasis',
      tags: ['Mediterranean Oasis', 'Backyard', 'Outdoor'],
      likes: 33,
      comments: 6,
      isLiked: false,
      projectType: 'Backyard'
    }
  ]);

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
    setInspirationItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, isLiked: !item.isLiked, likes: item.isLiked ? item.likes - 1 : item.likes + 1 }
          : item
      )
    );
  };

  const handleGetQuote = (projectType: string) => {
    setSelectedProjectType(projectType);
    setShowQuoteModal(true);
  };

  const filteredItems = inspirationItems.filter(item => {
    if (selectedFilter === 'all') return true;
    return item.tags.some(tag => tag.toLowerCase().includes(selectedFilter));
  });

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            See What Others Are Creating
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            All designs created by homeowners in MetroWest Massachusetts. Explore AI-generated transformations and get inspired.
          </p>
        </div>

        {/* Filters and View Toggle */}
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

        {/* Inspiration Grid */}
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}`}>
          {filteredItems.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Before/After Images */}
              <div className="relative">
                <div className="grid grid-cols-2 gap-px">
                  <div className="relative">
                    <img 
                      src={item.beforeImage} 
                      alt="Before" 
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      Before
                    </div>
                  </div>
                  <div className="relative">
                    <img 
                      src={item.afterImage} 
                      alt="After" 
                      className="w-full h-48 object-cover"
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
                    onClick={() => handleGetQuote(item.projectType || 'Other')}
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