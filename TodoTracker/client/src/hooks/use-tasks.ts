import { useQuery } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useCallback } from "react";

export function useTasks() {
  const { user } = useAuth();
  
  const {
    data: tasks,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    queryFn: async ({ signal }) => {
      console.log("Fetching tasks...");
      try {
        const response = await fetch("/api/tasks", {
          signal,
          credentials: "include",
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error("Error fetching tasks:", errorData);
          throw new Error(errorData || response.statusText);
        }
        
        const data = await response.json();
        console.log("Tasks fetched:", data);
        return data;
      } catch (err) {
        console.error("Task fetch error:", err);
        // Return empty array instead of throwing to avoid error state
        return [];
      }
    },
    // Always enable fetching tasks
    // This is safe because our backend will handle auth
    enabled: true,
    // Poll every 2 seconds to keep tasks in sync
    refetchInterval: 2000,
    // Return empty array if tasks is undefined
    placeholderData: [],
    // Don't retry on network errors
    retry: false,
    // Make sure we get the latest tasks
    staleTime: 0
  });

  // Set up an event listener for task changes
  useEffect(() => {
    // Create a function to handle the custom event
    const handleRefetchEvent = () => {
      console.log("Refetching tasks from custom event...");
      refetch();
    };
    
    // Add event listener for the custom event
    window.addEventListener('refetch-tasks', handleRefetchEvent);
    
    // Clean up event listener when component unmounts
    return () => {
      window.removeEventListener('refetch-tasks', handleRefetchEvent);
    };
  }, [refetch]);

  return {
    tasks: tasks || [],
    isLoading,
    isError,
    error,
    refetch,
  };
}
