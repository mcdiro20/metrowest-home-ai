import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { aiEngines } from '../utils/aiEngines.tsx';

interface StyleOption {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  prompt: string;
}

interface StyleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStyleSelected: (style: StyleOption) => void;
  onCustomStyleSelected: (customPrompt: string, baseStyle?: string) => void;
  roomType: string;
  selectedAIEngine: string;
}

const StyleSelectionModal: React.FC<StyleSelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onStyleSelected,
  onCustomStyleSelected,
  roomType,
  selectedAIEngine
}) => {
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedBaseStyle, setSelectedBaseStyle] = useState<string>('');

  const kitchenStyles: StyleOption[] = [
    {
      id: 'modern-minimalist',
      name: 'Modern Minimalist',
      description: 'Architectural-quality rendering with handleless cabinetry, waterfall countertops, and cinematic lighting',
      imageUrl: 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=600',
      prompt: 'modern minimalist style with clean white cabinets, hidden handles, quartz countertops, and sleek stainless steel appliances'
    },
    {
      id: 'farmhouse-chic',
      name: 'Farmhouse Chic',
      description: 'Elegant modern farmhouse with shaker cabinetry, butcher block counters, and warm Edison lighting',
      imageUrl: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600',
      prompt: 'farmhouse chic style with white shaker cabinets, open wood shelving, farmhouse sink, and vintage lighting fixtures'
    },
    {
      id: 'contemporary-luxe',
      name: 'Contemporary Luxe',
      description: 'Luxury finishes with dramatic stone, navy cabinetry, and statement lighting',
      imageUrl: 'https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=600',
      prompt: 'contemporary luxe style with dark cabinetry, waterfall marble island, gold fixtures, and high-end appliances'
    },
    {
      id: 'industrial-loft',
      name: 'Industrial Loft',
      description: 'Urban sophistication with steel frames, concrete counters, and Edison bulb lighting',
      imageUrl: 'https://images.pexels.com/photos/1599791/pexels-photo-1599791.jpeg?auto=compress&cs=tinysrgb&w=600',
      prompt: 'industrial loft style with steel-framed cabinets, concrete countertops, and Edison bulb lighting'
    },
    {
      id: 'transitional',
      name: 'Transitional',
      description: 'Timeless elegance blending classic and contemporary with premium materials',
      imageUrl: 'https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=600',
      prompt: 'transitional style with shaker cabinets, neutral colors, classic hardware, and timeless design elements'
    },
  ];

  const backyardStyles: StyleOption[] = [
    {
      id: 'modern-zen',
      name: 'Modern Zen',
      description: 'Minimalist design with natural elements',
      imageUrl: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=600',
      prompt: 'modern zen style with clean lines, natural stone, water features, and minimalist landscaping'
    },
    {
      id: 'mediterranean-oasis',
      name: 'Mediterranean Oasis',
      description: 'Warm colors, terracotta, and lush greenery',
      imageUrl: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=600',
      prompt: 'Mediterranean oasis style with terracotta tiles, warm colors, olive trees, and outdoor dining areas'
    },
    {
      id: 'contemporary-outdoor',
      name: 'Contemporary Outdoor',
      description: 'Sleek furniture and modern fire features',
      imageUrl: 'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=600',
      prompt: 'contemporary outdoor style with modern furniture, fire pit, geometric landscaping, and outdoor kitchen'
    },
    {
      id: 'cottage-garden',
      name: 'Cottage Garden',
      description: 'English garden charm with mixed plantings',
      imageUrl: 'https://images.pexels.com/photos/1105019/pexels-photo-1105019.jpeg?auto=compress&cs=tinysrgb&w=600',
      prompt: 'cottage garden style with mixed flower beds, winding paths, arbors, and charming seating areas'
    },
    {
      id: 'tropical-paradise',
      name: 'Tropical Paradise',
      description: 'Lush palms, bamboo, and resort-style features',
      imageUrl: 'https://images.pexels.com/photos/1108701/pexels-photo-1108701.jpeg?auto=compress&cs=tinysrgb&w=600',
      prompt: 'tropical paradise style with palm trees, bamboo features, tiki elements, and resort-style pool area'
    },
    {
      id: 'rustic-farmhouse',
      name: 'Rustic Farmhouse',
      description: 'Weathered wood, vintage elements, and herb gardens',
      imageUrl: 'https://images.pexels.com/photos/1105019/pexels-photo-1105019.jpeg?auto=compress&cs=tinysrgb&w=600',
      prompt: 'rustic farmhouse style with weathered wood, vintage elements, herb gardens, and country charm'
    }
  ];

  const styles = roomType === 'kitchen' ? kitchenStyles : backyardStyles;

  const handleStyleClick = (style: StyleOption) => {
    setSelectedStyle(style);
  };

  const handleContinue = () => {
    if (showCustomPrompt && customPrompt.trim()) {
      onCustomStyleSelected(customPrompt, selectedBaseStyle);
    } else if (selectedStyle) {
      onStyleSelected(selectedStyle);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full relative max-h-[90vh] overflow-y-auto">
        <div className="p-6">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-gray-900 mb-2">
            Choose a Design Style
          </h3>
          <p className="text-xl text-gray-600">
            Select the style for your {selectedAIEngine === 'architectural-vision-engine' ? 'Architectural Vision Engine' : 'StructuralDesign AI'} {roomType} transformation
          </p>
        </div>

        {/* Selected AI Engine Display */}
        <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${aiEngines.find(e => e.id === selectedAIEngine)?.color} rounded-full flex items-center justify-center text-white`}>
              {aiEngines.find(e => e.id === selectedAIEngine)?.icon}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">
                Using: {aiEngines.find(e => e.id === selectedAIEngine)?.name}
              </h4>
              <p className="text-sm text-gray-600">
                {aiEngines.find(e => e.id === selectedAIEngine)?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Style Grid */}
        {!showCustomPrompt ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {styles.map((style) => (
              <div
                key={style.id}
                onClick={() => handleStyleClick(style)}
                className={`relative cursor-pointer group transition-all duration-300 ${
                  selectedStyle?.id === style.id
                    ? 'ring-4 ring-blue-500 ring-offset-2'
                    : 'hover:ring-2 hover:ring-blue-300 hover:ring-offset-1'
                }`}
              >
                <div className="relative overflow-hidden rounded-xl bg-gray-100">
                  <img
                    src={style.imageUrl}
                    alt={style.name}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h4 className="text-lg font-semibold mb-1">{style.name}</h4>
                      <p className="text-sm text-white/90">{style.description}</p>
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {selectedStyle?.id === style.id && (
                    <div className="absolute top-3 right-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>
            ))}
            
            {/* Custom Style Option */}
            <div
              onClick={() => setShowCustomPrompt(true)}
              className="relative cursor-pointer group transition-all duration-300 hover:ring-2 hover:ring-purple-300 hover:ring-offset-1"
            >
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 h-48 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-white">✨</span>
                  </div>
                  <h4 className="text-lg font-semibold text-purple-800 mb-1">Custom Style</h4>
                  <p className="text-sm text-purple-600">Describe your own vision</p>
                </div>
                <div className="absolute inset-0 bg-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Describe Your Custom Style</h4>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Style (Optional)
                </label>
                <select
                  value={selectedBaseStyle}
                  onChange={(e) => setSelectedBaseStyle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                >
                  <option value="">No base style</option>
                  {styles.map((style) => (
                    <option key={style.id} value={style.id}>{style.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Choose a base style to combine with your custom requirements</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Requirements
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Describe your vision... (e.g., 'Add warm wood accents, brass fixtures, and emerald green cabinets with marble countertops')"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">Be specific about colors, materials, fixtures, and design elements you want</p>
              </div>
              
              <button
                onClick={() => {
                  setShowCustomPrompt(false);
                  setCustomPrompt('');
                  setSelectedBaseStyle('');
                }}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back to preset styles
              </button>
            </div>
          </div>
        )}

        {/* Continue Button */}
        <div className="flex justify-center pt-4 pb-2">
          <button
            onClick={handleContinue}
            disabled={!selectedStyle && (!showCustomPrompt || !customPrompt.trim())}
            className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {showCustomPrompt && customPrompt.trim() 
              ? 'Continue with Custom Style'
              : selectedStyle 
                ? `Continue with ${selectedStyle.name}` 
                : 'Select a Style to Continue'
            }
          </button>
        </div>

        {/* Popular Styles Indicator */}
        <div className="mt-4 text-center pb-2">
          <p className="text-sm text-gray-500">
            💡 Most popular in MetroWest: {roomType === 'kitchen' ? 'Modern Minimalist & Farmhouse Chic' : 'Modern Zen & Mediterranean Oasis'}
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default StyleSelectionModal;