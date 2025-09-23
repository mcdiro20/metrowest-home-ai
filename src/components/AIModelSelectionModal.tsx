import React, { useState } from 'react';
import { X, Zap } from 'lucide-react';
import { aiEngines } from '../utils/aiEngines.tsx';

interface AIModelSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModelSelected: (aiEngine: string) => void;
  roomType: string;
}

const AIModelSelectionModal: React.FC<AIModelSelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onModelSelected,
  roomType 
}) => {
  const [selectedAIEngine, setSelectedAIEngine] = useState<string>('structural-design-ai');


  const handleContinue = () => {
    if (selectedAIEngine) {
      onModelSelected(selectedAIEngine);
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
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">
            Choose Your AI Engine
          </h3>
          <p className="text-xl text-gray-600">
            Select the AI technology to transform your {roomType}
          </p>
        </div>

        {/* AI Engine Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {aiEngines.map((engine) => (
            <div
              key={engine.id}
              onClick={() => setSelectedAIEngine(engine.id)}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                selectedAIEngine === engine.id
                  ? `${engine.borderColor} ${engine.bgColor} shadow-lg`
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-center">
                <div className={`w-16 h-16 bg-gradient-to-br ${engine.color} rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg`}>
                  {engine.icon}
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  {engine.name}
                </h4>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  {engine.description}
                </p>
                
                {/* Features List */}
                <div className="space-y-2">
                  {engine.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Selection Indicator */}
                {selectedAIEngine === engine.id && (
                  <div className="mt-4 flex items-center justify-center">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={handleContinue}
            disabled={!selectedAIEngine}
            className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedAIEngine 
              ? `Continue with ${aiEngines.find(e => e.id === selectedAIEngine)?.name}` 
              : 'Select an AI Engine to Continue'
            }
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">
                AI Engine Selection
              </h4>
              <p className="text-blue-800 text-sm">
                Each AI engine has different strengths. StructuralDesign AI is great for preserving your existing layout, 
                while Architectural Vision Engine provides premium architectural photography quality.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIModelSelectionModal;