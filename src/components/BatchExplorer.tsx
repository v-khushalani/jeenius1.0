import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  BookOpen, 
  Calendar, 
  Check, 
  Loader2,
  Search,
  Filter,
  Zap,
  Crown
} from 'lucide-react';
import { BatchTierSelector } from './batches/BatchTierSelector';
import { BatchPurchaseModal } from './BatchPurchaseModal';
import { useAuth } from '@/contexts/AuthContext';

interface Batch {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  grade: number;
  exam_type: string;
  price: number;
  offer_price?: number | null;
  validity_days: number;
  is_active: boolean;
  color: string | null;
  icon: string | null;
  free_mode_enabled?: boolean;
  pro_mode_enabled?: boolean;
  batch_subjects?: { id: string; subject: string }[];
}

interface UserSubscription {
  batchId: string;
  tier: 'free' | 'pro';
  expiresAt: Date;
}

type FilterType = 'all' | 'jee' | 'neet' | 'foundation' | 'scholarship' | 'olympiad';

export const BatchExplorer: React.FC = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [userSubscriptions, setUserSubscriptions] = useState<Map<string, UserSubscription>>(new Map());
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [isTierSelectorOpen, setIsTierSelectorOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedTierPrice, setSelectedTierPrice] = useState(0);

  useEffect(() => {
    fetchBatches();
    if (user) fetchUserSubscriptions();
  }, [user]);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select(`
          id,
          name,
          slug,
          description,
          grade,
          exam_type,
          price,
          offer_price,
          validity_days,
          is_active,
          color,
          icon,
          batch_subjects (id, subject)
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        // If table doesn't exist, show helpful message instead of error
        if (error.message && error.message.includes('relation') && error.message.includes('batches')) {
          console.log('Batch tables not deployed yet - showing setup message');
          setBatches([]);
          setLoading(false);
          return;
        }
        throw error;
      }
      setBatches((data || []) as unknown as Batch[]);
    } catch (error: any) {
      console.error('Error fetching batches:', error);
      // Silently handle table not found errors
      if (error.message && error.message.includes('batches')) {
        setBatches([]);
      } else {
        toast.error('Failed to load batches');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSubscriptions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_batch_subscriptions')
        .select('batch_id, tier, expires_at')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      const active = new Map<string, UserSubscription>();
      data?.forEach((sub: any) => {
        if (new Date(sub.expires_at) > new Date()) {
          active.set(sub.batch_id, {
            batchId: sub.batch_id,
            tier: sub.tier || 'free',
            expiresAt: new Date(sub.expires_at)
          });
        }
      });
      setUserSubscriptions(active);
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = filterType === 'all';
    if (!matchesFilter) {
      const examTypeLower = batch.exam_type.toLowerCase();
      if (filterType === 'jee') matchesFilter = examTypeLower === 'jee';
      else if (filterType === 'neet') matchesFilter = examTypeLower === 'neet';
      else if (filterType === 'foundation') matchesFilter = examTypeLower === 'foundation' || examTypeLower.startsWith('foundation');
      else if (filterType === 'scholarship') matchesFilter = examTypeLower === 'scholarship';
      else if (filterType === 'olympiad') matchesFilter = examTypeLower === 'olympiad';
    }
    
    return matchesSearch && matchesFilter;
  });

  const handleSelectBatch = (batch: Batch) => {
    if (!user) {
      toast.error('Please log in to access this batch');
      return;
    }
    setSelectedBatch(batch);
    setIsTierSelectorOpen(true);
  };

  const handleTierSelect = (tier: 'free' | 'pro', tierId: string, price: number) => {
    if (tier === 'free') {
      // Free tier enrolled via BatchTierSelector
      setIsTierSelectorOpen(false);
      fetchUserSubscriptions();
      toast.success('Free trial activated!');
    } else {
      // Pro tier needs payment
      setSelectedTierPrice(price);
      setIsTierSelectorOpen(false);
      setIsPurchaseModalOpen(true);
    }
  };

  const formatPrice = (paise: number) => {
    return (paise / 100).toFixed(0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Explore Our Batches</h1>
        <p className="text-muted-foreground mt-2">
          Choose the perfect batch for your exam preparation
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search batches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter */}
        <Select value={filterType} onValueChange={(val) => setFilterType(val as FilterType)}>
          <SelectTrigger className="sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              COMPETITIVE EXAMS
            </div>
            <SelectItem value="jee">JEE Preparation</SelectItem>
            <SelectItem value="neet">NEET Preparation</SelectItem>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
              FOUNDATION
            </div>
            <SelectItem value="foundation">Foundation</SelectItem>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
              COMPETITIVE
            </div>
            <SelectItem value="scholarship">Scholarship</SelectItem>
            <SelectItem value="olympiad">Olympiad</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredBatches.length} of {batches.length} batches
      </p>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBatches.map((batch) => {
          const subscription = userSubscriptions.get(batch.id);
          const hasAccess = !!subscription;
          const userTier = subscription?.tier || null;
          const priceInRupees = formatPrice(batch.offer_price || batch.price);
          const originalPrice = batch.offer_price ? formatPrice(batch.price) : null;

          return (
            <Card
              key={batch.id}
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                !batch.is_active ? 'opacity-50' : ''
              }`}
            >
              {/* Top Color Bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: batch.color || '#3B82F6' }}
              />

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{batch.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Grade {batch.grade} • {batch.exam_type}
                    </p>
                  </div>
                  {hasAccess && (
                    <Badge className={userTier === 'pro' 
                      ? 'bg-yellow-100 text-yellow-800 border-0' 
                      : 'bg-green-100 text-green-800 border-0'
                    }>
                      {userTier === 'pro' ? (
                        <><Crown className="w-3 h-3 mr-1" />Pro</>
                      ) : (
                        <><Check className="w-3 h-3 mr-1" />Free</>  
                      )}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Description */}
                {batch.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {batch.description}
                  </p>
                )}

                {/* Subjects */}
                {batch.batch_subjects && batch.batch_subjects.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground">
                      <BookOpen className="w-3 h-3" />
                      <span>Subjects</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {batch.batch_subjects.map(subject => (
                        <Badge
                          key={subject.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {subject.subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Validity */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{batch.validity_days} days access</span>
                </div>

                {/* Pricing & Action */}
                <div className="border-t pt-3 space-y-3">
                  {/* Price Display */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {batch.free_mode_enabled ? 'Free Trial + Pro' : 'Price'}
                    </span>
                    <div className="flex items-center gap-2">
                      {originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          ₹{originalPrice}
                        </span>
                      )}
                      <span className="text-2xl font-bold text-primary">
                        ₹{priceInRupees}
                      </span>
                    </div>
                  </div>

                  {/* Free Trial Badge */}
                  {batch.free_mode_enabled && !hasAccess && (
                    <div className="flex items-center justify-center gap-2 p-2 bg-green-50 rounded-lg">
                      <Zap className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-medium text-green-600">
                        7-day Free Trial Available
                      </span>
                    </div>
                  )}

                  {/* Action Button */}
                  {hasAccess ? (
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        disabled
                      >
                        <Check className="w-4 h-4" />
                        {userTier === 'pro' ? 'Pro Access' : 'Free Access'}
                      </Button>
                      {userTier === 'free' && (
                        <Button
                          onClick={() => handleSelectBatch(batch)}
                          className="w-full gap-2 bg-yellow-500 hover:bg-yellow-600 text-black"
                        >
                          <Crown className="w-4 h-4" />
                          Upgrade to Pro
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleSelectBatch(batch)}
                      className="w-full gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      {batch.free_mode_enabled ? 'Start Free Trial' : 'Get Access'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredBatches.length === 0 && batches.length === 0 && (
        <Card className="p-12 text-center border-2 border-dashed border-orange-300 bg-orange-50/50">
          <BookOpen className="w-12 h-12 mx-auto text-orange-600 mb-4" />
          <h3 className="font-semibold text-lg mb-2 text-orange-900">Setup Required</h3>
          <p className="text-muted-foreground mb-4">
            The batch system is ready, but the database tables need to be deployed first.
          </p>
          <div className="bg-white rounded-lg p-4 text-left text-sm space-y-2 border border-orange-200 mb-4 max-w-md mx-auto">
            <p className="font-medium text-orange-900">Quick Setup (2 minutes):</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Go to <a href="https://app.supabase.com/project/zbclponzlwulmltwkjga/sql/new" target="_blank" className="text-primary underline">Supabase SQL Editor</a></li>
              <li>Click "New Query"</li>
              <li>Paste SQL from <code className="bg-gray-100 px-2 py-1 rounded">supabase/migrations/20260203000000_batch_system.sql</code></li>
              <li>Click "Run"</li>
            </ol>
          </div>
          <Button variant="outline" onClick={() => window.open('https://app.supabase.com/project/zbclponzlwulmltwkjga/sql/new', '_blank')}>
            Open Supabase SQL Editor
          </Button>
        </Card>
      )}

      {/* Empty State - No results from search/filter */}
      {filteredBatches.length === 0 && batches.length > 0 && (
        <Card className="p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Batches Found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </Card>
      )}

      {/* Tier Selector Dialog */}
      <Dialog open={isTierSelectorOpen} onOpenChange={setIsTierSelectorOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose Your Plan</DialogTitle>
          </DialogHeader>
          {selectedBatch && (
            <BatchTierSelector
              batchId={selectedBatch.id}
              batchName={selectedBatch.name}
              onSelect={handleTierSelect}
              onClose={() => {
                setIsTierSelectorOpen(false);
                setSelectedBatch(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Purchase Modal (Pro tier) */}
      <BatchPurchaseModal
        batch={selectedBatch ? {...selectedBatch, price: selectedTierPrice} : null}
        isOpen={isPurchaseModalOpen}
        onClose={() => {
          setIsPurchaseModalOpen(false);
          setSelectedBatch(null);
          setSelectedTierPrice(0);
        }}
        onSuccess={() => {
          fetchUserSubscriptions();
          setIsPurchaseModalOpen(false);
          setSelectedBatch(null);
        }}
      />
    </div>
  );
};

export default BatchExplorer;
