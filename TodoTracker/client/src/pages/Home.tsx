import { TaskForm } from "@/components/TaskForm";
import { TaskList } from "@/components/TaskList";
import { AuthButton } from "@/components/AuthButton";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, isLoading } = useAuth();

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-md">
        {/* Header Section */}
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">TaskFlow</h1>
            <p className="text-gray-500 text-sm">Keep track of your tasks, simply.</p>
          </div>

          <AuthButton />
        </header>

        {/* Main Task Management Area */}
        <Card className="overflow-hidden shadow-sm">
          <TaskForm />
          <TaskList />
        </Card>
      </div>
    </div>
  );
}
