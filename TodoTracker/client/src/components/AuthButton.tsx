import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FaGoogle } from "react-icons/fa";

export function AuthButton() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout");
      return await res.json();
    },
    onSuccess: () => {
      setUser(null);
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    },
    onError: (error) => {
      console.error("Failed to logout:", error);
      toast({
        title: "Failed to logout",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      if (!res.ok) {
        throw new Error("Failed to sign in");
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      // Close the dialog
      setIsLoginModalOpen(false);
      
      // Update user state directly with the response data
      if (data.user) {
        setUser(data.user);
      }
      
      // Also refetch to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Signed in successfully",
        description: "You are now signed in to TaskFlow.",
      });
    },
    onError: (error) => {
      console.error("Login error:", error);
      toast({
        title: "Sign in failed",
        description: "There was an error signing in. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleGoogleLogin = () => {
    loginMutation.mutate();
  };

  const getUserInitials = () => {
    if (!user?.name) return "?";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="relative">
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 border border-gray-300 rounded-lg px-2 py-1">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{user.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem disabled>Your Profile</DropdownMenuItem>
            <DropdownMenuItem disabled>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="fade-in">
          <Button
            onClick={() => setIsLoginModalOpen(true)}
            variant="outline"
            className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium"
          >
            <FaGoogle className="h-5 w-5 text-blue-500" />
            Sign In
          </Button>
        </div>
      )}

      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Sign in to TaskFlow</DialogTitle>
            <DialogDescription className="text-gray-600">
              Sign in to save and sync your tasks across devices.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full flex items-center justify-center gap-3 px-4 py-3"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-blue-500 animate-spin" />
                  Signing in...
                </div>
              ) : (
                <>
                  <FaGoogle className="h-5 w-5 text-blue-500" />
                  Continue with Google
                </>
              )}
            </Button>
          </div>
          <div className="mt-4 text-center text-xs text-gray-500">
            By continuing, you agree to TaskFlow's Terms of Service and Privacy Policy.
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
