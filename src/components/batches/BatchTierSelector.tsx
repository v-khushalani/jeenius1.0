import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface BatchTier {
  id: string;
  batch_id: string;
  tier_name: 'free' | 'pro';
  description: string | null;
  price_paise: number;
  duration_days: number;
  content_limit: number | null;
  features: {
    videos: boolean;
    pdfs: boolean;
    tests: boolean;
    solutions: boolean;
    liveClasses: boolean;
    doubtSupport: boolean;
  };
}

interface BatchTierSelectorProps {
  batchId: string;
  batchName: string;
  onSelect: (tier: 'free' | 'pro', tierId: string, price: number) => void;
  onClose?: () => void;
}

const FEATURE_LABELS: Record<string, { label: string; icon: string }> = {
  videos: { label: 'Video Lectures', icon: '📹' },
  pdfs: { label: 'Study Materials', icon: '📄' },
  tests: { label: 'Practice Tests', icon: '✏️' },
  solutions: { label: 'Detailed Solutions', icon: '💡' },
  liveClasses: { label: 'Live Classes', icon: '🔴' },
  doubtSupport: { label: 'Doubt Support', icon: '💬' }
};

export const BatchTierSelector: React.FC<BatchTierSelectorProps> = ({
  batchId,
  batchName,
  onSelect,
  onClose
}) => {
  const { user } = useAuth();
  const [tiers, setTiers] = useState<BatchTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<'free' | 'pro' | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchTiers();
  }, [batchId]);

  const fetchTiers = async () => {
    try {
      // batch_access_tiers table may not exist yet - use batch data directly
      const { data: batch, error } = await supabase
        .from('batches')
        .select('id, name, price, offer_price, validity_days')
        .eq('id', batchId)
        .maybeSingle();

      if (error) throw error;
      
      if (batch) {
        // Build tiers from batch data
        const defaultFeatures = {
          videos: false, pdfs: true, tests: true,
          solutions: false, liveClasses: false, doubtSupport: false
        };
        const proFeatures = {
          videos: true, pdfs: true, tests: true,
          solutions: true, liveClasses: true, doubtSupport: true
        };

        setTiers([
          {
            id: `${batch.id}-free`,
            batch_id: batch.id,
            tier_name: 'free',
            description: 'Try before you buy - limited access',
            price_paise: 0,
            duration_days: 7,
            content_limit: 50,
            features: defaultFeatures
          },
          {
            id: `${batch.id}-pro`,
            batch_id: batch.id,
            tier_name: 'pro',
            description: 'Full access to all content and features',
            price_paise: batch.offer_price || batch.price,
            duration_days: batch.validity_days,
            content_limit: null,
            features: proFeatures
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching tiers:', error);
      toast.error('Failed to load tier options');
    } finally {
      setLoading(false);
    }
  };

  const handleFreeTrial = async () => {
    if (!user) {
      toast.error('Please login to start free trial');
      return;
    }

    const freeTier = tiers.find(t => t.tier_name === 'free');
    if (!freeTier) {
      toast.error('Free trial not available for this batch');
      return;
    }

    setEnrolling(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + freeTier.duration_days);

      // Check if already enrolled
      const { data: existing } = await supabase
        .from('user_batch_subscriptions')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('batch_id', batchId)
        .maybeSingle();

      if (existing) {
        toast.info('You already have access to this batch');
        onClose?.();
        return;
      }

      const { error } = await supabase
        .from('user_batch_subscriptions')
        .insert({
          user_id: user.id,
          batch_id: batchId,
          expires_at: expiresAt.toISOString(),
          status: 'active'
        } as any);

      if (error) throw error;

      toast.success(`Free trial started! ${freeTier.duration_days} days access`);
      onSelect('free', freeTier.id, 0);
    } catch (error: any) {
      console.error('Free trial error:', error);
      toast.error(error.message || 'Failed to start free trial');
    } finally {
      setEnrolling(false);
    }
  };

  const handleProPurchase = () => {
    const proTier = tiers.find(t => t.tier_name === 'pro');
    if (!proTier) {
      toast.error('Pro tier not available');
      return;
    }
    onSelect('pro', proTier.id, proTier.price_paise);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-muted-foreground">Loading options...</p>
      </div>
    );
  }

  const freeTier = tiers.find(t => t.tier_name === 'free');
  const proTier = tiers.find(t => t.tier_name === 'pro');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-foreground mb-2">
          Choose Your Access Level
        </h3>
        <p className="text-muted-foreground">{batchName}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {freeTier && (
          <div
            className={`border-2 rounded-xl p-6 transition-all cursor-pointer ${
              selectedTier === 'free'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setSelectedTier('free')}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-bold">🆓 Free Trial</h4>
              <Badge variant="secondary">{freeTier.duration_days} days</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{freeTier.description}</p>
            <div className="text-3xl font-bold text-green-600 mb-4">₹0</div>
            {freeTier.content_limit && (
              <p className="text-xs text-muted-foreground mb-4 bg-muted p-2 rounded">
                📊 Limited to {freeTier.content_limit} questions
              </p>
            )}
            <div className="space-y-2 mb-6">
              {Object.entries(freeTier.features).map(([key, enabled]) => (
                <div key={key} className={`flex items-center gap-2 text-sm ${enabled ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                  <span>{enabled ? '✅' : '❌'}</span>
                  <span>{FEATURE_LABELS[key]?.icon} {FEATURE_LABELS[key]?.label || key}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={handleFreeTrial} disabled={enrolling}>
              {enrolling ? 'Starting...' : 'Start Free Trial'}
            </Button>
          </div>
        )}

        {proTier && (
          <div
            className={`border-2 rounded-xl p-6 transition-all cursor-pointer relative ${
              selectedTier === 'pro'
                ? 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-200'
                : 'border-yellow-300 hover:border-yellow-400 bg-yellow-50/50'
            }`}
            onClick={() => setSelectedTier('pro')}
          >
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-yellow-500 text-black font-bold">
                <Crown className="w-3 h-3 mr-1" /> RECOMMENDED
              </Badge>
            </div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <h4 className="text-xl font-bold">💎 Pro Access</h4>
              <Badge variant="default">{proTier.duration_days} days</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{proTier.description}</p>
            <div className="mb-4">
              <div className="text-3xl font-bold text-foreground">₹{(proTier.price_paise / 100).toFixed(0)}</div>
              <div className="text-sm text-muted-foreground">
                {proTier.duration_days === 365 ? 'per year' : `for ${proTier.duration_days} days`}
              </div>
            </div>
            <div className="space-y-2 mb-6">
              {Object.entries(proTier.features).map(([key, enabled]) => (
                <div key={key} className={`flex items-center gap-2 text-sm ${enabled ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  <span>{enabled ? '✅' : '❌'}</span>
                  <span>{FEATURE_LABELS[key]?.icon} {FEATURE_LABELS[key]?.label || key}</span>
                </div>
              ))}
            </div>
            <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold" onClick={handleProPurchase}>
              <Zap className="w-4 h-4 mr-2" /> Upgrade to Pro
            </Button>
          </div>
        )}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <Lock className="w-4 h-4 inline mr-1" />
        Secure payment powered by Razorpay
      </div>
    </div>
  );
};

export default BatchTierSelector;
