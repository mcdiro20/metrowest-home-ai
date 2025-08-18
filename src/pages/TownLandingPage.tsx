import React from 'react';
import { Link } from 'react-router-dom';

interface TownLandingPageProps {
  town: string;
}

const TownLandingPage: React.FC<TownLandingPageProps> = ({ town }) => {
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 text-white py-6">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            MetroWest Home AI – {town} Home Renovations
          </h1>
          <nav className="space-x-4">
            <Link to="/" className="hover:text-gray-300">
              Home
            </Link>
            <Link to="/about" className="hover:text-gray-300">
              About
            </Link>
            <Link to="/contact" className="hover:text-gray-300">
              Contact
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white py-12 border-b">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Transform Your {town} Home with AI-Powered Renovations
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            See how your home could look with professional renovations —
            instantly generated with advanced AI, and get connected to top local contractors.
          </p>
          <Link
            to="/try-ai"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try AI Renovation Now
          </Link>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="bg-gray-100 py-12">
        <div className="container mx-auto px-6">
          <h3 className="text-2xl font-bold mb-4">
            Why Choose MetroWest Home AI for Your {town} Renovation?
          </h3>
          <p className="text-gray-700 mb-6">
            At MetroWest Home AI, we specialize in helping {town} homeowners
            visualize stunning, realistic renovations for kitchens, bathrooms,
            basements, and more — all before committing to a contractor.
            Our AI ensures the designs match your existing architecture
            while giving you a fresh, modern look.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>AI-generated, photorealistic renovation previews</li>
            <li>Connect with vetted {town} contractors</li>
            <li>Save time and avoid costly design mistakes</li>
            <li>Perfect for kitchens, bathrooms, living rooms, and exteriors</li>
          </ul>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-blue-50 py-12 border-t border-b border-blue-200">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-2xl font-bold mb-4">
            Ready to See Your {town} Home Transformed?
          </h3>
          <p className="text-gray-700 mb-6">
            Upload a photo of your space, choose a style, and let our AI
            create a breathtaking renovation concept for you — free to try.
          </p>
          <Link
            to="/try-ai"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Your Free AI Renovation
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 mt-12">
        <div className="container mx-auto px-6 py-8 text-center">
          <p>
            &copy; 2024 MetroWest Home AI. All rights reserved. |{' '}
            <Link to="/" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>{' '}
            |{' '}
            <Link to="/" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TownLandingPage;
