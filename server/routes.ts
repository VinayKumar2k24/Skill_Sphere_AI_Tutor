import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 15000, // 15 second timeout
  maxRetries: 0 // No retries, fail fast and use fallbacks
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create or update user after onboarding
  app.post("/api/user/onboard", async (req: Request, res: Response) => {
    try {
      const { name, domains } = req.body;
      
      if (!name || !domains || !Array.isArray(domains)) {
        return res.status(400).json({ error: "Name and domains are required" });
      }

      // Create a simple demo user (in production, this would use proper authentication)
      const userId = `user-${Date.now()}`;
      const user = await storage.createUser({
        username: name.toLowerCase().replace(/\s+/g, '-') + `-${Date.now()}`,
        password: 'demo-password',
        selectedDomains: domains
      });

      res.json({ userId: user.id, username: user.username });
    } catch (error) {
      console.error("Error onboarding user:", error);
      res.status(500).json({ error: "Failed to onboard user" });
    }
  });

  // Fallback quiz in case AI generation fails
  const getFallbackQuiz = (domain: string) => ({
    domain,
    questions: [
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
    ]
  });

  // Generate quiz based on selected domains
  app.post("/api/quiz/generate", async (req: Request, res: Response) => {
    try {
      const { domains, userId } = req.body;
      
      if (!domains || !Array.isArray(domains) || domains.length === 0) {
        return res.status(400).json({ error: "Domains are required" });
      }

      const domain = domains[0]; // Generate quiz for first domain
      
      try {
        const prompt = `Generate a skill assessment quiz for ${domain}. 
        Create 10 multiple choice questions that progressively test knowledge from beginner to advanced level.
        Include questions covering:
        - Fundamental concepts (questions 1-3)
        - Intermediate topics (questions 4-7)  
        - Advanced techniques (questions 8-10)
        
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
            { role: "system", content: "You are a skill assessment expert. Generate accurate, well-structured quizzes in valid JSON format only." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
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

      res.json({
        score,
        totalQuestions,
        percentage,
        skillLevel,
        attemptId: attempt.id
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

  // Enroll in course (simplified version for frontend)
  app.post("/api/courses/enroll", async (req: Request, res: Response) => {
    try {
      const { userId, courseId } = req.body;
      
      console.log("Enroll request received:", { userId, courseId, body: req.body });
      
      if (!userId || !courseId) {
        console.log("Missing fields - userId:", userId, "courseId:", courseId);
        return res.status(400).json({ error: "Missing required fields" });
      }

      // For MVP, just create a simple enrollment record
      // In production, this would fetch course details and create proper enrollment
      const enrollment = await storage.enrollCourse({
        userId,
        courseTitle: "Course " + courseId,
        coursePlatform: "Platform",
        courseUrl: "https://example.com",
        domain: "General",
        isPaid: false,
        progress: 0,
        completed: false
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
      const courses = await storage.getUserCourses(userId);
      res.json({ courses });
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

  // Chat with AI mentor
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { userId, message, conversationHistory } = req.body;
      
      if (!userId || !message) {
        return res.status(400).json({ error: "User ID and message are required" });
      }

      // Get user context
      const skills = await storage.getUserSkillLevels(userId);
      const courses = await storage.getUserCourses(userId);
      
      let response = "";
      
      try {
        const systemPrompt = `You are an AI learning mentor helping a student on their learning journey.
        
        Student's skills: ${skills.map(s => `${s.domain} (${s.skillLevel})`).join(', ')}
        Enrolled in ${courses.length} courses
        
        Provide personalized guidance, answer questions, suggest study strategies, and keep them motivated.
        Be encouraging, specific, and actionable. Keep responses concise (2-3 paragraphs max).`;

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
        // Fallback responses based on common questions
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('motivat') || lowerMessage.includes('stuck') || lowerMessage.includes('difficult')) {
          response = "Learning can be challenging, but you're making great progress! Remember that every expert was once a beginner. Take it one step at a time, celebrate small wins, and don't be afraid to ask for help. You've got this!";
        } else if (lowerMessage.includes('next') || lowerMessage.includes('what should') || lowerMessage.includes('recommend')) {
          response = `Based on your current skill levels, I'd recommend focusing on building practical projects. Hands-on experience is one of the best ways to solidify your knowledge. Check out the courses page for some great resources tailored to your level!`;
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
