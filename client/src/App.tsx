import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import Dashboard from "@/pages/Dashboard";
import AssessmentPage from "@/pages/AssessmentPage";
import CoursesPage from "@/pages/CoursesPage";
import MentorPage from "@/pages/MentorPage";
import SchedulePage from "@/pages/SchedulePage";
import SettingsPage from "@/pages/SettingsPage";
import OnboardingFlow from "@/components/OnboardingFlow";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/onboarding" component={() => (
        <ProtectedRoute>
          <OnboardingFlow onComplete={async (data) => {
            try {
              console.log('Onboarding complete:', data);
              
              const userId = localStorage.getItem('userId');
              if (!userId) {
                window.location.href = '/login';
                return;
              }
              
              // Save user domains
              const response = await fetch('/api/user/onboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, domains: data.domains })
              });
              
              if (!response.ok) throw new Error('Failed to onboard user');
              
              const result = await response.json();
              
              // Store user data
              localStorage.setItem('selectedDomains', JSON.stringify(data.domains));
              
              window.location.href = '/assessments';
            } catch (error) {
              console.error('Onboarding error:', error);
              alert('Failed to complete onboarding. Please try again.');
            }
          }} />
        </ProtectedRoute>
      )} />
      <Route path="/dashboard" component={() => <ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/assessments" component={() => <ProtectedRoute><AssessmentPage /></ProtectedRoute>} />
      <Route path="/courses" component={() => <ProtectedRoute><CoursesPage /></ProtectedRoute>} />
      <Route path="/mentor" component={() => <ProtectedRoute><MentorPage /></ProtectedRoute>} />
      <Route path="/schedule" component={() => <ProtectedRoute><SchedulePage /></ProtectedRoute>} />
      <Route path="/settings" component={() => <ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;