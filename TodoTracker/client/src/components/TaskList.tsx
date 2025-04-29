import { useState } from "react";
import { TaskItem } from "./TaskItem";
import { TaskFilter } from "./TaskFilter";
import { useTasks } from "@/hooks/use-tasks";
import { useToast } from "@/hooks/use-toast";
import { Task } from "@shared/schema";
import { AnimatePresence } from "framer-motion";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

type FilterType = "all" | "active" | "completed";

export function TaskList() {
  // Hooks must be at the top level of the component
  const [filter, setFilter] = useState<FilterType>("all");
  const { tasks, isLoading, isError } = useTasks();
  const { toast } = useToast();

  // Function to handle filter changes
  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
  };

  // Function to handle clearing completed tasks
  const handleClearCompleted = () => {
    // Use a direct fetch call for simplicity
    fetch("/api/tasks/completed", {
      method: "DELETE",
      credentials: "include",
    })
      .then(response => {
        if (!response.ok) {
          throw new Error("Failed to clear completed tasks");
        }
        return response.json();
      })
      .then(() => {
        // Manually refetch tasks
        window.location.reload();
        toast({
          title: "Completed tasks cleared",
          description: "All completed tasks have been removed.",
        });
      })
      .catch(error => {
        console.error("Failed to clear completed tasks:", error);
        toast({
          title: "Failed to clear completed tasks",
          description: "There was an error clearing your completed tasks. Please try again.",
          variant: "destructive",
        });
      });
  };

  // Filter tasks based on the current filter
  const filteredTasks = tasks?.filter((task: Task) => {
    if (filter === "all") return true;
    if (filter === "active") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  }) || [];

  // Calculate active tasks and if there are any completed tasks
  const activeTasks = tasks?.filter((task: Task) => !task.completed) || [];
  const hasCompletedTasks = tasks?.some((task: Task) => task.completed) || false;

  return (
    <>
      <TaskFilter onFilterChange={handleFilterChange} />
      
      <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="flex justify-center items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.3s" }}></div>
            </div>
            <p className="text-gray-500 text-sm mt-3">Loading your tasks...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl text-red-500">!</span>
            </div>
            <h3 className="text-gray-700 font-medium mb-1">Error loading tasks</h3>
            <p className="text-gray-500 text-sm">Please try again later</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <CircleCheck className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-gray-700 font-medium mb-1">No tasks</h3>
            <p className="text-gray-500 text-sm">
              {filter === "all" 
                ? "Add some tasks to get started" 
                : filter === "active" 
                  ? "No active tasks found" 
                  : "No completed tasks found"}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredTasks.map((task: Task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </AnimatePresence>
        )}
      </div>
      
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
        <span>{activeTasks.length} {activeTasks.length === 1 ? "item" : "items"} left</span>
        {hasCompletedTasks && (
          <button 
            onClick={handleClearCompleted}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear completed
          </button>
        )}
      </div>
    </>
  );
}
