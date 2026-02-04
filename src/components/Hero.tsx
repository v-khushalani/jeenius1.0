import React, { useCallback } from 'react';
import { ArrowRight, Zap, BookOpen, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  const handleStartLearning = useCallback(() => {
    navigate('/signup');
  }, [navigate]);

  const handleWhyUs = useCallback(() => {
    navigate('/why-us');
  }, [navigate]);

  const handleSignIn = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  return (
    <section className="relative w-screen h-screen flex flex-col bg-white overflow-hidden">
      {/* Subtle geometric background - matches exact design */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top right circle - light blue gradient */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#e6eeff] rounded-full -translate-y-1/2 translate-x-1/3 opacity-60" />
        {/* Bottom left circle - lighter blue gradient */}
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#e6eeff] rounded-full translate-y-1/2 -translate-x-1/3 opacity-40" />
      </div>

      {/* Navigation Bar - Top Right */}
      <div className="fixed top-8 right-8 flex gap-3 z-50 pointer-events-auto">
        {/* Why Us Button */}
        <button
          onClick={handleWhyUs}
          className="px-6 py-2.5 text-base font-medium text-[#013062] hover:text-[#013062] transition-all duration-300 rounded-full border-0 hover:bg-gray-100/50"
        >
          Why Us
        </button>
        
        {/* Sign In Button */}
        <button
          onClick={handleSignIn}
          className="px-8 py-2.5 text-base font-semibold text-white bg-[#013062] rounded-full hover:bg-[#1a5fa0] transition-all duration-300 hover:shadow-lg active:scale-95"
        >
          Sign In
        </button>
      </div>

      {/* Main Hero Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10 pt-20 pb-20">
        <div className="max-w-4xl mx-auto w-full text-center space-y-10">
          
          {/* Main Headline */}
          <div className="space-y-6">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight text-[#013062]">
              <span className="block">Where AI</span>
              <span className="block">adapts YOU</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl lg:text-2xl text-[#8b9fb8] max-w-3xl mx-auto leading-relaxed font-normal">
              The smartest way to prepare for JEE, NEET, CET & Foundation. Personalized learning that evolves with you.
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <button
              onClick={handleStartLearning}
              className="group relative inline-flex items-center justify-center gap-2 px-12 py-4 text-lg font-semibold text-white bg-[#013062] rounded-full hover:bg-[#1a5fa0] transition-all duration-300 hover:shadow-2xl active:scale-95 shadow-lg"
            >
              <span className="relative z-10">Start Learning Free</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300 relative z-10" />
            </button>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 max-w-3xl mx-auto w-full">
            
            {/* Feature 1: Adaptive */}
            <div className="bg-white/40 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 hover:border-gray-300 hover:bg-white/60 transition-all duration-300 group">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-6 h-6 text-[#013062]" />
                </div>
              </div>
              <h3 className="text-[#013062] font-bold text-lg mb-2">Adaptive</h3>
              <p className="text-[#8b9fb8] text-sm font-normal">AI adjusts difficulty</p>
            </div>

            {/* Feature 2: Questions */}
            <div className="bg-white/40 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 hover:border-gray-300 hover:bg-white/60 transition-all duration-300 group">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-6 h-6 text-[#013062]" />
                </div>
              </div>
              <h3 className="text-[#013062] font-bold text-lg mb-2">40K+ Questions</h3>
              <p className="text-[#8b9fb8] text-sm font-normal">Comprehensive bank</p>
            </div>

            {/* Feature 3: Track Progress */}
            <div className="bg-white/40 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 hover:border-gray-300 hover:bg-white/60 transition-all duration-300 group">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="w-6 h-6 text-[#013062]" />
                </div>
              </div>
              <h3 className="text-[#013062] font-bold text-lg mb-2">Track Progress</h3>
              <p className="text-[#8b9fb8] text-sm font-normal">Real-time analytics</p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
