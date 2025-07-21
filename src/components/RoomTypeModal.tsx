import React, { useState } from 'react';
import { X, Home } from 'lucide-react';

interface RoomTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomTypeSelected: (roomType: string) => void;
}

const RoomTypeModal: React.FC<RoomTypeModalProps> = ({ 
  isOpen, 
  onClose, 
  onRoomTypeSelected 
}) => {
  const [selectedRoomType, setSelectedRoomType] = useState<string>('');

  const roomTypes = {
    'kitchen': {
      name: 'Kitchen',
      description: 'Cabinets, countertops, appliances, and cooking spaces',
      icon: '🍳'
    },
    'bathroom': {
      name: 'Bathroom',
      description: 'Vanities, tubs, showers, and bathroom fixtures',
      icon: '🛁'
    },
    'living_room': {
      name: 'Living Room',
      description: 'Seating areas, entertainment centers, and family spaces',
      icon: '🛋️'
    },
    'bedroom': {
      name: 'Bedroom',
      description: 'Sleeping areas, closets, and personal spaces',
      icon: '🛏️'
    },
    'dining_room': {
      name: 'Dining Room',
      description: 'Dining tables, buffets, and formal eating areas',
      icon: '🍽️'
    },
    'home_office': {
      name: 'Home Office',
      description: 'Desks, storage, and work spaces',
      icon: '💻'
    },
    'other': {
      name: 'Other Interior Space',
      description: 'Any other interior room or space',
      icon: '🏠'
    }
  };

  const handleContinue = () => {
    if (selectedRoomType) {
      onRoomTypeSelected(selectedRoomType);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">
            What Type of Room Is This?
          </h3>
          <p className="text-xl text-gray-600">
            Help us understand your space for the best renovation results
          </p>
        </div>

        {/* Room Type Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {Object.entries(roomTypes).map(([key, room]) => (
            <div
              key={key}
              onClick={() => setSelectedRoomType(key)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                selectedRoomType === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{room.icon}</div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">
                    {room.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {room.description}
                  </p>
                </div>
                {selectedRoomType === key && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!selectedRoomType}
            className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedRoomType ? `Continue with ${roomTypes[selectedRoomType as keyof typeof roomTypes]?.name}` : 'Select a Room Type to Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomTypeModal;