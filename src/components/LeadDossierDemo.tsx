import React from 'react';
import LeadDossier from './LeadDossier';

const LeadDossierDemo: React.FC = () => {
  const sampleLeadData = {
    name: "Sarah Johnson",
    address: "45 Elm Street, Concord, MA",
    zipCode: "01742",
    homeValue: 875000,
    budget: 120000,
    zipIncomeTier: "High" as const,
    intentScore: "High" as const,
    engagementScore: 92,
    intentScoreValue: 88,
    leadQualityScore: 95,
    probabilityToCloseScore: 85,
    beforeImage: "https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=800",
    afterImage: "https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=800",
    contractorNotes: "High-value lead with clear renovation vision. Prefers modern minimalist style with premium finishes. Budget allows for luxury appliances and custom cabinetry. Timeline is flexible but wants to start within 3 months."
  };

  const sampleLeadData2 = {
    name: "Michael Chen",
    address: "128 Oak Avenue, Framingham, MA",
    zipCode: "01701",
    homeValue: 485000,
    budget: 65000,
    zipIncomeTier: "Medium" as const,
    intentScore: "Medium" as const,
    engagementScore: 58,
    intentScoreValue: 72,
    leadQualityScore: 68,
    probabilityToCloseScore: 45,
    beforeImage: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800",
    afterImage: "https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=800"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Lead Dossier Component</h1>
          <p className="text-xl text-gray-600">Premium customer profile cards for home renovation leads</p>
        </div>

        {/* High Intent Lead */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">High Intent Lead</h2>
          <LeadDossier {...sampleLeadData} />
        </div>

        {/* Medium Intent Lead */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Medium Intent Lead</h2>
          <LeadDossier {...sampleLeadData2} />
        </div>
      </div>
    </div>
  );
};

export default LeadDossierDemo;