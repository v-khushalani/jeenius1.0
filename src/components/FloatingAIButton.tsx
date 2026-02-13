import React, { useState } from 'react';
import { Bot, Sparkles, Lock } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import AIDoubtSolver from './AIDoubtSolver';
import PricingModal from './PricingModal';
import { useAuth } from '@/contexts/AuthContext';

const FloatingAIButton = () => {
  const [showAI, setShowAI] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { isAuthenticated, isPremium } = useAuth();
  const location = useLocation();

  // Hide on test pages
  const isTestPage = location.pathname.includes('/test') || 
                     location.pathname.includes('/tests');
  
  // Don't show if not authenticated or on test pages
  if (!isAuthenticated || isTestPage) {
    return null;
  }

  const handleClick = () => {
    if (isPremium) {
      setShowAI(true);
    } else {
      // Show upgrade modal for free users
      setShowUpgradeModal(true);
    }
  };
  
  // Dummy question for general doubts (outside practice mode)
  const generalQuestion = {
    question: "I have a doubt...",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "",
    explanation: ""
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="fixed bottom-24 right-6 z-[9999] group"
        aria-label="AI Doubt Solver"
      >
        {/* Animated Background Circles */}
        <div className="absolute inset-0 animate-ping">
          <div className={`w-16 h-16 rounded-full ${isPremium ? 'bg-purple-400' : 'bg-amber-400'} opacity-30`}></div>
        </div>
        <div className="absolute inset-0 animate-pulse">
          <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${isPremium ? 'from-purple-500 to-pink-500' : 'from-amber-500 to-orange-500'} opacity-40`}></div>
        </div>

        {/* Main Button */}
        <div className={`relative w-16 h-16 bg-gradient-to-br ${isPremium ? 'from-purple-600 via-pink-600 to-indigo-600' : 'from-amber-500 via-orange-500 to-red-500'} rounded-full shadow-2xl flex items-center justify-center transform transition-all duration-300 hover:scale-110 ${isPremium ? 'hover:shadow-purple-500/50' : 'hover:shadow-amber-500/50'}`}>
          {/* Sparkle Effect or Lock */}
          <div className="absolute -top-1 -right-1 animate-bounce">
            {isPremium ? (
              <Sparkles className="w-4 h-4 text-yellow-300" fill="currentColor" />
            ) : (
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
                <Lock className="w-3 h-3 text-amber-600" />
              </div>
            )}
          </div>
          
          {/* Bot Icon */}
          <Bot className="w-8 h-8 text-white animate-pulse" />
        </div>

        {/* Tooltip on Hover */}
        {isHovered && (
          <div className="absolute bottom-full right-0 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className={`bg-gradient-to-r ${isPremium ? 'from-purple-600 to-pink-600' : 'from-amber-500 to-orange-500'} text-white px-4 py-2 rounded-lg shadow-xl whitespace-nowrap`}>
              <p className="text-sm font-semibold">🤖 {isPremium ? 'Ask AI Anything!' : 'Unlock JEEnie AI'}</p>
              <p className="text-xs opacity-90">
                {isPremium ? 'JEEnie - Premium AI Tutor 💎' : 'Upgrade to Pro for AI help! 🔓'}
              </p>
            </div>
            {/* Arrow */}
            <div className={`absolute top-full right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent ${isPremium ? 'border-t-purple-600' : 'border-t-amber-500'}`}></div>
          </div>
        )}
      </button>

      {/* AI Modal - Only for Premium */}
      {isPremium && (
        <AIDoubtSolver 
          question={generalQuestion}
          isOpen={showAI}
          onClose={() => setShowAI(false)}
        />
      )}

      {/* Upgrade Modal - For Free Users */}
      {!isPremium && (
        <PricingModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          limitType="ai_doubt_locked"
        />
      )}
    </>
  );
};

export default FloatingAIButton;
