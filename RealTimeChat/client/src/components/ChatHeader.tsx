import { useState } from 'react';
import { 
  Dialog,
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

interface ChatHeaderProps {
  roomName: string;
  activeUsers: number;
}

export default function ChatHeader({ roomName, activeUsers }: ChatHeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 sticky top-0 z-10 flex items-center justify-between">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-gray-800">QuickChat</h1>
        <div className="ml-2 text-xs font-medium px-2 py-1 bg-primary bg-opacity-10 text-primary rounded-full">
          {roomName}
        </div>
      </div>
      
      <div className="flex items-center">
        <span className="text-sm text-gray-500 mr-2">
          <span>{activeUsers}</span> online
        </span>
        
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 focus:outline-none">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chat Settings</DialogTitle>
              <DialogDescription>
                Configure your chat experience
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <p className="text-sm text-gray-500">
                QuickChat keeps messages only for the current session. No data is stored permanently.
              </p>
            </div>
            
            <DialogFooter>
              <Button onClick={() => setIsSettingsOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
