import Hero from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Target, Zap, Award, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Hero />
      
      <section id="how-it-works" className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">How It Works</Badge>
            <h2 className="font-display font-bold text-3xl sm:text-4xl mb-4">
              Your Path to Mastery in 4 Steps
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform adapts to your learning style and pace
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center glow-subtle animate-fade-in">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">Take Assessment</h3>
              <p className="text-sm text-muted-foreground">
                AI generates personalized quizzes to understand your current skill level
              </p>
            </Card>

            <Card className="p-6 text-center glow-subtle animate-fade-in">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">Get Recommendations</h3>
              <p className="text-sm text-muted-foreground">
                Receive curated course suggestions tailored to your goals
              </p>
            </Card>

            <Card className="p-6 text-center glow-subtle animate-fade-in">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">Learn & Practice</h3>
              <p className="text-sm text-muted-foreground">
                Follow your personalized schedule with AI mentor support
              </p>
            </Card>

            <Card className="p-6 text-center glow-subtle animate-fade-in">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">Track Progress</h3>
              <p className="text-sm text-muted-foreground">
                Monitor your growth with detailed analytics and insights
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-3xl sm:text-4xl mb-4">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of learners who are achieving their goals with AI-powered personalization
          </p>
          <Link href="/signup">
            <Button size="lg" className="glow-primary pop-on-click" data-testid="button-cta-bottom">
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}