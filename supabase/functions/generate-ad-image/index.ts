import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { Redis } from "https://deno.land/x/upstash_redis@v1.22.0/mod.ts";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

// --- Constants ---
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": Deno.env.get("CORS_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};
const CACHE_KEY_PREFIX = "ad-image:";
const CACHE_EXPIRATION_SECONDS = 60 * 60 * 24; // 24 hours
const AI_MODEL = Deno.env.get("AI_IMAGE_MODEL") || "google/gemini-2.5-flash-image-preview";
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// --- Redis Client ---
const redis = new Redis({
  url: Deno.env.get("UPSTASH_REDIS_REST_URL")!,
  token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN")!,
});

// --- Platform-specific Image Specs ---
const PLATFORM_SPECS: Record<string, string> = {
  meta: "1080x1080 square format, vibrant colors, eye-catching",
  google: "1200x628 landscape, professional, clean design",
  tiktok: "1080x1920 vertical, dynamic, trendy aesthetic",
  linkedin: "1200x627 professional, business-focused, clean",
  twitter: "1200x675 landscape, bold graphics, high contrast",
  all: "1200x1200 square, versatile, professional",
};

// --- Type Definitions ---
interface AdImageRequest {
  productDescription: string;
  platform: string;
  tone: string;
  headline: string;
}

interface AiGatewayResponse {
  choices?: {
    message?: {
      images?: {
        image_url?: {
          url: string;
        };
      }[];
    };
  }[];
}

// --- Helper Functions ---
function buildImagePrompt({ productDescription, platform, tone, headline }: AdImageRequest): string {
  const imageSpec = PLATFORM_SPECS[platform] || PLATFORM_SPECS.all;
  return `Create a professional ${platform} ad image for: ${productDescription}

Style: ${tone}
Headline: ${headline}
Format: ${imageSpec}

Requirements:
- High-quality, professional product photography or illustration
- ${tone} aesthetic matching the brand voice
- Clear focal point on the product/service
- Optimized for ${platform} advertising
- No text overlays (text will be added separately)
- Eye-catching composition that stops scrolling
- Brand-appropriate color palette`;
}

async function hash(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// --- Main Handler ---
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const body: AdImageRequest = await req.json();
    const { productDescription, platform, tone, headline } = body;

    if (!productDescription || !platform || !tone || !headline) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }

    const cacheKey = `${CACHE_KEY_PREFIX}${await hash(JSON.stringify(body))}`;
    const cachedImage = await redis.get<string>(cacheKey);

    if (cachedImage) {
      return new Response(JSON.stringify({ imageUrl: cachedImage, fromCache: true }), {
        headers: CORS_HEADERS,
      });
    }

    const imagePrompt = buildImagePrompt(body);

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      const statusMap: Record<number, string> = {
        429: "Rate limit exceeded. Please try again later.",
        402: "Insufficient credits. Please add funds to continue.",
      };

      const errorMessage = statusMap[response.status] || `AI gateway error: ${response.status}`;
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: response.status,
        headers: CORS_HEADERS,
      });
    }

    const data: AiGatewayResponse = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image URL found in AI gateway response:", JSON.stringify(data, null, 2));
      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }

    await redis.set(cacheKey, imageUrl, { ex: CACHE_EXPIRATION_SECONDS });

    return new Response(JSON.stringify({ imageUrl, fromCache: false }), {
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error("Unhandled error:", error);
    if (error instanceof SyntaxError) {
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
});