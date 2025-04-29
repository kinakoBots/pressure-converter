import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TaskForm() {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Function to create a new task using direct fetch
  const createTask = async (taskText: string) => {
    if (!taskText.trim()) return;
    
    setIsSubmitting(true);
    console.log("Creating task with text:", taskText);
    
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ text: taskText }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(errorText || "Failed to create task");
      }
      
      const data = await response.json();
      console.log("Task created successfully:", data);
      
      // Reset the input and success message
      setText("");
      toast({
        title: "Task added!",
        description: "Your task has been added successfully.",
      });
      
      // Trigger a refetch without refreshing the page
      setTimeout(() => {
        const event = new CustomEvent('refetch-tasks');
        window.dispatchEvent(event);
      }, 100);
    } catch (error) {
      console.error("Failed to create task:", error);
      toast({
        title: "Failed to add task",
        description: "There was an error adding your task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (text.trim() === "") return;
    
    createTask(text);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-b border-gray-200">
      <div className="flex gap-3">
        <Input
          type="text"
          placeholder="Add a new task..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          required
          disabled={isSubmitting}
        />
        <Button 
          type="submit" 
          className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-4 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-current animate-spin"></div>
              <span>Adding...</span>
            </div>
          ) : (
            "Add"
          )}
        </Button>
      </div>
    </form>
  );
}
