// src/components/ProtectedRoute.tsx

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import LoadingScreen from '@/components/ui/LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [goalsChecked, setGoalsChecked] = useState(false);
  const [needsGoalSelection, setNeedsGoalSelection] = useState(false);

  useEffect(() => {
    const checkGoals = async () => {
      if (!user) {
        setGoalsChecked(true);
        return;
      }

      try {
        // Check with a small delay to allow for database replication
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('selected_goal, target_exam, grade')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking goals:', error);
          setNeedsGoalSelection(true);
        } else if (!profile?.selected_goal || !profile?.target_exam || !profile?.grade) {
          // If profile is incomplete, user needs to set goals
          console.info('Profile incomplete - needs goal selection:', { 
            selected_goal: profile?.selected_goal,
            target_exam: profile?.target_exam,
            grade: profile?.grade
          });
          setNeedsGoalSelection(true);
        } else {
          // Profile is complete
          console.info('Profile complete - allowing dashboard access');
          setNeedsGoalSelection(false);
        }
      } catch (error) {
        console.error('Error checking goals:', error);
        setNeedsGoalSelection(true);
      }
      
      setGoalsChecked(true);
    };

    if (!isLoading && user) {
      checkGoals();
    } else if (!isLoading) {
      setGoalsChecked(true);
    }
  }, [user, isLoading]);

  if (isLoading || !goalsChecked) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to goal selection if goals not set
  if (needsGoalSelection && location.pathname !== '/goal-selection') {
    return <Navigate to="/goal-selection" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
