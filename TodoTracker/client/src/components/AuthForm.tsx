import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { queryClient } from "@/lib/queryClient";

type AuthMode = "login" | "register";

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { setUser } = useAuth();
  const { toast } = useToast();
  
  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password, name }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Registration failed");
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Registration successful",
        description: "Your account has been created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "There was an error creating your account.",
        variant: "destructive",
      });
    },
  });
  
  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Login failed");
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Login successful",
        description: "You are now signed in.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "There was an error signing in.",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "register") {
      if (!name) {
        toast({
          title: "Name required",
          description: "Please enter your name to register.",
          variant: "destructive",
        });
        return;
      }
      registerMutation.mutate();
    } else {
      loginMutation.mutate();
    }
  };
  
  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
  };
  
  const isLoading = loginMutation.isPending || registerMutation.isPending;
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        {mode === "register" && (
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required={mode === "register"}
            />
          </div>
        )}
        
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-current animate-spin" />
            {mode === "login" ? "Signing in..." : "Creating account..."}
          </div>
        ) : (
          mode === "login" ? "Sign In" : "Create Account"
        )}
      </Button>
      
      <div className="text-center text-sm">
        {mode === "login" ? "Don't have an account?" : "Already have an account?"}
        {" "}
        <button
          type="button"
          onClick={toggleMode}
          className="text-primary hover:underline focus:outline-none"
          disabled={isLoading}
        >
          {mode === "login" ? "Register" : "Log in"}
        </button>
      </div>
    </form>
  );
}