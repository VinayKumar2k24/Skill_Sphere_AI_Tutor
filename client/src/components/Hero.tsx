import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Brain, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import heroImage from "@assets/stock_images/futuristic_ai_learni_56654220.jpg";
import hero3DImage from "@assets/generated_images/3D_futuristic_AI_learning_hologram_f76a1649.png";

export default function Hero() {
  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative overflow-hidden bg-black">
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Students learning with technology" 
          className="w-full h-full object-cover opacity-25"
        />
        {/* Strong dark wash for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/98 via-black/90 to-black/70" />
        <div className="absolute inset-0 bg-black/40" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div className="max-w-2xl">
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-6 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] leading-tight">
              Master New Skills with <span className="text-primary neon-glow">AI-Powered</span> Learning
            </h1>
            <p className="text-lg sm:text-xl text-gray-200 mb-8 leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
              Take personalized skill assessments, receive intelligent course recommendations, and track your progress with an AI mentor by your side.
            </p>
            
            <div className="flex flex-wrap gap-4 mb-12">
              <Link href="/signup">
                <Button size="lg" className="glow-primary pop-on-click" data-testid="button-get-started">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="backdrop-blur-md bg-background/60 border-border/50 hover:bg-background/80" onClick={scrollToHowItWorks} data-testid="button-how-it-works">
                How It Works
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade-in">
              <div className="flex items-start gap-3 p-3 rounded-lg backdrop-blur-sm bg-card/40 border border-border/30 glow-subtle">
                <div className="p-2 rounded-md bg-primary/10 flex-shrink-0">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">AI Assessments</h3>
                  <p className="text-sm text-muted-foreground">Adaptive quizzes that match your level</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg backdrop-blur-sm bg-card/40 border border-border/30 glow-subtle">
                <div className="p-2 rounded-md bg-primary/10 flex-shrink-0">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Smart Courses</h3>
                  <p className="text-sm text-muted-foreground">Personalized learning paths</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg backdrop-blur-sm bg-card/40 border border-border/30 glow-subtle">
                <div className="p-2 rounded-md bg-primary/10 flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Track Progress</h3>
                  <p className="text-sm text-muted-foreground">Visual insights and analytics</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - 3D Image */}
          <div className="relative hidden lg:block">
            <div className="relative group">
              <img 
                src={hero3DImage} 
                alt="3D AI Learning Hologram" 
                className="w-full h-auto max-w-xl mx-auto drop-shadow-[0_0_40px_rgba(0,255,255,0.3)] group-hover:drop-shadow-[0_0_60px_rgba(0,255,255,0.5)] transition-all duration-500 animate-float"
              />
              {/* Glow effect behind 3D image */}
              <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full scale-75 group-hover:scale-90 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
