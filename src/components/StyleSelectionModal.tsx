import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

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
  roomType: string;
}

const StyleSelectionModal: React.FC<StyleSelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onStyleSelected,
  roomType 
}) => {
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null);

  const kitchenStyles: StyleOption[] = [
    {
      id: 'modern-minimalist',
      name: 'Modern Minimalist',
      description: 'Clean lines, hidden handles, sleek surfaces',
      imageUrl: 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=600',
      prompt: 'modern minimalist style with clean white cabinets, hidden handles, quartz countertops, and sleek stainless steel appliances'
    },
    {
      id: 'farmhouse-chic',
      name: 'Farmhouse Chic',
      description: 'Rustic charm with open shelving and vintage touches',
      imageUrl: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600',
      prompt: 'farmhouse chic style with white shaker cabinets, open wood shelving, farmhouse sink, and vintage lighting fixtures'
    },
    {
      id: 'transitional',
      name: 'Transitional',
      description: 'Classic meets contemporary in neutral tones',
      imageUrl: 'https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=600',
      prompt: 'transitional style with shaker cabinets, neutral colors, classic hardware, and timeless design elements'
    },
    {
      id: 'coastal-new-england',
      name: 'Coastal New England',
      description: 'Light blues, beadboard, and natural textures',
      imageUrl: 'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=600',
      prompt: 'coastal New England style with light blue accents, white beadboard, natural wood elements, and nautical touches'
    },
    {
      id: 'contemporary-luxe',
      name: 'Contemporary Luxe',
      description: 'High-end finishes with waterfall islands and gold accents',
      imageUrl: 'https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=600',
      prompt: 'contemporary luxe style with dark cabinetry, waterfall marble island, gold fixtures, and high-end appliances'
    },
    {
      id: 'eclectic-bohemian',
      name: 'Eclectic Bohemian',
      description: 'Colorful patterns, plants, and layered textures',
      imageUrl: 'https://images.pexels.com/photos/1599791/pexels-photo-1599791.jpeg?auto=compress&cs=tinysrgb&w=600',
      prompt: 'eclectic bohemian style with colorful patterned tiles, open shelving with plants, mixed textures, and artistic elements'
    }
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
    if (selectedStyle) {
      onStyleSelected(selectedStyle);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-gray-900 mb-2">
            Choose a Design Style
          </h3>
          <p className="text-xl text-gray-600">
            Select the style you'd like to see in your reimagined {roomType}
          </p>
        </div>

        {/* Style Grid */}
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
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!selectedStyle}
            className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedStyle ? `Continue with ${selectedStyle.name}` : 'Select a Style to Continue'}
          </button>
        </div>

        {/* Popular Styles Indicator */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            💡 Most popular in MetroWest: {roomType === 'kitchen' ? 'Modern Minimalist & Farmhouse Chic' : 'Modern Zen & Mediterranean Oasis'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StyleSelectionModal;