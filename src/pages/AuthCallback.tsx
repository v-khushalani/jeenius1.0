import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { logger } from '@/utils/logger';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        logger.log('🔄 Processing OAuth callback...');
        
        // Check for error in URL params first
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        if (errorParam) {
          logger.error('❌ Auth error from URL:', errorParam, errorDescription);
          navigate(`/login?error=${encodeURIComponent(errorDescription || errorParam)}`);
          return;
        }
        
        // Get session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          logger.error('❌ Session error:', sessionError);
          navigate('/login?error=auth_failed');
          return;
        }

        const user = sessionData.session?.user;
        
        if (!user) {
          logger.warn('No session found yet after callback');
          // Wait for session to establish
          await new Promise(resolve => setTimeout(resolve, 2000));
          const { data: retryData } = await supabase.auth.getSession();
          
          if (!retryData.session?.user) {
            logger.error('Still no session after retry; redirecting to login');
            navigate('/login');
            return;
          }
        }

        const userId = user?.id || sessionData.session?.user?.id;
        logger.info('User authenticated', userId);

        // Check if user profile exists and has goals set
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('selected_goal, target_exam, grade')
          .eq('id', userId)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist - AuthContext will create it, redirect to goal selection
          logger.info('New user, redirecting to goal selection');
          navigate('/goal-selection', { replace: true });
          return;
        }

        // Check if goals are complete
        if (profile?.selected_goal && profile?.target_exam && profile?.grade) {
          logger.info('Profile complete, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        } else {
          logger.info('Goals not set, redirecting to goal selection');
          navigate('/goal-selection', { replace: true });
        }
        
      } catch (error) {
        logger.error('Callback handling error:', error);
        navigate('/login?error=callback_failed');
      }
    };

    // Small delay to ensure URL params are processed
    setTimeout(handleAuthCallback, 500);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center" style={{backgroundColor: '#e9e9e9'}}>
      <Card className="max-w-md mx-4">
        <CardContent className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{borderColor: '#013062'}}></div>
          <h2 className="text-xl font-semibold mb-2" style={{color: '#013062'}}>
            Completing sign-in...
          </h2>
          <p className="text-gray-600">
            Please wait while we set up your account.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
