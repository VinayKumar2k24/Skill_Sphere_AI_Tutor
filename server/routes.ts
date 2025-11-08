import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { z } from "zod";
import bcrypt from "bcryptjs";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 15000, // 15 second timeout
  maxRetries: 0 // No retries, fail fast and use fallbacks
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { username, email, fullName, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ error: "Username, email, and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Hash password with cost factor of 10 (secure default)
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await storage.createUser({
        username,
        email,
        fullName: fullName || null,
        password: hashedPassword,
        selectedDomains: []
      });

      res.json({ 
        userId: user.id, 
        username: user.username,
        fullName: user.fullName,
        email: user.email
      });
    } catch (error) {
      console.error("Error during signup:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      res.json({ 
        userId: user.id, 
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        selectedDomains: user.selectedDomains
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", async (_req: Request, res: Response) => {
    res.json({ success: true });
  });

  app.get("/api/auth/check", async (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(401).json({ authenticated: false });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ authenticated: false });
    }

    res.json({ 
      authenticated: true,
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      selectedDomains: user.selectedDomains
    });
  });

  // Get user profile
  app.get("/api/user/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        userId: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        selectedDomains: user.selectedDomains
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Update user profile
  app.patch("/api/user/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { fullName, email } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.updateUser(userId, {
        fullName: fullName || user.fullName,
        email: email || user.email
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });
  
  // Update user domains after onboarding (user must be authenticated)
  app.post("/api/user/onboard", async (req: Request, res: Response) => {
    try {
      const { userId, domains } = req.body;
      
      if (!userId || !domains || !Array.isArray(domains)) {
        return res.status(400).json({ error: "User ID and domains are required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.updateUserDomains(userId, domains);

      res.json({ 
        userId: user.id, 
        username: user.username,
        selectedDomains: domains
      });
    } catch (error) {
      console.error("Error onboarding user:", error);
      res.status(500).json({ error: "Failed to onboard user" });
    }
  });

  // Fallback quiz in case AI generation fails - with randomization for unique questions
  const getFallbackQuiz = (domain: string) => {
    // Multiple question banks to ensure variety
    const questionBanks = [
      [
        {
          question: `What is the primary purpose of ${domain}?`,
          options: [
            "To build software applications",
            "To manage data and information",
            "To solve specific technical problems",
            "All of the above"
          ],
          correctAnswer: 3
        },
        {
          question: `Which skill is most important for ${domain}?`,
          options: [
            "Problem-solving abilities",
            "Communication skills",
            "Technical knowledge",
            "All are equally important"
          ],
          correctAnswer: 3
        },
        {
          question: `${domain} is best described as:`,
          options: [
            "A theoretical field",
            "A practical discipline",
            "Both theoretical and practical",
            "Neither theoretical nor practical"
          ],
          correctAnswer: 2
        },
        {
          question: `What is a common tool used in ${domain}?`,
          options: [
            "Specialized software",
            "Programming languages",
            "Development frameworks",
            "Varies by specific application"
          ],
          correctAnswer: 3
        },
        {
          question: `How would you rate the learning curve for ${domain}?`,
          options: [
            "Very easy",
            "Moderate",
            "Challenging but manageable",
            "Very difficult"
          ],
          correctAnswer: 2
        }
      ],
      [
        {
          question: `Which approach is most effective for learning ${domain}?`,
          options: [
            "Reading documentation only",
            "Hands-on practice and projects",
            "Watching video tutorials",
            "Attending workshops"
          ],
          correctAnswer: 1
        },
        {
          question: `What role does ${domain} play in modern technology?`,
          options: [
            "It's becoming obsolete",
            "It's essential and growing",
            "It's only for specialists",
            "It's mainly theoretical"
          ],
          correctAnswer: 1
        },
        {
          question: `How often should you practice ${domain} skills?`,
          options: [
            "Once a month",
            "Once a week",
            "Daily or several times per week",
            "Only when working on projects"
          ],
          correctAnswer: 2
        },
        {
          question: `What's the best way to stay current in ${domain}?`,
          options: [
            "Follow industry blogs and forums",
            "Take regular courses",
            "Work on real projects",
            "All of the above"
          ],
          correctAnswer: 3
        },
        {
          question: `${domain} expertise requires:`,
          options: [
            "Natural talent only",
            "Consistent practice and learning",
            "Expensive equipment",
            "A computer science degree"
          ],
          correctAnswer: 1
        }
      ]
    ];
    
    // Mix questions from both banks for maximum variety
    const allQuestions = [...questionBanks[0], ...questionBanks[1]];
    
    // Shuffle all questions using timestamp-based seed for better randomization
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    
    // Select 5 random questions from the shuffled pool
    const selectedQuestions = shuffled.slice(0, 5);
    
    return {
      domain,
      questions: selectedQuestions
    };
  };

  // Generate quiz based on selected domains
  app.post("/api/quiz/generate", async (req: Request, res: Response) => {
    try {
      const { domains, userId } = req.body;
      
      if (!domains || !Array.isArray(domains) || domains.length === 0) {
        return res.status(400).json({ error: "Domains are required" });
      }

      const domain = domains[0]; // Generate quiz for first domain
      
      try {
        // Add timestamp to ensure unique quiz generation for each user
        const uniqueSeed = `${userId}-${Date.now()}`;
        
        const prompt = `Generate a UNIQUE skill assessment quiz for ${domain}. 
        User ID: ${uniqueSeed}
        
        Create 10 DIFFERENT multiple choice questions that progressively test knowledge from beginner to advanced level.
        Ensure questions are varied and not repetitive across different quiz attempts.
        Include questions covering:
        - Fundamental concepts (questions 1-3)
        - Intermediate topics (questions 4-7)  
        - Advanced techniques (questions 8-10)
        
        Vary the question types:
        - Conceptual understanding
        - Practical application
        - Problem-solving scenarios
        - Best practices
        - Common pitfalls
        
        Return ONLY valid JSON in this exact format:
        {
          "questions": [
            {
              "question": "Question text here?",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": 0
            }
          ]
        }`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a skill assessment expert. Generate accurate, well-structured, and UNIQUE quizzes in valid JSON format only. Never repeat questions from previous quizzes." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.9, // Higher temperature for more variation
        });

        const content = completion.choices[0].message.content || "{}";
        const quizData = JSON.parse(content);
        
        // Validate quiz structure
        if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
          console.log("Invalid quiz structure from OpenAI, using fallback");
          return res.json(getFallbackQuiz(domain));
        }
        
        res.json({ 
          domain,
          questions: quizData.questions
        });
      } catch (aiError) {
        console.error("OpenAI quiz generation failed, using fallback:", aiError);
        res.json(getFallbackQuiz(domain));
      }
    } catch (error) {
      console.error("Error in quiz generation endpoint:", error);
      res.status(500).json({ error: "Failed to generate quiz" });
    }
  });

  // Submit quiz and determine skill level
  app.post("/api/quiz/submit", async (req: Request, res: Response) => {
    try {
      const { userId, domain, questions, answers } = req.body;
      
      if (!userId || !domain || !questions || !answers) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      // Verify user exists, create if needed (failsafe)
      let user = await storage.getUser(userId);
      if (!user) {
        console.log("User not found, creating demo user...");
        user = await storage.createUser({
          username: `demo-user-${Date.now()}`,
          email: `demo-user-${Date.now()}@example.com`,
          password: 'demo',
          selectedDomains: [domain]
        });
      }

      // Calculate score
      let score = 0;
      questions.forEach((q: any, idx: number) => {
        if (q.correctAnswer === answers[idx]) {
          score++;
        }
      });

      const totalQuestions = questions.length;
      const percentage = (score / totalQuestions) * 100;
      
      // Determine skill level based on score
      let skillLevel = "Beginner";
      if (percentage >= 70) {
        skillLevel = "Advanced";
      } else if (percentage >= 40) {
        skillLevel = "Intermediate";
      }

      // Save quiz attempt
      const attempt = await storage.saveQuizAttempt({
        userId: user.id,
        domain,
        questions,
        answers,
        score,
        totalQuestions,
        skillLevelDetermined: skillLevel
      });

      // Save skill level for domain
      await storage.setDomainSkillLevel(user.id, domain, skillLevel);

      // Prepare detailed results
      const detailedResults = questions.map((q: any, idx: number) => ({
        question: q.question,
        options: q.options,
        userAnswer: answers[idx],
        correctAnswer: q.correctAnswer,
        isCorrect: q.correctAnswer === answers[idx]
      }));

      res.json({
        score,
        totalQuestions,
        percentage,
        skillLevel,
        attemptId: attempt.id,
        results: detailedResults
      });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      res.status(500).json({ error: "Failed to submit quiz" });
    }
  });

  // Get user skill levels
  app.get("/api/user/:userId/skills", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const skills = await storage.getUserSkillLevels(userId);
      // Transform to domain -> skill level mapping
      const skillMap = skills.reduce((acc: Record<string, string>, skill) => {
        acc[skill.domain] = skill.skillLevel;
        return acc;
      }, {});
      res.json(skillMap);
    } catch (error) {
      console.error("Error fetching skills:", error);
      res.status(500).json({ error: "Failed to fetch skills" });
    }
  });

  // Get course recommendations
  app.post("/api/courses/recommend", async (req: Request, res: Response) => {
    try {
      const { domain, skillLevel } = req.body;
      
      if (!domain || !skillLevel) {
        return res.status(400).json({ error: "Domain and skill level are required" });
      }

      const prompt = `Recommend 6 high-quality courses for learning ${domain} at ${skillLevel} level.
      Include a mix of FREE and paid options, with preference for free courses.
      
      For each course provide:
      - title: Course name
      - platform: Platform name (Coursera, freeCodeCamp, YouTube, Udemy, etc.)
      - url: Direct course URL
      - isPaid: true/false
      - description: Brief course description (max 100 characters)
      - skillLevel: ${skillLevel}
      
      Return ONLY valid JSON:
      {
        "courses": [
          {
            "title": "Course Title",
            "platform": "Platform Name",
            "url": "https://...",
            "isPaid": false,
            "description": "Brief description",
            "skillLevel": "${skillLevel}"
          }
        ]
      }`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a learning path expert. Recommend real, high-quality courses from reputable platforms." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      });

      const data = JSON.parse(completion.choices[0].message.content || "{}");
      
      res.json({ courses: data.courses || [] });
    } catch (error) {
      console.error("Error recommending courses:", error);
      res.status(500).json({ error: "Failed to recommend courses" });
    }
  });


  // Get user's enrolled courses
  app.get("/api/user/:userId/courses", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const courses = await storage.getUserCourses(userId);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  // Update course progress
  app.patch("/api/courses/:courseId/progress", async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;
      const { progress } = req.body;
      
      if (typeof progress !== 'number' || progress < 0 || progress > 100) {
        return res.status(400).json({ error: "Invalid progress value" });
      }

      if (progress === 100) {
        await storage.completeCourse(courseId);
      } else {
        await storage.updateCourseProgress(courseId, progress);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating course progress:", error);
      res.status(500).json({ error: "Failed to update progress" });
    }
  });


  // Get chat history
  app.get("/api/user/:userId/chat-history", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await storage.getUserChatHistory(userId, limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ error: "Failed to fetch chat history" });
    }
  });

  // Create learning schedule
  app.post("/api/schedule", async (req: Request, res: Response) => {
    try {
      const { userId, courseId, title, description, dueDate } = req.body;
      
      if (!userId || !title) {
        return res.status(400).json({ error: "User ID and title are required" });
      }

      const schedule = await storage.createSchedule({
        userId,
        courseId: courseId || null,
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        completed: false
      });

      res.json(schedule);
    } catch (error) {
      console.error("Error creating schedule:", error);
      res.status(500).json({ error: "Failed to create schedule" });
    }
  });

  // Get user schedules
  app.get("/api/user/:userId/schedules", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const schedules = await storage.getUserSchedules(userId);
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      res.status(500).json({ error: "Failed to fetch schedules" });
    }
  });

  // Update schedule completion
  app.patch("/api/schedule/:scheduleId", async (req: Request, res: Response) => {
    try {
      const { scheduleId } = req.params;
      const { completed } = req.body;
      
      await storage.updateScheduleCompletion(scheduleId, completed);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating schedule:", error);
      res.status(500).json({ error: "Failed to update schedule" });
    }
  });

  // Get course recommendations for user
  app.get("/api/courses/recommendations/:userId/:domain?", async (req: Request, res: Response) => {
    try {
      const { userId, domain } = req.params;
      
      // Get user skill levels to provide better recommendations
      const skillLevels = await storage.getUserSkillLevels(userId);
      
      // If domain specified, filter to that domain
      const targetDomain = domain || (skillLevels.length > 0 ? skillLevels[0].domain : 'Web Development');
      const skillLevel = skillLevels.find(s => s.domain === targetDomain)?.skillLevel || 'Beginner';
      
      // Generate course recommendations using AI
      try {
        const prompt = `Recommend 9 high-quality courses for learning ${targetDomain} at ${skillLevel} level.
        Include MOSTLY FREE options (at least 6 free courses), with a few premium paid options.
        
        For each course provide realistic information:
        - title: Actual course name
        - provider: Real platform (Coursera, freeCodeCamp, YouTube, Udemy, edX, Khan Academy, etc.)
        - url: Realistic URL format for that platform
        - isFree: true for free courses, false for paid
        - price: 0 for free, realistic price for paid courses
        - rating: 4.0-5.0
        - duration: Realistic duration (e.g., "4 weeks", "20 hours", "Self-paced")
        - description: Brief but informative description (max 150 characters)
        - skillLevel: ${skillLevel}
        - domain: ${targetDomain}
        
        Return ONLY valid JSON:
        {
          "courses": [
            {
              "id": "unique-id",
              "title": "Course Title",
              "provider": "Platform Name",
              "url": "https://platform.com/course",
              "domain": "${targetDomain}",
              "skillLevel": "${skillLevel}",
              "price": 0,
              "rating": 4.5,
              "duration": "4 weeks",
              "description": "Brief description",
              "isFree": true
            }
          ]
        }`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a learning path expert. Recommend real, high-quality courses from reputable platforms. Emphasize free courses." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.8,
        });

        const data = JSON.parse(completion.choices[0].message.content || "{}");
        res.json({ courses: data.courses || [] });
      } catch (aiError) {
        console.error("AI course recommendation failed, using fallback:", aiError);
        // Fallback recommendations
        const fallbackCourses = [
          {
            id: `${targetDomain}-free-1`,
            title: `Introduction to ${targetDomain}`,
            provider: "freeCodeCamp",
            url: "https://www.freecodecamp.org",
            domain: targetDomain,
            skillLevel: skillLevel,
            price: 0,
            rating: 4.8,
            duration: "Self-paced",
            description: `Learn the fundamentals of ${targetDomain} with hands-on projects`,
            isFree: true
          },
          {
            id: `${targetDomain}-free-2`,
            title: `${targetDomain} Crash Course`,
            provider: "YouTube",
            url: "https://www.youtube.com",
            domain: targetDomain,
            skillLevel: skillLevel,
            price: 0,
            rating: 4.7,
            duration: "3-5 hours",
            description: `Quick introduction to ${targetDomain} concepts`,
            isFree: true
          },
          {
            id: `${targetDomain}-free-3`,
            title: `Complete ${targetDomain} Guide`,
            provider: "Coursera",
            url: "https://www.coursera.org",
            domain: targetDomain,
            skillLevel: skillLevel,
            price: 0,
            rating: 4.6,
            duration: "4 weeks",
            description: `Comprehensive ${skillLevel} level ${targetDomain} course`,
            isFree: true
          },
          {
            id: `${targetDomain}-paid-1`,
            title: `Advanced ${targetDomain} Masterclass`,
            provider: "Udemy",
            url: "https://www.udemy.com",
            domain: targetDomain,
            skillLevel: skillLevel,
            price: 49.99,
            rating: 4.9,
            duration: "20 hours",
            description: `Deep dive into ${targetDomain} with real-world projects`,
            isFree: false
          }
        ];
        res.json({ courses: fallbackCourses });
      }
    } catch (error) {
      console.error("Error getting course recommendations:", error);
      res.status(500).json({ error: "Failed to get recommendations" });
    }
  });

  // Enroll in course
  app.post("/api/courses/enroll", async (req: Request, res: Response) => {
    try {
      const { 
        userId, courseId, title, provider, url, domain, isPaid,
        description, skillLevel, duration, rating, price 
      } = req.body;
      
      console.log("Enroll request received:", { userId, courseId, title });
      
      if (!userId || !courseId) {
        console.log("Missing fields - userId:", userId, "courseId:", courseId);
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Create enrollment with complete course details
      const enrollment = await storage.enrollCourse({
        userId,
        courseId, // Store the original course ID
        courseTitle: title || `Course ${courseId}`,
        coursePlatform: provider || "Platform",
        courseUrl: url || "https://example.com",
        domain: domain || "General",
        isPaid: isPaid || false,
        progress: 0,
        completed: false,
        // Store all course details for proper display
        description: description || null,
        skillLevel: skillLevel || null,
        duration: duration || null,
        rating: rating ? Math.round(rating * 10) : null, // Store as integer (4.6 -> 46)
        price: price ? Math.round(price * 100) : null, // Store as integer cents (49.99 -> 4999)
      });

      res.json(enrollment);
    } catch (error) {
      console.error("Error enrolling:", error);
      res.status(500).json({ error: "Failed to enroll" });
    }
  });

  // Get enrolled courses
  app.get("/api/user/:userId/enrolled", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const enrolledCourses = await storage.getUserCourses(userId);
      
      // Format courses with proper field mapping for frontend
      const formattedCourses = enrolledCourses.map(course => ({
        id: course.id,
        courseId: course.courseId,
        title: course.courseTitle,
        provider: course.coursePlatform,
        url: course.courseUrl,
        domain: course.domain,
        skillLevel: course.skillLevel || 'Not specified',
        description: course.description || 'No description available',
        duration: course.duration || 'Self-paced',
        rating: course.rating ? course.rating / 10 : 0, // Convert from integer (46 -> 4.6)
        price: course.price ? course.price / 100 : 0, // Convert from cents (4999 -> 49.99)
        isFree: !course.isPaid,
        progress: course.progress || 0,
        completed: course.completed || false,
        enrolledAt: course.enrolledAt,
      }));
      
      res.json({ courses: formattedCourses });
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
      res.status(500).json({ error: "Failed to fetch enrolled courses", courses: [] });
    }
  });

  // Get schedule items
  app.get("/api/schedule/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const schedules = await storage.getUserSchedules(userId);
      
      // Transform to match frontend expectations
      const items = schedules.map(s => ({
        id: s.id,
        title: s.title,
        type: 'module' as const,
        date: s.dueDate ? new Date(s.dueDate).toLocaleDateString() : 'No date',
        time: '10:00 AM',
        duration: '1 hour',
        course: s.description || 'Self Study',
        completed: s.completed
      }));
      
      res.json({ items });
    } catch (error) {
      console.error("Error fetching schedule:", error);
      res.status(500).json({ error: "Failed to fetch schedule", items: [] });
    }
  });

  // Generate AI schedule
  app.post("/api/schedule/generate", async (req: Request, res: Response) => {
    try {
      const { userId, goals } = req.body;
      
      if (!userId || !goals) {
        return res.status(400).json({ error: "User ID and goals are required" });
      }

      // Get user context
      const skills = await storage.getUserSkillLevels(userId);
      const courses = await storage.getUserCourses(userId);
      
      let scheduleItems = [];
      
      try {
        const prompt = `Create a personalized learning schedule based on these goals: "${goals}"
        
        User's current skills: ${skills.map(s => `${s.domain} (${s.skillLevel})`).join(', ')}
        Enrolled courses: ${courses.length}
        
        Generate 5-7 specific learning tasks/milestones spread over the next 2-4 weeks.
        Each item should be actionable and time-bound.
        
        Return ONLY valid JSON:
        {
          "scheduleItems": [
            {
              "title": "Specific task or milestone",
              "description": "Course or study area",
              "dueDate": "2025-11-15"
            }
          ]
        }`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a learning schedule expert. Create realistic, achievable learning plans." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        });

        const data = JSON.parse(completion.choices[0].message.content || "{}");
        scheduleItems = data.scheduleItems || [];
      } catch (aiError) {
        console.error("AI schedule generation failed, using fallback:", aiError);
        // Fallback schedule
        const today = new Date();
        scheduleItems = [
          {
            title: "Review core concepts and fundamentals",
            description: "Self study",
            dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          {
            title: "Complete practice exercises",
            description: "Hands-on practice",
            dueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          {
            title: "Build a small project",
            description: "Practical application",
            dueDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          {
            title: "Review and refine skills",
            description: "Self study",
            dueDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        ];
      }
      
      // Create schedule items in database
      for (const item of scheduleItems) {
        await storage.createSchedule({
          userId,
          courseId: null,
          title: item.title,
          description: item.description,
          dueDate: new Date(item.dueDate),
          completed: false
        });
      }

      res.json({ success: true, itemsCreated: scheduleItems.length });
    } catch (error) {
      console.error("Error generating schedule:", error);
      res.status(500).json({ error: "Failed to generate schedule" });
    }
  });

  // Complete schedule item
  app.post("/api/schedule/:itemId/complete", async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      await storage.updateScheduleCompletion(itemId, true);
      res.json({ success: true });
    } catch (error) {
      console.error("Error completing schedule item:", error);
      res.status(500).json({ error: "Failed to complete item" });
    }
  });

  // Get AI mentor recommendations
  app.get("/api/mentor/recommendations/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      const skills = await storage.getUserSkillLevels(userId);
      const courses = await storage.getUserCourses(userId);
      const quizHistory = await storage.getUserQuizAttempts(userId);
      
      const completedCourses = courses.filter(c => c.completed);
      const inProgressCourses = courses.filter(c => !c.completed && (c.progress || 0) > 0);
      const assessedDomains = skills.map(s => s.domain);
      const unevaluatedDomains = inProgressCourses
        .map(c => c.domain)
        .filter(d => d && !assessedDomains.includes(d));
      
      const recommendations = [];
      
      // Recommend quizzes for unevaluated domains
      if (unevaluatedDomains.length > 0) {
        recommendations.push({
          type: 'quiz',
          title: 'Take a Skills Assessment',
          description: `You're learning ${unevaluatedDomains.join(', ')}. Assess your skills to track your progress and get personalized recommendations!`,
          action: 'Take Quiz',
          link: '/assessments'
        });
      }
      
      // Recommend quizzes after course completion
      if (completedCourses.length > 0 && skills.length < completedCourses.length) {
        recommendations.push({
          type: 'quiz',
          title: 'Validate Your Learning',
          description: `You've completed ${completedCourses.length} course${completedCourses.length > 1 ? 's' : ''}! Take a quiz to measure what you've learned.`,
          action: 'Start Assessment',
          link: '/assessments'
        });
      }
      
      // Recommend courses if they have skills but few enrollments
      if (skills.length > 0 && courses.length < 3) {
        recommendations.push({
          type: 'course',
          title: 'Expand Your Learning',
          description: `Based on your ${skills.map(s => s.domain).join(', ')} skills, there are great courses waiting for you!`,
          action: 'Browse Courses',
          link: '/courses'
        });
      }
      
      // Encourage first quiz if completely new
      if (skills.length === 0 && quizHistory.length === 0) {
        recommendations.push({
          type: 'quiz',
          title: 'Start Your Journey',
          description: 'Take your first skills assessment to get personalized course recommendations tailored to your level!',
          action: 'Get Started',
          link: '/assessments'
        });
      }
      
      res.json({ recommendations });
    } catch (error) {
      console.error("Error getting recommendations:", error);
      res.status(500).json({ error: "Failed to get recommendations", recommendations: [] });
    }
  });

  // Chat with AI mentor
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { userId, message, conversationHistory } = req.body;
      
      if (!userId || !message) {
        return res.status(400).json({ error: "User ID and message are required" });
      }

      // Get comprehensive user context
      const skills = await storage.getUserSkillLevels(userId);
      const courses = await storage.getUserCourses(userId);
      const allQuizHistory = await storage.getUserQuizAttempts(userId);
      const quizHistory = allQuizHistory.slice(0, 5); // Get latest 5
      
      // Analyze learning progress
      const completedCourses = courses.filter(c => c.completed);
      const inProgressCourses = courses.filter(c => !c.completed && (c.progress || 0) > 0);
      const assessedDomains = skills.map(s => s.domain);
      const unevaluatedDomains = inProgressCourses
        .map(c => c.domain)
        .filter(d => d && !assessedDomains.includes(d));
      
      let response = "";
      
      try {
        const systemPrompt = `You are an AI learning mentor helping a student on SkillPath, an AI-powered learning platform.

STUDENT PROFILE:
- Skills assessed: ${skills.map(s => `${s.domain} (${s.skillLevel})`).join(', ') || 'None yet'}
- Total courses enrolled: ${courses.length}
- Completed courses: ${completedCourses.length}
- In-progress courses: ${inProgressCourses.length}
- Recent quiz attempts: ${quizHistory.length}
- Domains without assessment: ${unevaluatedDomains.join(', ') || 'None'}

PLATFORM FEATURES & NAVIGATION:
When users ask about how to use the platform or specific features, guide them:
- **Dashboard**: Overview of learning progress, enrolled courses, skill levels, and quick actions
- **Courses**: Browse and enroll in personalized course recommendations based on skill assessments. Filter by domain and see enrolled courses.
- **Assessments**: Take AI-generated quizzes to evaluate skills (Beginner/Intermediate/Advanced). Can retake quizzes to improve assessment accuracy.
- **Schedule**: Plan learning activities and track completion progress
- **AI Mentor**: (this page) Get personalized guidance, ask questions, receive proactive recommendations

YOUR ROLE:
- Provide personalized, actionable guidance based on their progress
- When they complete courses, suggest taking quizzes to assess their new skills
- If they haven't taken quizzes in their enrolled course domains, recommend assessments
- Help them navigate the platform by explaining features when asked
- Guide users through their learning journey step-by-step
- Explain how each platform feature helps them achieve their learning goals
- Be encouraging, specific, and motivating

HOW THE PLATFORM WORKS:
1. Take skill assessments (Assessments page) to determine current level
2. Get personalized course recommendations (Courses page) based on assessment
3. Enroll in courses and track progress (Dashboard)
4. Create learning schedules (Schedule page) to stay organized
5. Chat with AI mentor for guidance and support (this page)
6. Retake quizzes as you learn to track improvement

Keep responses clear and readable (2-3 short paragraphs). Focus on next actionable steps.`;

        const messages = [
          { role: "system" as const, content: systemPrompt },
          ...(conversationHistory || []),
          { role: "user" as const, content: message }
        ];

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.7,
          max_tokens: 400
        });

        response = completion.choices[0].message.content || "";
      } catch (aiError) {
        console.error("AI chat failed, using fallback:", aiError);
        // Context-aware fallback responses
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('motivat') || lowerMessage.includes('stuck') || lowerMessage.includes('difficult')) {
          response = "Learning can be challenging, but you're making great progress! Remember that every expert was once a beginner. Take it one step at a time, celebrate small wins, and don't be afraid to ask for help. You've got this!";
        } else if (lowerMessage.includes('next') || lowerMessage.includes('what should') || lowerMessage.includes('recommend')) {
          // Smart recommendations based on user state
          if (unevaluatedDomains.length > 0) {
            response = `Great question! I notice you're making progress in ${unevaluatedDomains.join(', ')}. Once you feel comfortable with the material, I'd recommend taking a skill assessment quiz to measure your progress and get personalized course recommendations. Head to the Assessments page when you're ready!`;
          } else if (completedCourses.length > 0 && skills.length === 0) {
            response = `You've completed ${completedCourses.length} course${completedCourses.length > 1 ? 's' : ''} - that's awesome! Now would be a great time to take a skills assessment to see how much you've learned and get recommendations for your next steps. Check out the Assessments page!`;
          } else {
            response = `Based on your current skill levels, I'd recommend focusing on building practical projects. Hands-on experience is one of the best ways to solidify your knowledge. Check out the Courses page for resources tailored to your level!`;
          }
        } else if (lowerMessage.includes('quiz') || lowerMessage.includes('assess') || lowerMessage.includes('test')) {
          if (skills.length === 0) {
            response = "Taking your first skills assessment is a great way to start! It'll help us understand your current level and recommend the perfect courses for you. Visit the Assessments page to get started!";
          } else {
            response = `You've already assessed your skills in ${assessedDomains.join(', ')}. ${unevaluatedDomains.length > 0 ? `Consider taking quizzes in ${unevaluatedDomains.join(', ')} to track your progress in those areas!` : 'Keep learning and reassess periodically to track your improvement!'}`;
          }
        } else if (lowerMessage.includes('schedule') || lowerMessage.includes('plan') || lowerMessage.includes('time')) {
          response = "Creating a consistent learning schedule is key to success! Try dedicating specific time blocks each day, even if it's just 30 minutes. Use the Schedule feature to plan your learning milestones and track your progress.";
        } else {
          response = "I'm here to support your learning journey! I can help you with study strategies, course recommendations, staying motivated, or planning your learning schedule. What would you like to focus on today?";
        }
      }

      // Save to database
      await storage.saveChatMessage({ userId, role: "user", content: message });
      await storage.saveChatMessage({ userId, role: "assistant", content: response });

      res.json({ response });
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
