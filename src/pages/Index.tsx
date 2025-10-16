import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Target, TrendingUp } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-glow mb-4">
            <Sparkles className="h-10 w-10 text-primary-foreground" />
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent leading-tight">
            AI Ads Generator
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Create professional ad campaigns in seconds with advanced AI. Generate compelling copy and stunning visuals for any platform.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              variant="hero"
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6"
            >
              Get Started Free
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6 bg-secondary/50"
            >
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-secondary/30 shadow-card hover:shadow-glow transition-all duration-300">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-foreground">Lightning Fast</h3>
            <p className="text-muted-foreground">
              Generate complete ad campaigns in under 60 seconds. No more hours spent on copywriting.
            </p>
          </div>

          <div className="p-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-secondary/30 shadow-card hover:shadow-glow transition-all duration-300">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-foreground">Multi-Platform</h3>
            <p className="text-muted-foreground">
              Optimized for Meta, Google, TikTok, LinkedIn, and more. One tool for all platforms.
            </p>
          </div>

          <div className="p-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-secondary/30 shadow-card hover:shadow-glow transition-all duration-300">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-foreground">Higher ROI</h3>
            <p className="text-muted-foreground">
              AI-optimized copy and visuals designed to maximize engagement and conversions.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-secondary/30 shadow-card">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Ready to Transform Your Ad Game?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of marketers using AI to create better ads, faster.
          </p>
          <Button
            variant="glow"
            size="lg"
            onClick={() => navigate("/auth")}
            className="text-lg px-12 py-6"
          >
            <Sparkles className="h-5 w-5" />
            Start Creating Now
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
