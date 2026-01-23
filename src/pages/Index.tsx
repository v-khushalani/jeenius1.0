import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import CrazyHero from '@/components/CrazyHero';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
    // Prevent scrolling on landing page
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
    };
  }, [isAuthenticated, navigate]);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <main className="h-full w-full overflow-hidden">
        <CrazyHero />
      </main>
    </div>
  );
};

export default Index;
