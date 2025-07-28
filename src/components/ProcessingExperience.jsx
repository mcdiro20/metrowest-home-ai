import React, { useState, useEffect } from 'react';
import { Sparkles, Clock } from 'lucide-react';

export default function ProcessingExperience({ userEmail, selectedStyle }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes

  const steps = [
    "Analyzing architectural elements with AI precision...",
    "Preserving exact layout while selecting luxury materials...",
    "Applying $5,000 professional rendering techniques...",
    "Adding cinematic lighting and ray-traced reflections...",
    "Finalizing your magazine-quality renovation portfolio..."
  ];

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 2000);

    const countdownInterval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearInterval(stepInterval);
      clearInterval(countdownInterval);
    };
  }, []);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="processing-container">
      <div className="processing-header">
        <Sparkles className="sparkle-icon animate-pulse" size={48} />
        <h1>Creating Your Professional {selectedStyle} Kitchen</h1>
        <p>Our AI architects are designing your dream renovation</p>
      </div>

      <div className="processing-steps">
        {steps.map((step, index) => (
          <div 
            key={index}
            className={`processing-step ${index === currentStep ? 'active' : ''}`}
          >
            <div className="step-dot"></div>
            <span>{step}</span>
          </div>
        ))}
      </div>

      <div className="delivery-info">
        <h3>Delivering to: {userEmail}</h3>
        <div className="countdown">
          <Clock size={20} />
          <span>Arriving in {minutes}:{seconds.toString().padStart(2, '0')}</span>
        </div>
      </div>

      <div className="social-proof">
        <p>✨ 847 professional renovations delivered this week</p>
        <p>⭐ Average client satisfaction: 4.9/5 stars</p>
      </div>
    </div>
  );
}