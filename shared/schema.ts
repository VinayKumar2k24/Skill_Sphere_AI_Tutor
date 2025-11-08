import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  selectedDomains: text("selected_domains").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const domainSkillLevels = pgTable("domain_skill_levels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  domain: text("domain").notNull(),
  skillLevel: text("skill_level").notNull(),
  determinedAt: timestamp("determined_at").defaultNow(),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  domain: text("domain").notNull(),
  questions: jsonb("questions").notNull(),
  answers: jsonb("answers").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  skillLevelDetermined: text("skill_level_determined"),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const enrolledCourses = pgTable("enrolled_courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  courseTitle: text("course_title").notNull(),
  coursePlatform: text("course_platform").notNull(),
  courseUrl: text("course_url").notNull(),
  domain: text("domain").notNull(),
  isPaid: boolean("is_paid").default(false),
  progress: integer("progress").default(0),
  completed: boolean("completed").default(false),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const learningSchedules = pgTable("learning_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  courseId: varchar("course_id").references(() => enrolledCourses.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertDomainSkillLevelSchema = createInsertSchema(domainSkillLevels).omit({ id: true, determinedAt: true });
export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ id: true, completedAt: true });
export const insertEnrolledCourseSchema = createInsertSchema(enrolledCourses).omit({ id: true, enrolledAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, timestamp: true });
export const insertLearningScheduleSchema = createInsertSchema(learningSchedules).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type DomainSkillLevel = typeof domainSkillLevels.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type EnrolledCourse = typeof enrolledCourses.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type LearningSchedule = typeof learningSchedules.$inferSelect;
