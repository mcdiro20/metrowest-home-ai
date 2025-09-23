import { Cpu, Award, Zap } from 'lucide-react';

export interface AIEngine {
  id: string;
  name: string;
  description: string;
  features: string[];
  icon: JSX.Element;
  color: string;
  borderColor: string;
  bgColor: string;
}

export const aiEngines: AIEngine[] = [
  {
    id: 'structural-design-ai',
    name: 'StructuralDesign AI',
    description: 'Layout-preserving renovations that maintain your existing room structure',
    features: ['Preserves room layout', 'Maintains architectural features', 'Fast processing'],
    icon: <Cpu className="w-8 h-8" />,
    color: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'architectural-vision-engine',
    name: 'Architectural Vision Engine',
    description: 'Premium architectural quality with museum-grade finishes',
    features: ['Premium materials', 'Architectural photography quality', 'Luxury finishes'],
    icon: <Award className="w-8 h-8" />,
    color: 'from-purple-500 to-purple-600',
    borderColor: 'border-purple-500',
    bgColor: 'bg-purple-50'
  }
];