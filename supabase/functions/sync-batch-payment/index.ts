import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Extract and validate authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Get and validate request body
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, batchId } = await req.json()
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !batchId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!RAZORPAY_KEY_SECRET) throw new Error('Secret not configured')

    // Verify payment signature
    const generatedSignature = createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (generatedSignature !== razorpay_signature) {
      throw new Error('Invalid payment signature')
    }

    // Verify the payment order exists
    const { data: paymentOrder, error: orderError } = await supabase
      .from('batch_payments')
      .select('user_id, amount, batch_id, batch_validity_days')
      .eq('razorpay_order_id', razorpay_order_id)
      .single()

    if (orderError || !paymentOrder) {
      throw new Error('Payment order not found')
    }

    // Verify user owns this payment
    if (paymentOrder.user_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot verify payment for other users' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Verify batch ID matches
    if (paymentOrder.batch_id !== batchId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Batch ID mismatch' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Fetch batch to get validity days (from server, not from payment record)
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('id, price, validity_days')
      .eq('id', batchId)
      .single()

    if (batchError || !batch) {
      throw new Error('Batch not found')
    }

    // Verify amount matches batch price (in paise)
    if (paymentOrder.amount !== batch.price) {
      console.warn(`Batch payment amount mismatch: expected ${batch.price}, got ${paymentOrder.amount}`)
    }

    // Calculate expiry date using batch's server-controlled validity
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + batch.validity_days)

    // Update payment record
    await supabase.from('batch_payments').update({
      razorpay_payment_id,
      razorpay_signature,
      status: 'success'
    }).eq('razorpay_order_id', razorpay_order_id)

    // Create or update user_batch_subscriptions
    const { data: existingSub } = await supabase
      .from('user_batch_subscriptions')
      .select('id, expires_at')
      .eq('user_id', user.id)
      .eq('batch_id', batchId)
      .single()

    if (existingSub) {
      // Extend existing subscription
      const currentExpiry = new Date(existingSub.expires_at)
      const newExpiry = currentExpiry > new Date() ? currentExpiry : new Date()
      newExpiry.setDate(newExpiry.getDate() + batch.validity_days)

      await supabase
        .from('user_batch_subscriptions')
        .update({
          status: 'active',
          expires_at: newExpiry.toISOString(),
          purchased_at: new Date().toISOString()
        })
        .eq('id', existingSub.id)
    } else {
      // Create new subscription
      await supabase
        .from('user_batch_subscriptions')
        .insert({
          user_id: user.id,
          batch_id: batchId,
          status: 'active',
          purchased_at: new Date().toISOString(),
          expires_at: endDate.toISOString()
        })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        expires_at: endDate.toISOString(),
        message: 'Batch access granted successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Batch payment sync error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
