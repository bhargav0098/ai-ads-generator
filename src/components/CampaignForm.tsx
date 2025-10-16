import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";

interface CampaignFormProps {
  onSuccess: () => void;
}

const CampaignForm = ({ onSuccess }: CampaignFormProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    campaignName: "",
    platform: "all",
    goal: "",
    tone: "professional",
    targetAudience: "",
    productDescription: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          user_id: user.id,
          campaign_name: formData.campaignName,
          platform: formData.platform,
          goal: formData.goal,
          tone: formData.tone,
          target_audience: formData.targetAudience,
          product_description: formData.productDescription,
          status: "generating",
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Generate ad copy
      const copyResponse = await supabase.functions.invoke("generate-ad-copy", {
        body: {
          productDescription: formData.productDescription,
          platform: formData.platform,
          goal: formData.goal,
          tone: formData.tone,
          targetAudience: formData.targetAudience,
        },
      });

      if (copyResponse.error) throw copyResponse.error;

      const { headlines, descriptions, ctas } = copyResponse.data;

      // Save headlines
      for (const headline of headlines) {
        await supabase.from("ad_assets").insert({
          campaign_id: campaign.id,
          asset_type: "headline",
          content: headline,
        });
      }

      // Save descriptions
      for (const description of descriptions) {
        await supabase.from("ad_assets").insert({
          campaign_id: campaign.id,
          asset_type: "description",
          content: description,
        });
      }

      // Save CTAs
      for (const cta of ctas) {
        await supabase.from("ad_assets").insert({
          campaign_id: campaign.id,
          asset_type: "cta",
          content: cta,
        });
      }

      // Generate images (3 variations)
      for (let i = 0; i < 3; i++) {
        const imageResponse = await supabase.functions.invoke("generate-ad-image", {
          body: {
            productDescription: formData.productDescription,
            platform: formData.platform,
            tone: formData.tone,
            headline: headlines[i % headlines.length],
          },
        });

        if (!imageResponse.error && imageResponse.data?.imageUrl) {
          await supabase.from("ad_assets").insert({
            campaign_id: campaign.id,
            asset_type: "image",
            content: imageResponse.data.imageUrl,
          });
        }
      }

      // Update campaign status
      await supabase
        .from("campaigns")
        .update({ status: "completed" })
        .eq("id", campaign.id);

      toast({
        title: "Campaign created successfully! 🎉",
        description: "Your AI-generated ad campaign is ready.",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error creating campaign:", error);
      toast({
        title: "Error creating campaign",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 border-primary/20 bg-gradient-to-br from-card via-card to-secondary/30 shadow-card">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            New AI Campaign
          </h2>
          <p className="text-muted-foreground mt-2">Fill in the details to generate your ad campaign</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="campaignName">Campaign Name</Label>
            <Input
              id="campaignName"
              placeholder="e.g., Summer Sale 2025"
              value={formData.campaignName}
              onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
              required
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="meta">Meta (Facebook/Instagram)</SelectItem>
                <SelectItem value="google">Google Ads</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="twitter">Twitter/X</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Campaign Goal</Label>
            <Input
              id="goal"
              placeholder="e.g., Increase sales by 30%"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              required
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">Tone</Label>
            <Select value={formData.tone} onValueChange={(value) => setFormData({ ...formData, tone: value })}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="playful">Playful</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="inspirational">Inspirational</SelectItem>
                <SelectItem value="educational">Educational</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAudience">Target Audience</Label>
          <Input
            id="targetAudience"
            placeholder="e.g., Young professionals aged 25-35"
            value={formData.targetAudience}
            onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
            className="bg-secondary border-border"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="productDescription">Product/Service Description</Label>
          <Textarea
            id="productDescription"
            placeholder="Describe what you're advertising in detail..."
            value={formData.productDescription}
            onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
            required
            rows={4}
            className="bg-secondary border-border"
          />
        </div>

        <Button
          type="submit"
          variant="glow"
          size="lg"
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating Campaign...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Generate AI Campaign
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};

export default CampaignForm;
