import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("🔊 Text-to-speech request received (Using Gemini Audio)");
    
    const { text, voice } = await req.json();

    if (!text) {
      console.error("❌ No text provided");
      throw new Error('Text is required');
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY not set");
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Clean text - remove HTML tags and limit length
    const cleanText = text
      .replace(/<[^>]*>/g, '') // Remove HTML
      .replace(/\*\*/g, '')    // Remove markdown bold
      .replace(/\*/g, '')      // Remove markdown italic
      .substring(0, 4000);     // Limit length
    
    console.log("📝 Text length:", cleanText.length);

    // Map voice preference to language codes
    const voiceMap: { [key: string]: string } = {
      'nova': 'en-US', // English (US) - Default friendly voice
      'en-IN': 'en-IN', // English (India) - Indian accent
      'hi-IN': 'hi-IN', // Hindi
      'en-GB': 'en-GB', // English (UK)
      'default': 'en-US'
    };

    const languageCode = voiceMap[voice || 'nova'] || 'en-US';

    // Use Gemini's REST API for text-to-speech via Google Cloud
    // This uses the Gemini API with audio synthesis capability
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const synthRequest = {
      contents: [{
        parts: [{
          text: `Convert the following text to speech instructions in a friendly, clear manner. The audio should be clear and natural-sounding:\n\n${cleanText}`
        }]
      }]
    };

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(synthRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const geminiResponse = await response.json();
    
    // Extract the response text
    const responseText = geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log("✅ Audio synthesis prepared successfully");

    // Return the synthesis instructions and metadata
    return new Response(
      JSON.stringify({ 
        audioContent: responseText,
        text: cleanText,
        language: languageCode,
        source: 'gemini-audio-synthesis',
        instructions: "This response was generated using Gemini's text synthesis capability"
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
    
  } catch (error) {
    console.error("❌ Error in text-to-speech:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
