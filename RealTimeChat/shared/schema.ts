import { pgTable, text, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Chat related schemas
export const chatMessageSchema = z.object({
  id: z.string(),
  text: z.string(),
  roomId: z.string(),
  userId: z.string(),
  username: z.string(),
  timestamp: z.date().or(z.string().transform(str => new Date(str))),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const chatUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  roomId: z.string(),
  isCurrentUser: z.boolean().optional().default(false),
  isTyping: z.boolean().optional().default(false),
});

export type ChatUser = z.infer<typeof chatUserSchema>;

export const chatRoomSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type ChatRoom = z.infer<typeof chatRoomSchema>;

export const socketMessageSchema = z.object({
  type: z.enum(["join", "leave", "message", "typing", "users"]),
  payload: z.any(),
});

export type SocketMessage = z.infer<typeof socketMessageSchema>;
