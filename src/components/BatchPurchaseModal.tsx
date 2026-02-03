import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  ShoppingCart, 
  Check, 
  Calendar, 
  BookOpen, 
  Clock,
  Loader2,
  Lock,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export const BatchPurchaseModal: React.FC<{
  batch: Batch | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}> = ({ batch, isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (batch && user) {
      checkAccess();
    }
  }, [batch, user]);

  const checkAccess = async () => {
    if (!batch || !user) return;
    
    try {
      const { data: subscription, error } = await supabase
        .from('user_batch_subscriptions')
        .select('id, expires_at')
        .eq('user_id', user.id)
        .eq('batch_id', batch.id)
        .single();

      if (!error && subscription && new Date(subscription.expires_at as string) > new Date()) {
        setHasAccess(true);
      }
    } catch (error) {
      // No subscription found
      setHasAccess(false);
    }
  };

  const handlePurchase = async () => {
    if (!batch || !user) {
      navigate('/login');
      return;
    }

    if (batch.price <= 0) {
      toast.error('This batch is not available for purchase');
      return;
    }

    setLoading(true);
    try {
      // Get user token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      // Create order via edge function
      const createOrderResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-batch-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ batchId: batch.id })
        }
      );

      const orderData = await createOrderResponse.json();

      if (!orderData.success) {
        if (createOrderResponse.status === 409) {
          toast.error(orderData.error);
          setHasAccess(true);
          return;
        }
        throw new Error(orderData.error || 'Failed to create order');
      }

      // Initialize Razorpay payment
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          order_id: orderData.orderId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'JEENIUS',
          description: `Batch: ${batch.name}`,
          prefill: {
            email: user.email || '',
            name: user.user_metadata?.full_name || 'Student'
          },
          handler: (response: RazorpayResponse) => {
            verifyPayment(response, orderData.orderId);
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
            }
          }
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      };
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || 'Failed to initiate purchase');
      setLoading(false);
    }
  };

  const verifyPayment = async (
    response: RazorpayResponse,
    orderId: string
  ) => {
    if (!batch || !user) return;

    setVerifying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session expired');

      const verifyResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-batch-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            razorpay_order_id: orderId,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            batchId: batch.id
          })
        }
      );

      const verifyData = await verifyResponse.json();

      if (verifyData.success) {
        toast.success('🎉 Purchase successful! You now have access to this batch.');
        setHasAccess(true);
        
        // Refresh subscription data
        await checkAccess();
        
        // Notify parent and close modal
        if (onSuccess) onSuccess();
        
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error(verifyData.error || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error(error.message || 'Payment verification failed. Please contact support.');
    } finally {
      setVerifying(false);
    }
  };

  if (!batch) return null;

  const priceInRupees = (batch.price / 100).toFixed(0);
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + batch.validity_days);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Purchase Batch
          </DialogTitle>
          <DialogDescription>
            Complete your purchase to get instant access
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Batch Details */}
          <Card className="border-0 bg-muted/50">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{batch.name}</h3>
                  <p className="text-sm text-muted-foreground">Grade {batch.grade} • {batch.exam_type}</p>
                </div>

                {batch.description && (
                  <p className="text-sm text-foreground">{batch.description}</p>
                )}

                {/* Subjects */}
                {batch.batch_subjects && batch.batch_subjects.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Subjects</p>
                    <div className="flex flex-wrap gap-1.5">
                      {batch.batch_subjects.map(subject => (
                        <Badge key={subject.id} variant="secondary" className="text-xs">
                          {subject.subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Access Status */}
          {hasAccess && (
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                You already have access to this batch!
              </AlertDescription>
            </Alert>
          )}

          {/* Pricing Details */}
          <Card className="border-0 bg-blue-50">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Price</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">₹{priceInRupees}</span>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Validity Period
                    </span>
                    <span className="font-medium">{batch.validity_days} days</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Access Until
                    </span>
                    <span className="font-medium">
                      {expiryDate.toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">What You Get</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>Instant access to all chapters & topics</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>Practice questions & mock tests</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>Progress tracking & analytics</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>24/7 access from any device</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <Alert className="border-amber-200 bg-amber-50">
            <Lock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-xs">
              Secure payment via Razorpay. Your payment information is encrypted and safe.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading || verifying}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={loading || verifying || hasAccess}
              className="flex-1 gap-2"
            >
              {loading || verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {verifying ? 'Verifying...' : 'Processing...'}
                </>
              ) : hasAccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Already Purchased
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Pay ₹{priceInRupees}
                </>
              )}
            </Button>
          </div>

          {/* Security Note */}
          <p className="text-xs text-muted-foreground text-center">
            🔒 Secure checkout powered by Razorpay
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
