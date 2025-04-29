import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// More flexible user interface to handle different server responses
interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  username?: string;
  [key: string]: any; // Allow for any additional properties
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isLoading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  const { isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/user", {
          credentials: "include",
        });
        
        if (response.status === 401) {
          // Not authenticated, that's okay
          return null;
        }
        
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        
        const userData = await response.json();
        
        // Make sure user has the required fields
        const normalizedUser = {
          id: userData.id || 1, // Default to 1 if no id
          name: userData.name || "Demo User",
          email: userData.email || userData.username || "demo@example.com",
          avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || "Demo User")}&background=random`,
          ...userData
        };
        
        console.log("Authenticated user:", normalizedUser);
        setUser(normalizedUser);
        return normalizedUser;
      } catch (error) {
        console.error("Error fetching user:", error);
        return null;
      }
    },
    retry: false,
  });

  const value = {
    user,
    setUser,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
