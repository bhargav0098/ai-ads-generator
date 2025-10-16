import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, Plus, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CampaignForm from "@/components/CampaignForm";
import CampaignList from "@/components/CampaignList";

const Dashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out successfully",
      description: "See you next time!",
    });
    navigate("/auth");
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-card/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  AI Ads Generator
                </h1>
                <p className="text-xs text-muted-foreground">Multi-modal campaign creation</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!showForm ? (
          <div className="space-y-8">
            {/* Hero Section */}
            <Card className="p-8 border-primary/20 bg-gradient-to-br from-card via-card to-secondary/30 shadow-card">
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent">
                  Create AI-Powered Ad Campaigns
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Generate professional ad copy and stunning visuals instantly with advanced AI models
                </p>
                <Button
                  variant="hero"
                  size="lg"
                  onClick={() => setShowForm(true)}
                  className="mt-4"
                >
                  <Plus className="h-5 w-5" />
                  Create New Campaign
                </Button>
              </div>
            </Card>

            {/* Campaign List */}
            <CampaignList />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => setShowForm(false)}
              className="mb-4"
            >
              ← Back to Dashboard
            </Button>
            <CampaignForm onSuccess={() => setShowForm(false)} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
