import React, { useState, useEffect } from 'react';
import { X, Crown, Check, Sparkles, Zap, MessageCircle, Flame, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FREE_LIMITS, SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';

const PricingModal = ({ 
  isOpen, 
  onClose, 
  limitType = 'daily_limit',
  userStats = {}
}) => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('yearly');

  const limitMessages = {
    daily_limit: {
      badge: "🔥 STEAL DEAL",
      title: "Upgrade to Pro",
      subtitle: "Unlimited access to everything!"
    },
    daily_limit_reached: {
      badge: "⏰ LIMIT REACHED",
      title: "Upgrade to Pro",
      subtitle: "Continue practicing without limits!"
    },
    test_limit: {
      badge: "📝 TEST LIMIT",
      title: "Upgrade to Pro",
      subtitle: "Unlimited mock tests await!"
    },
    ai_doubt_locked: {
      badge: "🤖 AI FEATURE",
      title: "Unlock JEEnie AI",
      subtitle: "Your personal AI tutor 24/7"
    },
    study_planner_blocked: {
      badge: "📅 AI FEATURE",
      title: "Unlock Study Planner",
      subtitle: "Smart planning for better results"
    },
    almost_there: {
      badge: "⚡ 80% USED",
      title: "Running Low!",
      subtitle: "Get unlimited access now"
    }
  };

  const message = limitMessages[limitType] || limitMessages.daily_limit;
  
  const pricing = {
    monthly: { price: 99, originalPrice: 149, perDay: '₹3.3' },
    yearly: { price: 499, originalPrice: 1188, perDay: '₹1.37', savings: 689 }
  };

  const comparison = [
    { feature: 'Questions/Day', free: FREE_LIMITS.questionsPerDay.toString(), pro: '∞' },
    { feature: 'Mock Tests', free: `${FREE_LIMITS.testsPerMonth}/mo`, pro: '∞' },
    { feature: 'JEEnie AI', free: false, pro: true },
    { feature: 'Study Planner', free: false, pro: true },
    { feature: 'Analytics', free: false, pro: true },
  ];

  useEffect(() => {
    if (isOpen) {
      // Track modal shown (integrate with your analytics)
      console.log('Modal shown:', limitType);
      
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, limitType]);

  const handleUpgrade = () => {
    onClose();
    navigate('/batches');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-b from-slate-50 to-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition p-2 rounded-full hover:bg-white/50 z-20"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center pt-6 pb-4 px-6 relative">
          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
            <Flame className="w-3 h-3" />
            {message.badge}
          </span>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {message.title}
          </h2>
          <p className="text-gray-500 text-sm">
            {billingCycle === 'yearly' 
              ? `Just ${pricing.yearly.perDay}/day — Cheaper than a samosa!` 
              : `Just ${pricing.monthly.perDay}/day — Less than a chai!`}
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center gap-2 px-6 mb-4">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-slate-800 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all relative ${
              billingCycle === 'yearly'
                ? 'bg-slate-800 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Yearly
            <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
              58%
            </span>
          </button>
        </div>

        {/* Price Display */}
        <div className="text-center px-6 mb-4">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-gray-400 line-through text-lg">
              ₹{pricing[billingCycle].originalPrice}
            </span>
            <span className="text-4xl font-bold text-slate-800">
              ₹{pricing[billingCycle].price}
            </span>
            <span className="text-gray-500">
              /{billingCycle === 'yearly' ? 'yr' : 'mo'}
            </span>
          </div>
          {billingCycle === 'yearly' && (
            <p className="text-green-600 text-sm font-medium mt-1">
              Save ₹{pricing.yearly.savings}
            </p>
          )}
        </div>

        {/* Comparison Table */}
        <div className="mx-6 mb-4 rounded-xl border border-gray-200 overflow-hidden bg-white">
          <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
            <div className="p-3 text-xs font-semibold text-gray-600">Feature</div>
            <div className="p-3 text-xs font-semibold text-gray-600 text-center">Free</div>
            <div className="p-3 text-xs font-semibold text-center flex items-center justify-center gap-1">
              <Crown className="w-3 h-3 text-amber-500" />
              <span className="text-slate-800">Pro</span>
            </div>
          </div>
          {comparison.map((item, idx) => (
            <div key={idx} className="grid grid-cols-3 border-b border-gray-100 last:border-0">
              <div className="p-3 text-sm text-gray-700">{item.feature}</div>
              <div className="p-3 text-center">
                {typeof item.free === 'boolean' ? (
                  item.free ? (
                    <Check className="w-4 h-4 text-green-500 mx-auto" />
                  ) : (
                    <X className="w-4 h-4 text-red-400 mx-auto" />
                  )
                ) : (
                  <span className="text-sm text-gray-600">{item.free}</span>
                )}
              </div>
              <div className="p-3 text-center">
                {typeof item.pro === 'boolean' ? (
                  <Check className="w-4 h-4 text-green-500 mx-auto" />
                ) : (
                  <span className="text-sm font-medium text-slate-800">{item.pro}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="px-6 pb-4">
          <button
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-900 hover:to-slate-800 text-white font-semibold py-3.5 rounded-xl text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Get Pro Now
          </button>
        </div>

        {/* Referral Banner */}
        <div className="mx-6 mb-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              🎁
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800">Get 1 week FREE!</p>
              <p className="text-xs text-green-600">Refer friends & both get 1 week Pro free (max 4 referrals)</p>
            </div>
          </div>
          <button 
            onClick={() => {
              const text = `Hey! Check out JEEnius - the best JEE/NEET prep app! Use my referral link for a FREE week of Pro! 🚀`;
              const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
              window.open(url, '_blank');
            }}
            className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1 whitespace-nowrap"
          >
            <Share2 className="w-3 h-3" />
            Share on WhatsApp
          </button>
        </div>

        {/* Continue Free */}
        <div className="px-6 pb-6 text-center">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm underline transition-all"
          >
            Continue with Free Plan →
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
