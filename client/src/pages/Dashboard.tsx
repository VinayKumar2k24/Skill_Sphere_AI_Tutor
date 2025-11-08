import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  TrendingUp, 
  Award, 
  Clock, 
  Target,
  ArrowRight,
  FileQuestion,
  Calendar,
  MessageCircle,
  Loader2,
  CheckCircle2,
  ExternalLink
} from "lucide-react";

export default function Dashboard() {
  const userId = localStorage.getItem('userId') || 'demo-user-123';
  const userName = localStorage.getItem('userName') || 'User';
  const selectedDomains = JSON.parse(localStorage.getItem('selectedDomains') || '[]');

  // Fetch user skill levels
  const { data: skillLevels = {} } = useQuery<Record<string, string>>({
    queryKey: ['/api/user', userId, 'skills'],
    enabled: !!userId,
  });

  // Fetch enrolled courses
  const { data: enrolledData } = useQuery<{ courses: any[] }>({
    queryKey: ['/api/user', userId, 'enrolled'],
    enabled: !!userId,
  });

  // Fetch schedule
  const { data: scheduleData } = useQuery<{ items: any[] }>({
    queryKey: ['/api/schedule', userId],
    enabled: !!userId,
  });

  const enrolledCourses = enrolledData?.courses || [];
  const upcomingSchedule = (scheduleData?.items || []).filter((item: any) => !item.completed).slice(0, 3);
  const skillsAssessed = Object.keys(skillLevels).length;

  const getLevelBadgeColor = (level: string) => {
    const colors: Record<string, string> = {
      'Beginner': 'bg-chart-4/10 text-chart-4 border-chart-4/20',
      'Intermediate': 'bg-chart-1/10 text-chart-1 border-chart-1/20',
      'Advanced': 'bg-chart-3/10 text-chart-3 border-chart-3/20',
    };
    return colors[level] || 'bg-muted';
  };

  return (
    <DashboardLayout userName={userName}>
      <div className="space-y-8">
        <div>
          <h1 className="font-display font-bold text-3xl mb-2" data-testid="dashboard-welcome">
            Welcome back, {userName}!
          </h1>
          <p className="text-muted-foreground">Track your learning progress and continue your journey</p>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-md bg-chart-1/10">
                <BookOpen className="h-5 w-5 text-chart-1" />
              </div>
            </div>
            <div className="text-2xl font-bold" data-testid="stat-enrolled-courses">{enrolledCourses.length}</div>
            <p className="text-sm text-muted-foreground">Enrolled Courses</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-md bg-chart-3/10">
                <Award className="h-5 w-5 text-chart-3" />
              </div>
            </div>
            <div className="text-2xl font-bold" data-testid="stat-skills-assessed">{skillsAssessed}</div>
            <p className="text-sm text-muted-foreground">Skills Assessed</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-md bg-chart-5/10">
                <Target className="h-5 w-5 text-chart-5" />
              </div>
            </div>
            <div className="text-2xl font-bold" data-testid="stat-selected-domains">{selectedDomains.length}</div>
            <p className="text-sm text-muted-foreground">Learning Domains</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-md bg-chart-2/10">
                <Clock className="h-5 w-5 text-chart-2" />
              </div>
            </div>
            <div className="text-2xl font-bold" data-testid="stat-upcoming-items">{upcomingSchedule.length}</div>
            <p className="text-sm text-muted-foreground">Upcoming Tasks</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Skills Overview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-semibold text-xl">Your Skills</h2>
              <Link href="/assessments">
                <Button variant="ghost" size="sm" data-testid="button-view-assessments">
                  <FileQuestion className="h-4 w-4 mr-2" />
                  Take Quiz
                </Button>
              </Link>
            </div>
            
            {skillsAssessed === 0 ? (
              <div className="text-center py-8">
                <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No skills assessed yet</p>
                <Link href="/assessments">
                  <Button data-testid="button-start-assessment">
                    Start Your First Assessment
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(skillLevels).map(([domain, level]) => (
                  <div key={domain} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <p className="font-medium" data-testid={`skill-domain-${domain}`}>{domain}</p>
                    </div>
                    <Badge variant="outline" className={getLevelBadgeColor(level)} data-testid={`skill-level-${domain}`}>
                      {level}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Enrolled Courses */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-semibold text-xl">Enrolled Courses</h2>
              <Link href="/courses">
                <Button variant="ghost" size="sm" data-testid="button-browse-courses">
                  Browse All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            {enrolledCourses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No courses enrolled yet</p>
                <Link href="/courses">
                  <Button data-testid="button-explore-courses">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Explore Courses
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {enrolledCourses.slice(0, 3).map((course: any) => (
                  <div key={course.id} className="p-3 rounded-lg border hover-elevate" data-testid={`enrolled-course-${course.id}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{course.title}</p>
                          {course.completed && (
                            <CheckCircle2 className="h-4 w-4 text-chart-3 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{course.provider}</p>
                      </div>
                      <a 
                        href={course.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover-elevate p-2 rounded-md"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={course.progress || 0} className="flex-1 h-2" />
                      <span className="text-xs font-medium text-muted-foreground min-w-[3rem] text-right">
                        {course.progress || 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/courses">
            <Card className="p-6 glow-subtle cursor-pointer" data-testid="card-quick-action-courses">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Browse Courses</h3>
                  <p className="text-sm text-muted-foreground">Discover personalized recommendations</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/schedule">
            <Card className="p-6 glow-subtle cursor-pointer" data-testid="card-quick-action-schedule">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-chart-1/10">
                  <Calendar className="h-6 w-6 text-chart-1" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">View Schedule</h3>
                  <p className="text-sm text-muted-foreground">Check your learning timeline</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/mentor">
            <Card className="p-6 glow-subtle cursor-pointer" data-testid="card-quick-action-mentor">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-chart-3/10">
                  <MessageCircle className="h-6 w-6 text-chart-3" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">AI Mentor</h3>
                  <p className="text-sm text-muted-foreground">Get personalized guidance</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}