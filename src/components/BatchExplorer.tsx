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
import { toast } from 'sonner';
import { 
  BookOpen, 
  Calendar, 
  ShoppingCart, 
  Check, 
  Loader2,
  Search,
  Filter,
  Zap
} from 'lucide-react';
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
  validity_days: number;
  is_active: boolean;
  color: string | null;
  icon: string | null;
  batch_subjects?: { id: string; subject: string }[];
}

type FilterType = 'all' | 'jee' | 'neet' | 'foundation';

export const BatchExplorer: React.FC = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [userSubscriptions, setUserSubscriptions] = useState<Set<string>>(new Set());
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

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
      setBatches((data || []) as Batch[]);
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
        .select('batch_id, expires_at')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      const active = new Set<string>();
      data?.forEach((sub: any) => {
        if (new Date(sub.expires_at) > new Date()) {
          active.add(sub.batch_id);
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
    
    const matchesFilter = filterType === 'all' || 
      batch.exam_type.toLowerCase() === filterType.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });

  const handlePurchase = (batch: Batch) => {
    if (!user) {
      toast.error('Please log in to purchase a batch');
      return;
    }
    setSelectedBatch(batch);
    setIsPurchaseModalOpen(true);
  };

  const handlePurchaseSuccess = () => {
    fetchUserSubscriptions();
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
            <SelectItem value="jee">JEE Preparation</SelectItem>
            <SelectItem value="neet">NEET Preparation</SelectItem>
            <SelectItem value="foundation">Foundation</SelectItem>
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
          const hasAccess = userSubscriptions.has(batch.id);
          const priceInRupees = formatPrice(batch.price);

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
                    <Badge className="bg-green-100 text-green-800 border-0">
                      <Check className="w-3 h-3 mr-1" />
                      Owned
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
                {batch.price > 0 ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Price
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-primary">
                            ₹{priceInRupees}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handlePurchase(batch)}
                        disabled={hasAccess}
                        className="w-full gap-2"
                        variant={hasAccess ? 'outline' : 'default'}
                      >
                        {hasAccess ? (
                          <>
                            <Check className="w-4 h-4" />
                            Access Granted
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4" />
                            Purchase Now
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center gap-2 p-2 bg-green-50 rounded-lg">
                      <Zap className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        Free Access
                      </span>
                    </div>
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

      {/* Purchase Modal */}
      <BatchPurchaseModal
        batch={selectedBatch}
        isOpen={isPurchaseModalOpen}
        onClose={() => {
          setIsPurchaseModalOpen(false);
          setSelectedBatch(null);
        }}
        onSuccess={handlePurchaseSuccess}
      />
    </div>
  );
};

export default BatchExplorer;
