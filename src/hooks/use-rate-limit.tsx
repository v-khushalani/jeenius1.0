import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
  message?: string;
}

export const useRateLimit = (options: RateLimitOptions) => {
  const { maxAttempts, windowMs, message } = options;
  const [attempts, setAttempts] = useState<number[]>([]);
  const { toast } = useToast();

  const now = Date.now();
  const validAttempts = attempts.filter(timestamp => now - timestamp < windowMs);

  const isRateLimited = validAttempts.length >= maxAttempts;
  const remainingAttempts = Math.max(0, maxAttempts - validAttempts.length);

  const checkRateLimit = useCallback(() => {
    if (isRateLimited && message) {
      toast({
        title: "Too Many Attempts",
        description: message,
        variant: "destructive"
      });
      return true;
    }
    return false;
  }, [isRateLimited, message, toast]);

  const recordAttempt = useCallback(() => {
    setAttempts(prev => {
      const now = Date.now();
      const validAttempts = prev.filter(timestamp => now - timestamp < windowMs);
      return [...validAttempts, now];
    });
  }, [windowMs]);

  // Clean up old attempts periodically
  const cleanupAttempts = useCallback(() => {
    const now = Date.now();
    setAttempts(prev => prev.filter(timestamp => now - timestamp < windowMs));
  }, [windowMs]);

  return {
    isRateLimited,
    remainingAttempts,
    checkRateLimit,
    recordAttempt,
    cleanupAttempts
  };
};
