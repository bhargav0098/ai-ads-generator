import { serve } from "serve";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productDescription, platform, goal, tone, targetAudience } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Platform-specific character limits
    const platformLimits: Record<string, { headline: number; description: number }> = {
      meta: { headline: 40, description: 125 },
      google: { headline: 30, description: 90 },
      tiktok: { headline: 100, description: 2200 },
      linkedin: { headline: 70, description: 150 },
      twitter: { headline: 280, description: 280 },
      all: { headline: 60, description: 150 },
    };

    const limits = platformLimits[platform] || platformLimits.all;

    const systemPrompt = `You are an expert ad copywriter specializing in ${platform} ads. Create compelling, conversion-focused ad copy that:
- Matches the ${tone} tone
- Targets: ${targetAudience || "general audience"}
- Achieves goal: ${goal}
- Follows ${platform} best practices and character limits
- Uses power words and emotional triggers
- Includes clear value propositions`;

    const userPrompt = `Create ad copy for: ${productDescription}

Generate 3 variations each for:
1. Headlines (max ${limits.headline} chars)
2. Descriptions (max ${limits.description} chars)
3. Call-to-Action phrases (max 25 chars)

Return ONLY valid JSON in this exact format:
{
  "headlines": ["headline 1", "headline 2", "headline 3"],
  "descriptions": ["description 1", "description 2", "description 3"],
  "ctas": ["cta 1", "cta 2", "cta 3"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Insufficient credits. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content generated");
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonContent = content.trim();
    if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    }

    const adCopy = JSON.parse(jsonContent);

    return new Response(JSON.stringify(adCopy), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-ad-copy:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
