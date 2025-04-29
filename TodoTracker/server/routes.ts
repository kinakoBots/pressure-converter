import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTaskSchema, insertUserSchema, taskSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupGoogleAuth, mockAuthMiddleware } from "./auth";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";

const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "taskflow-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 }, // 1 day
      store: new SessionStore({
        checkPeriod: 86400000, // 24 hours
      }),
    })
  );

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  setupGoogleAuth();
  
  // For simplicity in demo, auto-authenticate all requests with our mock user
  app.use(mockAuthMiddleware);

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      
      if (!email || !password || !name) {
        return res.status(400).json({ message: "Email, password, and name are required" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // Create user
      const user = await storage.createUser({
        username: email,
        password,
        name,
        email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        googleId: null,
      });
      
      // Log in the user
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Failed to login after registration" });
        }
        return res.status(201).json({ success: true, user });
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Failed to register" });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Find user
      const user = await storage.getUserByUsername(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Check password
      if (user.password !== password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Log in the user
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Failed to login" });
        }
        return res.status(200).json({ success: true, user });
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Failed to login" });
    }
  });

  app.get("/api/auth/user", (req, res) => {
    // If user is already authenticated, return the user
    if (req.isAuthenticated() && req.user) {
      console.log("Returning authenticated user:", req.user);
      return res.json(req.user);
    }
    
    // For development - always return a mock user
    const mockUser = {
      id: 1,
      username: "demo@example.com",
      name: "Demo User",
      email: "demo@example.com",
      password: "demo-password",
      googleId: "mock-google-id",
      avatar: "https://ui-avatars.com/api/?name=Demo+User&background=random",
    };
    
    // Set it as the user on the request
    req.user = mockUser;
    req.login(mockUser, (err) => {
      if (err) {
        console.error("Auto-login error:", err);
      }
      console.log("Auto-logged in mock user");
    });
    
    console.log("Returning mock user for development:", mockUser);
    return res.json(mockUser);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Task routes
  app.get("/api/tasks", async (req, res) => {
    try {
      let userId;
      
      // If the user is not authenticated, use a default user ID for demo purposes
      if (!req.isAuthenticated()) {
        // Create and log in a demo user if not already authenticated
        const mockUser = {
          id: 1,
          username: "demo@example.com",
          name: "Demo User",
          email: "demo@example.com",
          password: "demo-password",
          googleId: "mock-google-id",
          avatar: "https://ui-avatars.com/api/?name=Demo+User&background=random",
        };
        
        userId = mockUser.id;
        
        // Only set user if not already authenticated
        if (!req.user) {
          req.user = mockUser;
        }
      } else {
        userId = (req.user as any).id;
      }
      
      console.log("Fetching tasks for user:", userId);
      const tasks = await storage.getTasksByUserId(userId);
      console.log("Tasks found:", tasks);
      return res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      let userId;
      
      // If not authenticated, use default user for demo
      if (!req.isAuthenticated()) {
        // Use a mock user
        const mockUser = {
          id: 1,
          username: "demo@example.com",
          name: "Demo User",
          email: "demo@example.com"
        };
        
        userId = mockUser.id;
        // Set the user for the request if not already set
        if (!req.user) {
          req.user = mockUser;
        }
      } else {
        userId = (req.user as any).id;
      }
      
      console.log("Creating task for user:", userId, "with data:", req.body);
      
      const taskData = insertTaskSchema.parse({
        ...req.body,
        userId,
        completed: req.body.completed ?? false,
      });

      const task = await storage.createTask(taskData);
      console.log("Task created:", task);
      return res.status(201).json(task);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        console.error("Validation error:", validationError);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating task:", error);
      return res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      let userId;
      
      // If not authenticated, use default user for demo
      if (!req.isAuthenticated()) {
        // Use a mock user
        userId = 1; // Default user ID
      } else {
        userId = (req.user as any).id;
      }
      
      const taskId = parseInt(req.params.id, 10);
      console.log("Updating task:", taskId, "with data:", req.body);
      
      // Validate task owner - relaxed for demo
      const existingTask = await storage.getTask(taskId);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      const updatedTask = await storage.updateTask(taskId, req.body);
      console.log("Task updated:", updatedTask);
      return res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      return res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      let userId;
      
      // If not authenticated, use default user for demo
      if (!req.isAuthenticated()) {
        // Use a mock user
        userId = 1; // Default user ID
      } else {
        userId = (req.user as any).id;
      }
      
      const taskId = parseInt(req.params.id, 10);
      console.log("Deleting task:", taskId);
      
      // Validate task exists
      const existingTask = await storage.getTask(taskId);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      await storage.deleteTask(taskId);
      console.log("Task deleted:", taskId);
      return res.json({ message: "Task deleted" });
    } catch (error) {
      console.error("Error deleting task:", error);
      return res.status(500).json({ message: "Failed to delete task" });
    }
  });

  app.delete("/api/tasks/completed", async (req, res) => {
    try {
      let userId;
      
      // If not authenticated, use default user for demo
      if (!req.isAuthenticated()) {
        // Use a mock user
        userId = 1; // Default user ID
      } else {
        userId = (req.user as any).id;
      }
      
      console.log("Deleting all completed tasks for user:", userId);
      await storage.deleteCompletedTasks(userId);
      console.log("Completed tasks deleted for user:", userId);
      return res.json({ message: "Completed tasks deleted" });
    } catch (error) {
      console.error("Error deleting completed tasks:", error);
      return res.status(500).json({ message: "Failed to delete completed tasks" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
