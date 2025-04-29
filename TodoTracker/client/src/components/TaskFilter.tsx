import { useState } from "react";
import { cn } from "@/lib/utils";

type FilterType = "all" | "active" | "completed";

interface TaskFilterProps {
  onFilterChange: (filter: FilterType) => void;
}

export function TaskFilter({ onFilterChange }: TaskFilterProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    onFilterChange(filter);
  };

  return (
    <div className="flex border-b border-gray-200">
      <button 
        className={cn(
          "flex-1 py-3 px-4 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300 transition-colors",
          activeFilter === "all" && "text-primary border-primary"
        )}
        onClick={() => handleFilterChange("all")}
      >
        All
      </button>
      <button 
        className={cn(
          "flex-1 py-3 px-4 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300 transition-colors",
          activeFilter === "active" && "text-primary border-primary"
        )}
        onClick={() => handleFilterChange("active")}
      >
        Active
      </button>
      <button 
        className={cn(
          "flex-1 py-3 px-4 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300 transition-colors",
          activeFilter === "completed" && "text-primary border-primary"
        )}
        onClick={() => handleFilterChange("completed")}
      >
        Completed
      </button>
    </div>
  );
}
