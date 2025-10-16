import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Asset {
  id: string;
  asset_type: string;
  content: string;
  metadata: any;
}

interface Campaign {
  id: string;
  campaign_name: string;
  platform: string;
  goal: string;
  tone: string;
  target_audience: string;
  product_description: string;
}

interface CampaignPreviewProps {
  campaignId: string;
}

const CampaignPreview = ({ campaignId }: CampaignPreviewProps) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campaignRes, assetsRes] = await Promise.all([
          supabase.from("campaigns").select("*").eq("id", campaignId).single(),
          supabase.from("ad_assets").select("*").eq("campaign_id", campaignId),
        ]);

        if (campaignRes.error) throw campaignRes.error;
        if (assetsRes.error) throw assetsRes.error;

        setCampaign(campaignRes.data);
        setAssets(assetsRes.data || []);
      } catch (error: any) {
        toast({
          title: "Error loading campaign",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [campaignId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Text has been copied successfully.",
    });
  };

  const downloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `ad-image-${index + 1}.png`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return <div>Campaign not found</div>;
  }

  const headlines = assets.filter((a) => a.asset_type === "headline");
  const descriptions = assets.filter((a) => a.asset_type === "description");
  const ctas = assets.filter((a) => a.asset_type === "cta");
  const images = assets.filter((a) => a.asset_type === "image");

  return (
    <div className="space-y-6">
      {/* Campaign Info */}
      <Card className="p-6 border-primary/20 bg-gradient-to-br from-card via-card to-secondary/30">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {campaign.campaign_name}
              </h1>
              <p className="text-muted-foreground mt-2">{campaign.product_description}</p>
            </div>
            <Badge variant="outline" className="capitalize">
              {campaign.platform}
            </Badge>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Goal:</span>
              <p className="font-medium">{campaign.goal}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Tone:</span>
              <p className="font-medium capitalize">{campaign.tone}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Target Audience:</span>
              <p className="font-medium">{campaign.target_audience || "General"}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Assets */}
      <Tabs defaultValue="headlines" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-secondary">
          <TabsTrigger value="headlines">Headlines</TabsTrigger>
          <TabsTrigger value="descriptions">Descriptions</TabsTrigger>
          <TabsTrigger value="ctas">CTAs</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>

        <TabsContent value="headlines" className="space-y-3">
          {headlines.map((headline, index) => (
            <Card key={headline.id} className="p-4 bg-card border-border/50">
              <div className="flex items-start justify-between gap-4">
                <p className="font-medium text-foreground flex-1">{headline.content}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(headline.content)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="descriptions" className="space-y-3">
          {descriptions.map((desc) => (
            <Card key={desc.id} className="p-4 bg-card border-border/50">
              <div className="flex items-start justify-between gap-4">
                <p className="text-foreground flex-1">{desc.content}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(desc.content)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="ctas" className="space-y-3">
          {ctas.map((cta) => (
            <Card key={cta.id} className="p-4 bg-card border-border/50">
              <div className="flex items-start justify-between gap-4">
                <p className="font-semibold text-accent flex-1">{cta.content}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(cta.content)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="images" className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <Card key={image.id} className="overflow-hidden border-border/50 bg-card">
              <img
                src={image.content}
                alt={`Ad visual ${index + 1}`}
                className="w-full aspect-square object-cover"
              />
              <div className="p-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadImage(image.content, index)}
                  className="w-full"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CampaignPreview;
