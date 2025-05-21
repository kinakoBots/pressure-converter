import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface JoinPromptProps {
  onJoin: (username: string, roomId: string) => void;
}

export default function JoinPrompt({ onJoin }: JoinPromptProps) {
  const [username, setUsername] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('general');
  
  // Simple static room list for reliability
  const rooms = [
    { id: 'general', name: 'General Chat' },
    { id: 'tech', name: 'Tech Discussion' },
    { id: 'random', name: 'Random Thoughts' }
  ];
  
  // Generate a random guest name on mount
  useEffect(() => {
    const randomId = Math.floor(100 + Math.random() * 900);
    setUsername(`Guest${randomId}`);
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUsername = username.trim() || `Guest${Math.floor(100 + Math.random() * 900)}`;
    onJoin(finalUsername, selectedRoom);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Join QuickChat</h2>
        <p className="text-gray-600 text-sm mb-6">Start chatting instantly as a guest. No account needed!</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Display Name (Optional)
            </Label>
            <Input 
              type="text" 
              id="username" 
              placeholder="Enter a name or use auto-assigned Guest ID"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Leave blank for a random guest name</p>
          </div>
          
          <div>
            <Label htmlFor="room-select" className="block text-sm font-medium text-gray-700 mb-1">
              Chat Room
            </Label>
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger id="room-select" className="w-full">
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-indigo-500 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Start Chatting
          </Button>
        </form>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            By joining, you agree to our <a href="#" className="text-indigo-500 hover:underline">Terms</a> and 
            <a href="#" className="text-indigo-500 hover:underline"> Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
