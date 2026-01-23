import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📝 JEEnie request received at:", new Date().toISOString());
    
    // Parse request body
    const { contextPrompt, conversationHistory } = await req.json();
    console.log("📥 Prompt length:", contextPrompt?.length || 0);
    console.log("📜 Conversation history:", conversationHistory ? "Yes" : "No");
    
    if (!contextPrompt) {
      console.error("❌ No contextPrompt provided");
      return new Response(
        JSON.stringify({ error: "MISSING_PROMPT" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate prompt length (prevent token overflow)
    if (!contextPrompt || contextPrompt.length > 4000) {
      console.error("❌ Prompt too long or empty:", contextPrompt?.length || 0);
      return new Response(
        JSON.stringify({ 
          error: "INVALID_PROMPT", 
          message: "Please ask a shorter question (max 4000 characters)" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for API key
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY missing in environment");
      return new Response(
        JSON.stringify({ error: "API_KEY_MISSING_BACKEND" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("🤖 Calling Gemini 1.5 Flash (Upgraded Stability)");

    // --- UPGRADED SYSTEM PROMPT (The "JEEnius" Brain) ---
    const systemPrompt = `Tu "JEEnie" hai - 11th/12th students ka ultimate AI mentor aur friend.

GREETING: 
Always start with "**Hello Puttar!** 🧞‍♂️"
Enhancement: Greet based on subject context:
- Physics: "Newton ki kasam, aaj ye doubt solve karke hi rahenge!"
- Math: "Equations se darna nahi, JEEnie hai na!"
- SST/Humanities: "History aur Social Science ki ye kahani badi interesting hai, suno..."
- General: "Batao aaj kya toofan machana hai?"

PERSONALITY RULES:
1. VERSATILITY: Tu sirf JEE/NEET ke liye nahi hai. Agar student SST, Boards, ya general life advice puche, toh respect se guide kar. Har bacche ko competitive exam ke liye force MAT kar. 11th/12th ke har student ka goal alag ho sakta hai.
2. DIRECT & CRISP: Be on-point. No unnecessary fluff.
3. LANGUAGE: Natural Hinglish (Mix of Hindi & English).
4. LENGTH: Keep answers SHORT (3-5 lines for simple doubts, elaborate ONLY for complex concepts).
5. VISUAL APPEAL: Use **bold** for key terms and emojis smartly: 🎯 💡 ✨ ⚡ 🔥 📌 ✅
6. FORMULAS: Write Greek letters properly: α (alpha), β (beta), γ (gamma), δ (delta), θ (theta), λ (lambda), μ (mu), σ (sigma), π (pi), ω (omega), Δ (Delta), Σ (Sigma), ∞ (infinity).
7. SYMBOLS: Use symbols: → (arrow), ≈ (approximately), ≠ (not equal), ≥ ≤ (greater/less equal), ² ³ (superscripts).

FORMATTING:
**Hello Puttar!** 🧞‍♂️ [Subject Greeting]

💡 **[Direct Answer/Concept]**
• Key point 1
• Key point 2

✨ **Pro Tip:** [Quick trick/logic if relevant]

CLOSING:
NEVER use repetitive phrases like "Kar de solve" or "Ab samjha na". 
Be natural and encouraging: "Umeed hai clarity mil gayi!", "Ise try karo, maza aayega!", "All the best, phod dena!", "Koi aur doubt ho toh JEEnie yahi hai!"`;

    // Include conversation history for context memory
    const historyContext = conversationHistory 
      ? `\n\nPrevious conversation (for context, remember what was discussed):\n${conversationHistory}\n\n`
      : "";
    
    const fullPrompt = `${systemPrompt}${historyContext}\n\nCurrent question/doubt:\n${contextPrompt}\n\nAb answer do (remember previous context if any):`;

    // Call Gemini API with retry logic
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    console.log("🌐 API URL:", apiUrl.replace(GEMINI_API_KEY, "***"));

    let geminiResponse: Response | null = null;
    let retryCount = 0;
    const maxRetries = 2;

    // Retry logic for transient failures (Full Original Logic)
    while (retryCount <= maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

        geminiResponse = await fetch(apiUrl, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: fullPrompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2000,
              topK: 40,
              topP: 0.95,
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        
        // Check if response is retriable error (503 service unavailable, 429 rate limit)
        if (geminiResponse.status === 503 || geminiResponse.status === 429) {
          retryCount++;
          const errorText = await geminiResponse.text();
          console.warn(`⚠️ Retriable error (${geminiResponse.status}) on attempt ${retryCount}:`, errorText);
          
          if (retryCount > maxRetries) {
            console.error("❌ All retry attempts exhausted");
            return new Response(
              JSON.stringify({ 
                error: "SERVICE_UNAVAILABLE", 
                message: "JEEnie is temporarily overloaded. Please try again in a moment."
              }),
              { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          const backoffMs = 2000 * Math.pow(2, retryCount - 1);
          console.log(`⏳ Waiting ${backoffMs}ms before retry ${retryCount}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue; 
        }
        
        break; 
        
      } catch (fetchError) {
        retryCount++;
        console.warn(`⚠️ Network error on attempt ${retryCount}:`, fetchError);
        
        if (retryCount > maxRetries) {
          console.error("❌ All retry attempts failed due to network errors");
          return new Response(
            JSON.stringify({ 
              error: "SERVICE_TIMEOUT", 
              message: "JEEnie is taking too long to respond. Please try again."
            }),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const backoffMs = 1000 * Math.pow(2, retryCount - 1);
        console.log(`⏳ Waiting ${backoffMs}ms before retry ${retryCount}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }

    // Safety check
    if (!geminiResponse) {
      console.error("❌ No response received after retries");
      return new Response(
        JSON.stringify({ 
          error: "SERVICE_ERROR", 
          message: "JEEnie is temporarily unavailable. Please try again."
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("📡 Gemini API response status:", geminiResponse.status);

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("❌ Gemini API error:", geminiResponse.status, errorText);
      
      if (geminiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "RATE_LIMIT", message: "Too many requests. Please wait." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "GEMINI_API_ERROR", message: "AI service temporarily unavailable", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await geminiResponse.json();
    console.log("📦 Response received, parsing...");
    
    // Check for safety blocks
    if (data.candidates?.[0]?.finishReason === "SAFETY") {
      console.warn("⚠️ Response blocked by safety filters");
      return new Response(
        JSON.stringify({ 
          error: "SAFETY_BLOCK", 
          message: "Response was filtered for safety. Please rephrase your question."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    if (!content || content.trim() === "") {
      console.error("❌ Empty response from Gemini.");
      return new Response(
        JSON.stringify({ 
          error: "EMPTY_RESPONSE", 
          message: "JEEnie couldn't generate a response. Please try again."
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log success metrics
    console.log("✅ Success - Content length:", content.length);
    console.log("📊 Tokens used:", data.usageMetadata?.totalTokenCount || 'N/A');

    return new Response(
      JSON.stringify({ content: content.trim() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Unhandled error in jeenie function:", error);
    return new Response(
      JSON.stringify({ 
        error: "INTERNAL_ERROR", 
        message: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
