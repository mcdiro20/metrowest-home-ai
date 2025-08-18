export interface TownData {
  slug: string;
  name: string;
  state: string;
  zipCodes: string[];
  population: string;
  avgHomeValue: string;
  popularStyles: string[];
  heroHeadline: string;
  heroDescription: string;
  ctaFormHeadline: string;
  ctaFormDescription: string;
  howItWorksHeadline: string;
  howItWorksDescription: string;
  exampleDesignsHeadline: string;
  exampleDesignsDescription: string;
  localInsightsHeadline: string;
  localInsightsDescription: string;
  faqData: { question: string; answer: string; }[];
  footerCtaHeadline: string;
  footerCtaDescription: string;
  uniqueSellingPoints: string[];
  localArchitecturalStyles: { name: string; description: string; imageUrl: string; }[];
  localRenovationTrends: { title: string; description: string; }[];
  localTestimonials: { quote: string; author: string; }[];
}

export const towns: TownData[] = [
  {
    slug: 'framingham',
    name: 'Framingham',
    state: 'MA',
    zipCodes: ['01701', '01702'],
    population: '72,000',
    avgHomeValue: '$485,000',
    popularStyles: ['Modern Farmhouse', 'Colonial Revival', 'Contemporary'],
    heroHeadline: 'AI Home Renovations for Framingham, MA',
    heroDescription: 'See your Framingham home transformed in minutes with AI-powered renovation designs. Upload a photo, get professional-quality before/after images, and connect with local contractors to make it real.',
    ctaFormHeadline: 'Get Your Free AI Renovation Design',
    ctaFormDescription: 'Upload a photo of your Framingham home and see it transformed in minutes',
    howItWorksHeadline: 'How AI Home Renovations Work in Framingham',
    howItWorksDescription: 'Transform your Framingham home in three simple steps with our advanced AI technology',
    exampleDesignsHeadline: 'Example AI Designs for Framingham Homes',
    exampleDesignsDescription: 'See how our AI transforms real Framingham homes with popular renovation styles',
    localInsightsHeadline: 'Local Renovation Insights – Framingham, MA',
    localInsightsDescription: 'Understanding renovation trends and costs in your Framingham neighborhood. Try our AI design tool to see your home\'s potential.',
    faqData: [
      {
        question: 'How does AI home renovation work in Framingham, MA?',
        answer: 'Our AI technology analyzes your Framingham home\'s photos and creates photorealistic renovation designs in minutes. Simply upload a photo of your kitchen, bathroom, or living space, choose your preferred style, and our AI generates professional-quality before/after images showing your potential renovation.'
      },
      {
        question: 'Are the AI renovation designs realistic for Framingham homes?',
        answer: 'Yes! Our AI is trained on thousands of real renovations and understands Framingham\'s architectural styles, from Colonial Revival to Modern Farmhouse. The designs respect your home\'s existing structure while showing achievable improvements using materials and styles popular in the Framingham area.'
      },
      {
        question: 'Can you connect me with contractors in Framingham to make these renovations real?',
        answer: 'Absolutely! We partner with licensed, insured contractors throughout Framingham and the greater MetroWest area. After you see your AI design, we can connect you with pre-vetted local professionals who can provide quotes and bring your vision to life.'
      },
      {
        question: 'What renovation styles are most popular in Framingham?',
        answer: 'Framingham homeowners love Modern Farmhouse kitchens that blend rustic charm with contemporary functionality, Colonial Revival updates that honor the town\'s historic character, and Contemporary designs that maximize space in smaller homes. Our AI can show you all these styles applied to your specific space.'
      },
      {
        question: 'How much do kitchen renovations typically cost in Framingham?',
        answer: 'Kitchen renovations in Framingham typically range from $35,000 to $75,000 depending on size and finishes. Our AI designs help you visualize different price points - from budget-friendly updates with painted cabinets and new hardware to luxury renovations with custom cabinetry and premium appliances.'
      }
    ],
    footerCtaHeadline: 'Ready to Transform Your Framingham Home?',
    footerCtaDescription: 'Join thousands of Framingham homeowners who\'ve discovered their home\'s potential with AI-powered renovation designs. Get started free today.',
    uniqueSellingPoints: [
      'Historic homes with modern upgrade potential',
      'Strong resale values in MetroWest market',
      'Mix of architectural styles from Colonial to Contemporary',
      'Active community of home improvement enthusiasts'
    ],
    localArchitecturalStyles: [
      {
        name: 'Colonial Revival',
        description: 'Classic New England charm with symmetrical facades, multi-pane windows, and traditional proportions. Perfect for kitchen updates that honor historical character.',
        imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80'
      },
      {
        name: 'Modern Farmhouse',
        description: 'Blend of rustic elements with contemporary functionality. Popular for open-concept kitchen renovations with shaker cabinets and farmhouse sinks.',
        imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=600&q=80'
      },
      {
        name: 'Contemporary Ranch',
        description: 'Single-story homes with clean lines and open floor plans. Ideal for kitchen islands and modern appliance integration.',
        imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80'
      }
    ],
    localRenovationTrends: [
      {
        title: 'Open Concept Living',
        description: 'Framingham homeowners are removing walls between kitchens and living areas to create flowing, family-friendly spaces perfect for entertaining.'
      },
      {
        title: 'Historic Preservation Updates',
        description: 'Maintaining original architectural details while adding modern amenities like updated electrical, plumbing, and energy-efficient windows.'
      },
      {
        title: 'Outdoor Living Spaces',
        description: 'Converting backyards into year-round entertainment areas with fire pits, outdoor kitchens, and covered patios.'
      },
      {
        title: 'Smart Home Integration',
        description: 'Adding smart thermostats, lighting controls, and security systems while preserving the home\'s traditional aesthetic.'
      }
    ],
    localTestimonials: [
      {
        quote: 'The AI showed us exactly how our 1950s ranch could look with a modern kitchen. We loved it so much we hired a contractor the same week!',
        author: 'Sarah M., Framingham'
      },
      {
        quote: 'As first-time homeowners in Framingham, the AI designs helped us understand what was possible within our budget.',
        author: 'Mike & Lisa T., Framingham'
      }
    ]
  },
  {
    slug: 'natick',
    name: 'Natick',
    state: 'MA',
    zipCodes: ['01760'],
    population: '37,000',
    avgHomeValue: '$525,000',
    popularStyles: ['Transitional', 'Modern Minimalist', 'Coastal New England'],
    heroHeadline: 'AI Home Renovations for Natick, MA',
    heroDescription: 'Transform your Natick home with AI-powered design technology. From lakefront properties to downtown condos, see your space reimagined with professional-quality renderings in minutes.',
    ctaFormHeadline: 'Discover Your Natick Home\'s Potential',
    ctaFormDescription: 'Upload a photo of your Natick home and explore renovation possibilities',
    howItWorksHeadline: 'How AI Renovations Work for Natick Homes',
    howItWorksDescription: 'Experience the future of home design with AI technology tailored to Natick\'s unique architectural landscape',
    exampleDesignsHeadline: 'Natick Home Transformation Examples',
    exampleDesignsDescription: 'Real Natick homes transformed with AI - from lakefront kitchens to downtown bathroom renovations',
    localInsightsHeadline: 'Natick Real Estate & Renovation Market',
    localInsightsDescription: 'Local insights on renovation costs, popular styles, and home values in Natick\'s competitive real estate market.',
    faqData: [
      {
        question: 'What makes Natick homes unique for AI renovation design?',
        answer: 'Natick\'s diverse housing stock includes everything from lakefront properties to historic downtown homes and modern condos. Our AI understands these different architectural contexts and can suggest renovations that enhance each property type\'s unique character and market appeal.'
      },
      {
        question: 'Are renovation costs higher in Natick compared to other MetroWest towns?',
        answer: 'Natick renovation costs are typically 10-15% higher than the MetroWest average due to the town\'s desirable location and strong property values. However, renovations also tend to provide excellent ROI, especially kitchen and bathroom updates that appeal to the town\'s professional demographic.'
      },
      {
        question: 'What renovation styles work best for Natick\'s lakefront properties?',
        answer: 'Lakefront homes in Natick benefit from Coastal New England and Transitional styles that maximize water views and natural light. Our AI can show you how to create seamless indoor-outdoor living spaces that take advantage of your waterfront location.'
      }
    ],
    footerCtaHeadline: 'Ready to Enhance Your Natick Home?',
    footerCtaDescription: 'Join Natick homeowners who are maximizing their property values with AI-powered renovation planning.',
    uniqueSellingPoints: [
      'Lakefront and waterfront renovation opportunities',
      'High property values with strong ROI potential',
      'Mix of historic and contemporary architecture',
      'Proximity to Boston with suburban charm'
    ],
    localArchitecturalStyles: [
      {
        name: 'Lakefront Contemporary',
        description: 'Modern designs that maximize water views with large windows, open floor plans, and seamless indoor-outdoor transitions.',
        imageUrl: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=600&q=80'
      },
      {
        name: 'Historic Downtown',
        description: 'Charming older homes near Natick Center with original details that benefit from thoughtful modern updates.',
        imageUrl: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=600&q=80'
      }
    ],
    localRenovationTrends: [
      {
        title: 'Water View Maximization',
        description: 'Opening up kitchens and living areas to take advantage of lake and pond views throughout Natick.'
      },
      {
        title: 'Luxury Finishes',
        description: 'High-end materials and appliances that match Natick\'s upscale market expectations.'
      }
    ],
    localTestimonials: [
      {
        quote: 'The AI helped us visualize how to open up our lakefront kitchen to showcase the water view. The renovation increased our home value significantly.',
        author: 'Jennifer K., Natick'
      }
    ]
  },
  {
    slug: 'wellesley',
    name: 'Wellesley',
    state: 'MA',
    zipCodes: ['02481', '02482'],
    population: '29,000',
    avgHomeValue: '$1,200,000',
    popularStyles: ['Traditional Luxury', 'Contemporary Luxe', 'Colonial Revival'],
    heroHeadline: 'Luxury AI Home Renovations for Wellesley, MA',
    heroDescription: 'Elevate your Wellesley home with AI-powered luxury renovation designs. From grand colonials to contemporary estates, visualize premium transformations that match Wellesley\'s prestigious standards.',
    ctaFormHeadline: 'Design Your Luxury Wellesley Renovation',
    ctaFormDescription: 'Experience premium AI design technology for your distinguished Wellesley home',
    howItWorksHeadline: 'Premium AI Design Process for Wellesley Homes',
    howItWorksDescription: 'Sophisticated AI technology meets Wellesley\'s exacting standards for luxury home renovation',
    exampleDesignsHeadline: 'Luxury Wellesley Home Transformations',
    exampleDesignsDescription: 'Premium AI renovations showcasing the elegance and sophistication expected in Wellesley',
    localInsightsHeadline: 'Wellesley Luxury Home Market Insights',
    localInsightsDescription: 'Understanding the premium renovation market in one of Massachusetts\' most prestigious communities.',
    faqData: [
      {
        question: 'How does AI design work for luxury Wellesley homes?',
        answer: 'Our AI is specifically trained on high-end renovations and understands the luxury finishes, premium materials, and sophisticated design elements expected in Wellesley. From custom millwork to designer appliances, our AI creates renovations that meet the town\'s prestigious standards.'
      },
      {
        question: 'What\'s the typical investment for a luxury kitchen renovation in Wellesley?',
        answer: 'Luxury kitchen renovations in Wellesley typically range from $75,000 to $150,000+, featuring custom cabinetry, premium stone countertops, high-end appliances, and designer lighting. Our AI helps you visualize different luxury options to make informed investment decisions.'
      },
      {
        question: 'Can the AI design work with Wellesley\'s historic home restrictions?',
        answer: 'Yes! Our AI understands Wellesley\'s historic district guidelines and can suggest renovations that preserve architectural integrity while adding modern luxury amenities. We focus on interior transformations that enhance your home\'s character and value.'
      }
    ],
    footerCtaHeadline: 'Elevate Your Wellesley Home',
    footerCtaDescription: 'Join discerning Wellesley homeowners who trust AI technology for luxury renovation planning.',
    uniqueSellingPoints: [
      'Luxury market with premium renovation expectations',
      'Historic homes requiring sophisticated updates',
      'High-end finishes and custom design elements',
      'Strong resale values justify premium investments'
    ],
    localArchitecturalStyles: [
      {
        name: 'Grand Colonial',
        description: 'Stately homes with formal layouts, crown molding, and traditional proportions that benefit from luxury kitchen and bathroom updates.',
        imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80'
      },
      {
        name: 'Contemporary Estate',
        description: 'Modern luxury homes with open floor plans, high ceilings, and premium finishes throughout.',
        imageUrl: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=600&q=80'
      }
    ],
    localRenovationTrends: [
      {
        title: 'Gourmet Kitchen Upgrades',
        description: 'Professional-grade appliances, custom cabinetry, and luxury stone surfaces for serious home chefs.'
      },
      {
        title: 'Spa-Like Master Bathrooms',
        description: 'Luxury bathroom suites with soaking tubs, walk-in showers, and premium tile work.'
      }
    ],
    localTestimonials: [
      {
        quote: 'The AI captured exactly the level of sophistication we wanted for our Wellesley kitchen renovation. The results exceeded our expectations.',
        author: 'Robert & Catherine L., Wellesley'
      }
    ]
  }
];

export const getTownBySlug = (slug: string): TownData | undefined => {
  return towns.find(town => town.slug === slug);
};

export const getAllTownSlugs = (): string[] => {
  return towns.map(town => town.slug);
};