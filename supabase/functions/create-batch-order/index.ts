import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { batchId } = await req.json()
    
    if (!batchId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Batch ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Fetch batch details from database (server-controlled pricing)
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('id, name, price, validity_days')
      .eq('id', batchId)
      .single()

    if (batchError || !batch) {
      return new Response(
        JSON.stringify({ success: false, error: 'Batch not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    if (!batch.price || batch.price <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Batch is not available for purchase' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured')
    }

    const orderData = {
      amount: batch.price, // Server-controlled amount in paise
      currency: 'INR',
      receipt: `batch_${batchId}_${Date.now()}`,
      notes: { 
        userId: user.id, 
        batchId: batchId,
        batch_name: batch.name,
        expected_amount: batch.price,
        expected_validity_days: batch.validity_days
      }
    }

    const authHeaderRazorpay = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authHeaderRazorpay}`
      },
      body: JSON.stringify(orderData)
    })

    if (!razorpayResponse.ok) {
      const error = await razorpayResponse.text()
      throw new Error(`Razorpay API error: ${error}`)
    }

    const razorpayOrder = await razorpayResponse.json()

    // Check if user already has active subscription to this batch
    const { data: existingSub } = await supabase
      .from('user_batch_subscriptions')
      .select('id, expires_at')
      .eq('user_id', user.id)
      .eq('batch_id', batchId)
      .single()

    if (existingSub && new Date(existingSub.expires_at) > new Date()) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'You already have an active subscription to this batch',
          expiresAt: existingSub.expires_at
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
      )
    }

    // Store payment record with server-controlled values
    await supabase.from('batch_payments').insert({
      user_id: user.id,
      batch_id: batchId,
      razorpay_order_id: razorpayOrder.id,
      amount: batch.price, // Server-controlled amount
      currency: 'INR',
      status: 'created',
      batch_validity_days: batch.validity_days
    })

    return new Response(
      JSON.stringify({
        success: true,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        batch: {
          id: batch.id,
          name: batch.name,
          validity_days: batch.validity_days
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Create batch order error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
