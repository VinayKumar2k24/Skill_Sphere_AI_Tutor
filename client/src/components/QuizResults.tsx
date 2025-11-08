import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, TrendingUp, ChevronDown, ChevronUp, Brain } from "lucide-react";
import { useState } from "react";

interface QuestionResult {
  question: string;
  options: string[];
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
}

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  skillLevel: "Beginner" | "Intermediate" | "Advanced";
  domain?: string;
  results?: QuestionResult[];
  topicBreakdown?: { topic: string; correct: number; total: number }[];
  onViewCourses: () => void;
  onRetakeQuiz?: () => void;
}

export default function QuizResults({
  score,
  totalQuestions,
  skillLevel,
  domain,
  results = [],
  topicBreakdown,
  onViewCourses,
  onRetakeQuiz
}: QuizResultsProps) {
  const [showDetails, setShowDetails] = useState(false);
  const percentage = Math.round((score / totalQuestions) * 100);
  
  const levelColors = {
    Beginner: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    Intermediate: "bg-chart-1/10 text-chart-1 border-chart-1/20",
    Advanced: "bg-chart-3/10 text-chart-3 border-chart-3/20"
  };

  const getMessage = () => {
    if (percentage >= 80) return "Excellent work!";
    if (percentage >= 60) return "Good job!";
    return "Keep learning!";
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Card className="p-8 mb-6 text-center">
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-primary/10 mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary" data-testid="quiz-score">
              {percentage}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {score}/{totalQuestions}
            </div>
          </div>
        </div>

        <h2 className="font-display font-bold text-3xl mb-2 text-foreground">
          {getMessage()}
        </h2>
        
        <p className="text-muted-foreground mb-4">
          Based on your performance{domain ? ` in ${domain}` : ""}, you're at a{" "}
          <Badge variant="outline" className={levelColors[skillLevel]} data-testid="skill-level-badge">
            {skillLevel}
          </Badge>
          {" "}level
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <Button size="lg" onClick={onViewCourses} data-testid="button-view-courses" className="glow-primary">
            <TrendingUp className="mr-2 h-5 w-5" />
            View Recommended Courses
          </Button>
          
          {/* Show retake button for Beginner and Intermediate levels to help AI better assess skills */}
          {onRetakeQuiz && (skillLevel === "Beginner" || skillLevel === "Intermediate") && (
            <Button 
              size="lg" 
              variant="default"
              onClick={onRetakeQuiz}
              data-testid="button-retake-quiz"
              className="glow-secondary"
            >
              <Brain className="mr-2 h-5 w-5" />
              Retake Quiz
            </Button>
          )}
          
          {results && results.length > 0 && (
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => setShowDetails(!showDetails)}
              data-testid="button-toggle-details"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="mr-2 h-5 w-5" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-5 w-5" />
                  View Detailed Results
                </>
              )}
            </Button>
          )}
        </div>
        
        {/* Helpful message for Beginner/Intermediate users */}
        {(skillLevel === "Beginner" || skillLevel === "Intermediate") && (
          <p className="text-sm text-muted-foreground mt-4 max-w-md mx-auto">
            Want to improve your score? Retake the quiz to help our AI better understand your skills and recommend more suitable courses.
          </p>
        )}
      </Card>

      {showDetails && results && results.length > 0 && (
        <Card className="p-6 mb-6">
          <h3 className="font-display font-semibold text-xl mb-4">Question-by-Question Review</h3>
          <div className="space-y-6">
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-md border ${
                  result.isCorrect 
                    ? "bg-chart-3/5 border-chart-3/20" 
                    : "bg-destructive/5 border-destructive/20"
                }`}
                data-testid={`question-result-${index}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  {result.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-chart-3 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-foreground mb-3">
                      Question {index + 1}: {result.question}
                    </p>
                    <div className="space-y-2">
                      {result.options.map((option, optIndex) => {
                        const isUserAnswer = optIndex === result.userAnswer;
                        const isCorrectAnswer = optIndex === result.correctAnswer;
                        
                        return (
                          <div
                            key={optIndex}
                            className={`p-2 rounded text-sm ${
                              isCorrectAnswer
                                ? "bg-chart-3/10 border border-chart-3/30 text-chart-3 font-medium"
                                : isUserAnswer
                                ? "bg-destructive/10 border border-destructive/30 text-destructive"
                                : "bg-muted/30 text-muted-foreground"
                            }`}
                          >
                            {isCorrectAnswer && <CheckCircle2 className="inline h-4 w-4 mr-2" />}
                            {isUserAnswer && !isCorrectAnswer && <XCircle className="inline h-4 w-4 mr-2" />}
                            {option}
                            {isCorrectAnswer && <span className="ml-2 text-xs">(Correct)</span>}
                            {isUserAnswer && !isCorrectAnswer && <span className="ml-2 text-xs">(Your answer)</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {topicBreakdown && topicBreakdown.length > 0 && (
        <Card className="p-6">
          <h3 className="font-display font-semibold text-xl mb-4">Topic Breakdown</h3>
          <div className="space-y-4">
            {topicBreakdown.map((topic, index) => {
              const topicPercentage = Math.round((topic.correct / topic.total) * 100);
              return (
                <div key={index} className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground" data-testid={`topic-name-${index}`}>
                        {topic.topic}
                      </span>
                      <span className="text-sm text-muted-foreground" data-testid={`topic-score-${index}`}>
                        {topic.correct}/{topic.total}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${topicPercentage}%` }}
                      />
                    </div>
                  </div>
                  {topicPercentage >= 70 ? (
                    <CheckCircle2 className="h-5 w-5 text-chart-3 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}