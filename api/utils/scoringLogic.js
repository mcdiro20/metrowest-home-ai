// Lead Scoring Logic - Your "Secret Sauce"
// This contains the proprietary algorithms for calculating lead intelligence scores

// ZIP Code tier analysis for MetroWest MA
const ZIP_CODE_TIERS = {
  high: ['02481', '02482', '01742', '02467', '02468', '02459', '02460'], // Wellesley, Concord, Brookline, Newton
  medium: ['01701', '01702', '01760', '01778', '01776', '02030', '02032'], // Framingham, Natick, Wayland, Sudbury
  standard: ['01720', '01721', '01730', '01731', '01740', '01741', '01746'] // Acton, Ashland, Bolton, Hudson
};

// Project type value multipliers
const PROJECT_TYPE_VALUES = {
  kitchen: 1.2,      // Highest value projects
  bathroom: 1.1,     // High value
  living_room: 1.0,  // Standard
  bedroom: 0.9,      // Lower value
  dining_room: 0.95, // Lower value
  home_office: 0.85, // Lowest value
  other: 0.8
};

// Style preference value indicators
const STYLE_VALUE_INDICATORS = {
  'contemporary-luxe': 1.3,    // Highest budget indicator
  'modern-minimalist': 1.2,    // High budget
  'transitional': 1.1,         // Medium-high budget
  'farmhouse-chic': 1.0,       // Standard budget
  'coastal-new-england': 1.0,  // Standard budget
  'eclectic-bohemian': 0.9     // Variable budget
};

export function calculateEngagementScore(profileData, leadData) {
  let score = 0;
  
  // Login frequency (max 25 points)
  const loginCount = profileData?.login_count || 0;
  score += Math.min(loginCount * 5, 25);
  
  // Time on site (max 30 points) - convert ms to minutes
  const timeOnSiteMinutes = (profileData?.total_time_on_site_ms || 0) / (60 * 1000);
  score += Math.min(timeOnSiteMinutes, 30);
  
  // AI renderings count (max 40 points)
  const totalRenderings = profileData?.ai_renderings_count || leadData?.render_count || 1;
  score += Math.min(totalRenderings * 10, 40);
  
  // Repeat visitor bonus
  if (leadData?.is_repeat_visitor) {
    score += 5;
  }
  
  return Math.min(Math.round(score), 100);
}

export function calculateIntentScore(leadData) {
  let score = 0;
  
  // Base score for completing AI render
  score += 10;
  
  // Contact information provided
  if (leadData?.email) score += 15;
  if (leadData?.phone) score += 20;
  if (leadData?.name) score += 10;
  
  // Strongest intent signal
  if (leadData?.wants_quote) score += 30;
  
  // Multiple renders indicate serious consideration
  const renderCount = leadData?.render_count || 1;
  if (renderCount > 1) {
    score += Math.min((renderCount - 1) * 5, 15);
  }
  
  // Social engagement
  if (leadData?.social_engaged) score += 10;
  
  return Math.min(Math.round(score), 100);
}

export function calculateLeadQualityScore(intentScore, leadData) {
  let score = 0;
  
  // Intent score forms the base (60% weight)
  score += intentScore * 0.6;
  
  // ZIP code tier analysis (max 25 points)
  const zipCode = leadData?.zip;
  if (zipCode) {
    if (ZIP_CODE_TIERS.high.includes(zipCode)) {
      score += 25; // High-value area
    } else if (ZIP_CODE_TIERS.medium.includes(zipCode)) {
      score += 15; // Medium-value area
    } else {
      score += 5; // Standard MetroWest area
    }
  }
  
  // Project type value indicator (max 10 points)
  const projectType = leadData?.room_type;
  if (projectType && PROJECT_TYPE_VALUES[projectType]) {
    score += (PROJECT_TYPE_VALUES[projectType] - 0.8) * 50; // Scale to 0-10 points
  }
  
  // Style preference budget indicator (max 5 points)
  const style = leadData?.style?.toLowerCase().replace(/\s+/g, '-');
  if (style && STYLE_VALUE_INDICATORS[style]) {
    score += (STYLE_VALUE_INDICATORS[style] - 0.9) * 12.5; // Scale to 0-5 points
  }
  
  return Math.min(Math.round(score), 100);
}

export function calculateProbabilityToCloseScore(engagementScore, intentScore, leadQualityScore, leadStatus, leadCreatedAt) {
  let score = 0;
  
  // Weighted combination of other scores (90% of final score)
  score += engagementScore * 0.2;  // 20% weight
  score += intentScore * 0.4;      // 40% weight - most important
  score += leadQualityScore * 0.3; // 30% weight
  
  // Status bonuses/penalties
  switch (leadStatus) {
    case 'contacted':
      score += 5;
      break;
    case 'quoted':
      score += 10;
      break;
    case 'converted':
      score = 100; // Already converted
      break;
    case 'dead':
    case 'unqualified':
      score = 0; // No probability
      break;
  }
  
  // Time decay penalty (leads get stale)
  if (leadCreatedAt) {
    const ageInDays = (new Date() - new Date(leadCreatedAt)) / (1000 * 60 * 60 * 24);
    
    if (ageInDays > 7 && leadStatus === 'new') {
      score -= 10; // Uncontacted leads lose value
    }
    if (ageInDays > 30) {
      score -= 15; // Additional penalty for very old leads
    }
    if (ageInDays > 90) {
      score -= 25; // Significant penalty for ancient leads
    }
  }
  
  return Math.max(0, Math.min(Math.round(score), 100));
}

// Helper function to get ZIP code tier
export function getZipCodeTier(zipCode) {
  if (ZIP_CODE_TIERS.high.includes(zipCode)) return 'High';
  if (ZIP_CODE_TIERS.medium.includes(zipCode)) return 'Medium';
  return 'Standard';
}

// Helper function to calculate overall lead score (for sorting/prioritization)
export function calculateOverallLeadScore(engagementScore, intentScore, leadQualityScore, probabilityToCloseScore) {
  // Weighted average with emphasis on probability to close
  return Math.round(
    engagementScore * 0.15 +
    intentScore * 0.25 +
    leadQualityScore * 0.25 +
    probabilityToCloseScore * 0.35
  );
}

// Advanced scoring function that can be enhanced with ML in the future
export function calculateAdvancedScores(profileData, leadData) {
  const engagementScore = calculateEngagementScore(profileData, leadData);
  const intentScore = calculateIntentScore(leadData);
  const leadQualityScore = calculateLeadQualityScore(intentScore, leadData);
  const probabilityToCloseScore = calculateProbabilityToCloseScore(
    engagementScore, 
    intentScore, 
    leadQualityScore, 
    leadData?.status || 'new', 
    leadData?.created_at
  );
  
  return {
    engagement_score: engagementScore,
    intent_score: intentScore,
    lead_quality_score: leadQualityScore,
    probability_to_close_score: probabilityToCloseScore,
    overall_score: calculateOverallLeadScore(engagementScore, intentScore, leadQualityScore, probabilityToCloseScore)
  };
}