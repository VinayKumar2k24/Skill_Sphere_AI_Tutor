import { db } from "./db";
import { 
  users, 
  domainSkillLevels, 
  quizAttempts, 
  enrolledCourses, 
  chatMessages, 
  learningSchedules,
  type User, 
  type InsertUser,
  type DomainSkillLevel,
  type QuizAttempt,
  type EnrolledCourse,
  type ChatMessage,
  type LearningSchedule
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: string, updates: Partial<InsertUser>): Promise<void>;
  updateUserDomains(userId: string, domains: string[]): Promise<void>;
  
  // Domain skill levels
  setDomainSkillLevel(userId: string, domain: string, skillLevel: string): Promise<DomainSkillLevel>;
  getUserSkillLevels(userId: string): Promise<DomainSkillLevel[]>;
  
  // Quiz attempts
  saveQuizAttempt(attempt: Omit<QuizAttempt, "id" | "completedAt">): Promise<QuizAttempt>;
  getUserQuizAttempts(userId: string, domain?: string): Promise<QuizAttempt[]>;
  
  // Enrolled courses
  enrollCourse(course: Omit<EnrolledCourse, "id" | "enrolledAt">): Promise<EnrolledCourse>;
  getUserCourses(userId: string): Promise<EnrolledCourse[]>;
  updateCourseProgress(courseId: string, progress: number): Promise<void>;
  completeCourse(courseId: string): Promise<void>;
  
  // Chat messages
  saveChatMessage(message: Omit<ChatMessage, "id" | "timestamp">): Promise<ChatMessage>;
  getUserChatHistory(userId: string, limit?: number): Promise<ChatMessage[]>;
  
  // Learning schedules
  createSchedule(schedule: Omit<LearningSchedule, "id" | "createdAt">): Promise<LearningSchedule>;
  getUserSchedules(userId: string): Promise<LearningSchedule[]>;
  updateScheduleCompletion(scheduleId: string, completed: boolean): Promise<void>;
}

export class DbStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(userId: string, updates: Partial<InsertUser>): Promise<void> {
    await db.update(users).set(updates).where(eq(users.id, userId));
  }

  async updateUserDomains(userId: string, domains: string[]): Promise<void> {
    await db.update(users).set({ selectedDomains: domains }).where(eq(users.id, userId));
  }

  // Domain skill levels
  async setDomainSkillLevel(userId: string, domain: string, skillLevel: string): Promise<DomainSkillLevel> {
    const result = await db.insert(domainSkillLevels)
      .values({ userId, domain, skillLevel })
      .returning();
    return result[0];
  }

  async getUserSkillLevels(userId: string): Promise<DomainSkillLevel[]> {
    return await db.select().from(domainSkillLevels).where(eq(domainSkillLevels.userId, userId));
  }

  // Quiz attempts
  async saveQuizAttempt(attempt: Omit<QuizAttempt, "id" | "completedAt">): Promise<QuizAttempt> {
    const result = await db.insert(quizAttempts).values(attempt).returning();
    return result[0];
  }

  async getUserQuizAttempts(userId: string, domain?: string): Promise<QuizAttempt[]> {
    if (domain) {
      return await db.select().from(quizAttempts)
        .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.domain, domain)))
        .orderBy(desc(quizAttempts.completedAt));
    }
    return await db.select().from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.completedAt));
  }

  // Enrolled courses
  async enrollCourse(course: Omit<EnrolledCourse, "id" | "enrolledAt">): Promise<EnrolledCourse> {
    const result = await db.insert(enrolledCourses).values(course).returning();
    return result[0];
  }

  async getUserCourses(userId: string): Promise<EnrolledCourse[]> {
    return await db.select().from(enrolledCourses)
      .where(eq(enrolledCourses.userId, userId))
      .orderBy(desc(enrolledCourses.enrolledAt));
  }

  async updateCourseProgress(courseId: string, progress: number): Promise<void> {
    await db.update(enrolledCourses)
      .set({ progress })
      .where(eq(enrolledCourses.id, courseId));
  }

  async completeCourse(courseId: string): Promise<void> {
    await db.update(enrolledCourses)
      .set({ completed: true, progress: 100 })
      .where(eq(enrolledCourses.id, courseId));
  }

  // Chat messages
  async saveChatMessage(message: Omit<ChatMessage, "id" | "timestamp">): Promise<ChatMessage> {
    const result = await db.insert(chatMessages).values(message).returning();
    return result[0];
  }

  async getUserChatHistory(userId: string, limit: number = 50): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.timestamp))
      .limit(limit);
  }

  // Learning schedules
  async createSchedule(schedule: Omit<LearningSchedule, "id" | "createdAt">): Promise<LearningSchedule> {
    const result = await db.insert(learningSchedules).values(schedule).returning();
    return result[0];
  }

  async getUserSchedules(userId: string): Promise<LearningSchedule[]> {
    return await db.select().from(learningSchedules)
      .where(eq(learningSchedules.userId, userId))
      .orderBy(desc(learningSchedules.createdAt));
  }

  async updateScheduleCompletion(scheduleId: string, completed: boolean): Promise<void> {
    await db.update(learningSchedules)
      .set({ completed })
      .where(eq(learningSchedules.id, scheduleId));
  }
}

export const storage = new DbStorage();
