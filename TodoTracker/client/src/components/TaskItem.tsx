import { useState } from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Task } from "@shared/schema";
import { Trash } from "lucide-react";

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Function to update task status
  const updateTaskStatus = async (completed: boolean) => {
    try {
      console.log("Updating task:", task.id, "completed:", completed);
      
      // Update the UI optimistically to make it feel instant
      // We'll update the DOM directly for the text style
      const textElement = document.querySelector(`[data-task-id="${task.id}"] .task-text`);
      if (textElement) {
        if (completed) {
          textElement.classList.add("line-through", "text-gray-400");
        } else {
          textElement.classList.remove("line-through", "text-gray-400");
        }
      }
      
      // Now make the API call
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ completed }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update task");
      }
      
      const updatedTask = await response.json();
      console.log("Task updated:", updatedTask);
      
      // Show a toast notification
      toast({
        title: !completed ? "Task marked as active" : "Task completed!",
        description: !completed 
          ? "Task has been marked as active." 
          : "Task has been marked as completed.",
      });
      
      // Instead of reloading, trigger a refetch of tasks after a short delay
      setTimeout(() => {
        // This will help ensure the task list is updated correctly
        const event = new CustomEvent('refetch-tasks');
        window.dispatchEvent(event);
      }, 300);
      
    } catch (error) {
      console.error("Failed to update task:", error);
      toast({
        title: "Failed to update task",
        description: "There was an error updating your task. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to delete a task
  const deleteTask = async () => {
    try {
      // Update UI immediately (without waiting for the server) for better UX
      setIsDeleting(true);
      console.log("Deleting task:", task.id);
      
      // Make the API call to actually delete the task
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete task");
      }
      
      const result = await response.json();
      console.log("Task deleted:", result);
      
      toast({
        title: "Task deleted",
        description: "Your task has been deleted successfully.",
      });
      
      // Instead of reloading, trigger a refetch of tasks after a short delay
      // The animation takes care of removing the task from the UI immediately
      setTimeout(() => {
        // This will help ensure the task list is updated correctly
        const event = new CustomEvent('refetch-tasks');
        window.dispatchEvent(event);
      }, 500);
      
    } catch (error) {
      setIsDeleting(false);
      console.error("Failed to delete task:", error);
      toast({
        title: "Failed to delete task",
        description: "There was an error deleting your task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = () => {
    updateTaskStatus(!task.completed);
  };

  const handleDelete = () => {
    deleteTask();
  };

  // Animation variants
  const variants = {
    hidden: { 
      opacity: 0, 
      y: 10, 
      transition: { duration: 0.3 } 
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.3 } 
    },
    exit: { 
      opacity: 0, 
      y: 10, 
      transition: { duration: 0.3 } 
    }
  };

  if (isDeleting) {
    return (
      <motion.div
        initial="visible"
        animate="exit"
        variants={variants}
        className="task-item p-0 h-0 overflow-hidden"
      />
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      data-task-id={task.id}
      className={cn(
        "task-item group p-4 flex items-center justify-between",
        task.completed && "completed"
      )}
    >
      <div className="flex items-center gap-3">
        <Checkbox 
          checked={task.completed}
          onCheckedChange={handleStatusChange}
          className="h-5 w-5 rounded-md border-2 border-gray-300"
        />
        <span className={cn(
          "task-text text-gray-800 transition-all",
          task.completed && "line-through text-gray-400"
        )}>
          {task.text}
        </span>
      </div>
      <button 
        onClick={handleDelete}
        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
      >
        <Trash size={16} />
      </button>
    </motion.div>
  );
}
