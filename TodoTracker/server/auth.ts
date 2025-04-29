import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import { User } from "@shared/schema";

// Create a mock user for demonstration
const MOCK_USER = {
  id: 1,
  username: "demo@example.com",
  name: "Demo User",
  email: "demo@example.com",
  password: "demo-password", // Not used for actual auth, just for storage
  googleId: "mock-google-id",
  avatar: "https://ui-avatars.com/api/?name=Demo+User&background=random",
};

// Setup the mock user in storage
async function setupMockUser() {
  try {
    let user = await storage.getUser(1);
    if (!user) {
      user = await storage.createUser({
        username: MOCK_USER.username,
        password: MOCK_USER.password,
        googleId: MOCK_USER.googleId,
        name: MOCK_USER.name,
        email: MOCK_USER.email,
        avatar: MOCK_USER.avatar,
      });
      console.log("Created mock user for demonstration");
    }
    return user;
  } catch (error) {
    console.error("Error setting up mock user:", error);
    return null;
  }
}

export function setupGoogleAuth() {
  // Serialize the entire user object
  passport.serializeUser((user, done) => {
    done(null, JSON.stringify(user));
  });

  // Deserialize from JSON string
  passport.deserializeUser((serialized: string, done) => {
    try {
      const user = JSON.parse(serialized);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Simple local strategy that always returns our mock user
  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          const user = await setupMockUser();
          if (user) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Failed to set up mock user" });
          }
        } catch (error) {
          return done(error);
        }
      }
    )
  );
  
  // Create the mock user right away
  setupMockUser();
}

// Auto-login middleware for development
export function mockAuthMiddleware(req: any, res: any, next: any) {
  // If not authenticated, automatically use the mock user
  if (!req.isAuthenticated()) {
    req.user = MOCK_USER;
    console.log("Auto-setting mock user for unauthenticated request");
  }
  next();
}
