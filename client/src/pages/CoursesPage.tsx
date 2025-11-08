import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Clock, 
  Star, 
  ExternalLink, 
  Filter, 
  Search, 
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
  provider: string;
  url: string;
  domain: string;
  skillLevel: string;
  price: number;
  rating: number;
  duration: string;
  description: string;
  isFree: boolean;
  courseId?: string; // For enrolled courses from database
}

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const { toast } = useToast();

  const userId = localStorage.getItem('userId') || 'demo-user-123';
  const userName = localStorage.getItem('userName') || 'User';
  const selectedDomains = JSON.parse(localStorage.getItem('selectedDomains') || '[]');

  // Fetch user skill levels
  const { data: skillLevels = {} } = useQuery<Record<string, string>>({
    queryKey: ['/api/user', userId, 'skills'],
    enabled: !!userId,
  });

  // Fetch recommended courses
  const { data: coursesData, isLoading } = useQuery<{ courses: Course[] }>({
    queryKey: selectedDomain 
      ? ['/api/courses/recommendations', userId, selectedDomain]
      : ['/api/courses/recommendations', userId],
    enabled: !!userId,
  });

  // Fetch enrolled courses
  const { data: enrolledCoursesData, isLoading: isLoadingEnrolled } = useQuery<{ courses: Course[] }>({
    queryKey: ['/api/user', userId, 'enrolled'],
    enabled: !!userId,
  });

  // Enroll in course mutation
  const enrollMutation = useMutation({
    mutationFn: async (course: Course) => {
      const res = await apiRequest('POST', '/api/courses/enroll', {
        userId,
        courseId: course.id,
        title: course.title,
        provider: course.provider,
        url: course.url,
        domain: course.domain,
        isPaid: !course.isFree,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user', userId, 'enrolled'] });
      toast({
        title: "Enrolled successfully!",
        description: "Course added to your learning path",
      });
    },
  });

  const courses = coursesData?.courses || [];
  const enrolledCourses = enrolledCoursesData?.courses || [];
  
  // Helper to check if course is enrolled
  const isEnrolledCourse = (courseId: string) => {
    return enrolledCourses.some(ec => ec.courseId === courseId);
  };

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = (course.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         (course.provider?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesDomain = !selectedDomain || course.domain === selectedDomain;
    return matchesSearch && matchesDomain;
  });

  const filteredEnrolledCourses = enrolledCourses.filter(course => {
    const matchesSearch = (course.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         (course.provider?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesDomain = !selectedDomain || course.domain === selectedDomain;
    return matchesSearch && matchesDomain;
  });

  // Separate free and paid courses
  const freeCourses = filteredCourses.filter(c => c.isFree);
  const paidCourses = filteredCourses.filter(c => !c.isFree);

  const CourseCard = ({ course, isEnrolled = false }: { course: Course; isEnrolled?: boolean }) => {
    const skillLevel = skillLevels[course.domain] || 'Not assessed';
    
    return (
      <Card className="p-6 hover-elevate transition-all">
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-display font-semibold text-lg leading-tight" data-testid={`course-title-${course.id}`}>
                {course.title}
              </h3>
              {course.isFree && (
                <Badge variant="outline" className="bg-chart-3/10 text-chart-3 border-chart-3/20 flex-shrink-0">
                  Free
                </Badge>
              )}
              {isEnrolled && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 flex-shrink-0">
                  Enrolled
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {course.provider}
            </p>
          </div>
        </div>

        <p className="text-sm text-foreground mb-4 line-clamp-2">
          {course.description}
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Badge variant="outline" className="bg-primary/5">
            {course.skillLevel}
          </Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {course.duration}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-current text-yellow-500" />
            {course.rating}
          </div>
          {!course.isFree && (
            <div className="flex items-center gap-1 text-sm font-medium">
              <DollarSign className="h-4 w-4" />
              {course.price}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!isEnrolled && (
            <Button
              className="flex-1"
              onClick={() => enrollMutation.mutate(course)}
              disabled={enrollMutation.isPending}
              data-testid={`button-enroll-${course.id}`}
            >
              {enrollMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Enroll Now
            </Button>
          )}
          <Button
            variant={isEnrolled ? "default" : "outline"}
            size={isEnrolled ? "default" : "icon"}
            className={isEnrolled ? "flex-1" : ""}
            asChild
            data-testid={`button-view-course-${course.id}`}
          >
            <a href={course.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              {isEnrolled && <span className="ml-2">Continue Learning</span>}
            </a>
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <DashboardLayout userName={userName}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display font-bold text-3xl mb-2" data-testid="page-title">
            Course Recommendations
          </h1>
          <p className="text-muted-foreground">
            Personalized courses based on your skill assessments
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-courses"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedDomain === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDomain(null)}
              data-testid="filter-all"
            >
              All Domains
            </Button>
            {selectedDomains.map((domain: string) => (
              <Button
                key={domain}
                variant={selectedDomain === domain ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDomain(domain)}
                data-testid={`filter-${domain.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {domain}
              </Button>
            ))}
          </div>
        </div>

        {/* Course Tabs */}
        <Tabs defaultValue="enrolled" className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="enrolled" className="flex-1 sm:flex-none" data-testid="tab-enrolled-courses">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              My Courses ({enrolledCourses.length})
            </TabsTrigger>
            <TabsTrigger value="free" className="flex-1 sm:flex-none" data-testid="tab-free-courses">
              <BookOpen className="h-4 w-4 mr-2" />
              Free ({freeCourses.length})
            </TabsTrigger>
            <TabsTrigger value="paid" className="flex-1 sm:flex-none" data-testid="tab-paid-courses">
              <TrendingUp className="h-4 w-4 mr-2" />
              Premium ({paidCourses.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1 sm:flex-none" data-testid="tab-all-courses">
              All ({filteredCourses.length})
            </TabsTrigger>
          </TabsList>

          {isLoading || isLoadingEnrolled ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="enrolled" className="mt-6">
                {filteredEnrolledCourses.length === 0 ? (
                  <Card className="p-8 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">No enrolled courses yet</p>
                    <p className="text-sm text-muted-foreground">Browse recommended courses below and enroll to start learning!</p>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEnrolledCourses.map(course => (
                      <CourseCard key={course.id} course={course} isEnrolled={true} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="free" className="mt-6">
                {freeCourses.length === 0 ? (
                  <Card className="p-8 text-center">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No free courses found matching your criteria</p>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {freeCourses.map(course => (
                      <CourseCard key={course.id} course={course} isEnrolled={isEnrolledCourse(course.id)} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="paid" className="mt-6">
                {paidCourses.length === 0 ? (
                  <Card className="p-8 text-center">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No premium courses found matching your criteria</p>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paidCourses.map(course => (
                      <CourseCard key={course.id} course={course} isEnrolled={isEnrolledCourse(course.id)} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all" className="mt-6">
                {filteredCourses.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No courses found matching your criteria</p>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map(course => (
                      <CourseCard key={course.id} course={course} isEnrolled={isEnrolledCourse(course.id)} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
