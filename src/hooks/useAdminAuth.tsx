import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export const useAdminAuth = () => {
  const { user, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isAuthenticated || !user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Check role from user_roles table (secure, service-role-only table)
        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
      
        if (error && error.code !== 'PGRST116') {
          logger.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!roleData);
        }
      } catch (error) {
        logger.error('Error checking admin status:', error);
        setIsAdmin(false);
      }

      setLoading(false);
    };

    checkAdminStatus();
  }, [user, isAuthenticated]);

  return { isAdmin, loading };
};
