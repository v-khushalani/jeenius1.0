import React from 'react';
import Header from '@/components/Header';
import AIStudyPlanner from '@/components/AIStudyPlanner';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const AIStudyPlannerPage = () => {
  const { isPremium } = useAuth();
  const navigate = useNavigate();
  
  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Header />
        <div className="container mx-auto px-3 sm:px-4 max-w-md pt-20 sm:pt-24 md:pt-32 text-center">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-apple-lg border border-slate-200">
            <div className="w-16 h-16 rounded-2xl bg-[#013062]/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-[#013062]" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Pro Feature</h2>
            <p className="text-sm text-slate-500 mb-6">Unlock AI Study Planner — your personal JEE/NEET mentor, 24/7.</p>
            <Button onClick={() => navigate('/subscription-plans')} className="bg-[#013062] hover:bg-[#01408a] text-white px-8 py-3 rounded-xl w-full">
              Upgrade to Pro — ₹49/month
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <Header />
      <div className="flex-1 overflow-hidden">
        <AIStudyPlanner />
      </div>
    </div>
  );
};

export default AIStudyPlannerPage;
