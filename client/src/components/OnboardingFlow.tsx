import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Brain } from "lucide-react";

const DOMAINS = [
  "Web Development",
  "Data Science",
  "Mobile Development",
  "Machine Learning",
  "Cloud Computing",
  "Cybersecurity",
  "DevOps",
  "UI/UX Design",
  "IoT (Internet of Things)",
  "Space Technology",
  "Hardware"
];

interface OnboardingFlowProps {
  onComplete: (data: { domains: string[] }) => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

  const toggleDomain = (domain: string) => {
    setSelectedDomains(prev =>
      prev.includes(domain)
        ? prev.filter(d => d !== domain)
        : [...prev, domain]
    );
  };

  const handleNext = () => {
    console.log('Onboarding complete:', { selectedDomains });
    onComplete({ domains: selectedDomains });
  };

  const canProceed = () => {
    return selectedDomains.length > 0;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-2xl">
        <Card className="p-8">
          {(
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <h2 className="font-display font-bold text-3xl mb-2">Choose Your Interests</h2>
                <p className="text-muted-foreground">Select domains you'd like to explore</p>
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                {DOMAINS.map((domain) => (
                  <Badge
                    key={domain}
                    variant={selectedDomains.includes(domain) ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2 text-sm hover-elevate"
                    onClick={() => toggleDomain(domain)}
                    data-testid={`domain-${domain.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {domain}
                  </Badge>
                ))}
              </div>

              <div className="mt-8 p-4 rounded-md bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">What's Next?</h3>
                    <p className="text-sm text-muted-foreground">
                      We'll generate a personalized quiz to assess your skill level in the domains you've selected. 
                      This helps us recommend the perfect courses for your learning journey.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end mt-8 pt-6 border-t">
            <Button onClick={handleNext} disabled={!canProceed()} data-testid="button-continue">
              Start Assessment
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}