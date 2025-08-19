import React from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Mail, 
  MapPin, 
  Home, 
  DollarSign, 
  TrendingUp,
  Clock,
  Upload,
  Zap,
  Eye,
  User,
  FileText
} from 'lucide-react';

interface LeadDossierProps {
  name: string;
  profilePhoto?: string;
  address: string;
  zipCode: string;
  homeValue: number;
  budget: number;
  zipIncomeTier: 'High' | 'Medium' | 'Low';
  intentScore: 'High' | 'Medium' | 'Low';
  engagementScore: number; // 1-100
  intentScoreValue: number; // 1-100 (renamed to avoid conflict with existing intentScore)
  leadQualityScore: number; // 1-100
  probabilityToCloseScore: number; // 1-100
  beforeImage?: string;
  afterImage?: string;
  contractorNotes?: string;
  onExportPDF?: () => void;
  onEmailContractor?: () => void;
  onAssignToPartner?: () => void;
}

const LeadDossier: React.FC<LeadDossierProps> = ({
  name,
  profilePhoto,
  address,
  zipCode,
  homeValue,
  budget,
  zipIncomeTier,
  intentScore,
  engagementScore,
  intentScoreValue,
  leadQualityScore,
  probabilityToCloseScore,
  beforeImage,
  afterImage,
  contractorNotes,
  onExportPDF = () => console.log('Export PDF clicked'),
  onEmailContractor = () => console.log('Email contractor clicked'),
  onAssignToPartner = () => console.log('Assign to partner clicked')
}) => {
  const getIntentScoreColor = (score: string) => {
    switch (score) {
      case 'High':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Low':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getIncomeTierColor = (tier: string) => {
    switch (tier) {
      case 'High':
        return 'text-emerald-600';
      case 'Medium':
        return 'text-amber-600';
      case 'Low':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreLevel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getOverallScore = () => {
    // Weighted average of all scores
    const weighted = (
      engagementScore * 0.2 +
      intentScoreValue * 0.4 +
      leadQualityScore * 0.2 +
      probabilityToCloseScore * 0.2
    );
    return Math.round(weighted);
  };

  const overallScore = getOverallScore();

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="bg-gradient-to-r from-gray-50 to-gray-100/50 px-8 py-6 border-b border-gray-100"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Profile Photo or Initials */}
            <div className="relative">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={name}
                  className="w-16 h-16 rounded-2xl object-cover shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-sm">
                  <span className="text-white font-semibold text-lg">
                    {getInitials(name)}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                <User className="w-3 h-3 text-gray-600" />
              </div>
            </div>

            {/* Name and Intent Score */}
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">{name}</h1>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${getIntentScoreColor(intentScore)}`}>
                <div className={`w-2 h-2 rounded-full ${intentScore === 'High' ? 'bg-emerald-500' : intentScore === 'Medium' ? 'bg-amber-500' : 'bg-gray-400'}`}></div>
                {intentScore} Intent Score
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onExportPDF}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-sm font-medium text-gray-700"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onEmailContractor}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 text-sm font-medium shadow-sm"
            >
              <Mail className="w-4 h-4" />
              Email Contractor
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAssignToPartner}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all duration-200 text-sm font-medium shadow-sm"
            >
              <MapPin className="w-4 h-4" />
              Assign Partner
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Content Grid */}
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Info Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Home className="w-5 h-5 text-gray-600" />
              Property Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Address</p>
                    <p className="text-sm text-gray-900 font-medium">{address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600">{zipCode.slice(-2)}</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Zip Code</p>
                    <p className="text-sm text-gray-900 font-medium">{zipCode}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className={`w-4 h-4 mt-0.5 flex-shrink-0 ${getIncomeTierColor(zipIncomeTier)}`} />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Income Tier</p>
                    <p className={`text-sm font-medium ${getIncomeTierColor(zipIncomeTier)}`}>{zipIncomeTier}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Home className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Home Value</p>
                    <p className="text-sm text-gray-900 font-semibold">{formatCurrency(homeValue)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Budget</p>
                    <p className="text-sm text-gray-900 font-semibold">{formatCurrency(budget)}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Engagement Metrics Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-gray-600" />
              Lead Intelligence Scores
            </h3>
            
            {/* Overall Score - Prominent Display */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getScoreBarColor(overallScore)} shadow-sm`}>
                    <span className="text-white font-bold text-lg">{overallScore}</span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">Overall Lead Score</p>
                    <p className={`text-sm font-medium ${getScoreColor(overallScore)}`}>
                      {getScoreLevel(overallScore)} Quality Lead
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${overallScore}%` }}
                    transition={{ delay: 0.6, duration: 1.2, ease: 'easeOut' }}
                    className={`h-full rounded-full ${getScoreBarColor(overallScore)} shadow-sm`}
                  />
                </div>
              </div>
            </div>
            
            {/* Individual Scores Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Engagement Score */}
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Engagement</span>
                  </div>
                  <span className={`text-lg font-bold ${getScoreColor(engagementScore)}`}>
                    {engagementScore}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${engagementScore}%` }}
                    transition={{ delay: 0.7, duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${getScoreBarColor(engagementScore)}`}
                  />
                </div>
              </div>

              {/* Intent Score */}
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-gray-700">Intent</span>
                  </div>
                  <span className={`text-lg font-bold ${getScoreColor(intentScoreValue)}`}>
                    {intentScoreValue}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${intentScoreValue}%` }}
                    transition={{ delay: 0.8, duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${getScoreBarColor(intentScoreValue)}`}
                  />
                </div>
              </div>

              {/* Lead Quality Score */}
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-gray-700">Quality</span>
                  </div>
                  <span className={`text-lg font-bold ${getScoreColor(leadQualityScore)}`}>
                    {leadQualityScore}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${leadQualityScore}%` }}
                    transition={{ delay: 0.9, duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${getScoreBarColor(leadQualityScore)}`}
                  />
                </div>
              </div>

              {/* Probability to Close Score */}
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-gray-700">Close Prob.</span>
                  </div>
                  <span className={`text-lg font-bold ${getScoreColor(probabilityToCloseScore)}`}>
                    {probabilityToCloseScore}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${probabilityToCloseScore}%` }}
                    transition={{ delay: 1.0, duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${getScoreBarColor(probabilityToCloseScore)}`}
                  />
                </div>
              </div>
            </div>
            
            {/* Score Insights */}
            <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-700 font-medium">
                💡 Lead Intelligence: {getScoreLevel(overallScore)} quality lead with {getScoreLevel(probabilityToCloseScore).toLowerCase()} conversion probability
              </p>
            </div>
          </motion.div>
        </div>

        {/* Renovation Preview Card */}
        {(beforeImage || afterImage) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-gray-600" />
              Renovation Preview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {beforeImage && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="relative group cursor-pointer"
                >
                  <div className="relative overflow-hidden rounded-2xl shadow-sm">
                    <img
                      src={beforeImage}
                      alt="Before renovation"
                      className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                    Before
                  </div>
                </motion.div>
              )}
              {afterImage && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="relative group cursor-pointer"
                >
                  <div className="relative overflow-hidden rounded-2xl shadow-sm">
                    <img
                      src={afterImage}
                      alt="After renovation"
                      className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                    After (AI)
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Notes / Contractor Insights Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            Contractor Insights
          </h3>
          <div className="bg-white rounded-xl p-4 border border-gray-100 min-h-[120px]">
            {contractorNotes ? (
              <p className="text-gray-700 leading-relaxed">{contractorNotes}</p>
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No contractor notes yet</p>
                  <p className="text-xs text-gray-400 mt-1">Add insights about this lead's preferences and requirements</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LeadDossier;