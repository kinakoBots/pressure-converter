import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  googleId: text("google_id").unique(),
  name: text("name"),
  email: text("email"),
  avatar: text("avatar"),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  completed: boolean("completed").notNull().default(false),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  googleId: true,
  name: true,
  email: true,
  avatar: true,
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  text: true,
  completed: true,
  userId: true,
});

export const taskSchema = z.object({
  id: z.number(),
  text: z.string(),
  completed: z.boolean(),
  userId: z.number().optional(),
  createdAt: z.date().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type TaskResponse = z.infer<typeof taskSchema>;
