import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SmileIcon, SendIcon } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onTyping: (isTyping: boolean) => void;
}

export default function MessageInput({ onSendMessage, onTyping }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle typing indicator with debounce
  useEffect(() => {
    if (message && !isTyping) {
      setIsTyping(true);
      onTyping(true);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onTyping(false);
      }
    }, 2000);
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isTyping, onTyping]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      // Clear typing indicator immediately on send
      setIsTyping(false);
      onTyping(false);
    }
  };
  
  const handleEmojiPicker = () => {
    // For a simple implementation, let's just add a smiley face
    setMessage(prev => prev + ' 😊');
  };
  
  return (
    <footer className="bg-white border-t border-gray-200 px-4 py-3 sticky bottom-0">
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <div className="flex-grow relative">
          <input 
            type="text" 
            placeholder="Type a message..." 
            className="w-full border border-gray-300 rounded-full px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            autoComplete="off"
          />
          <Button 
            type="button" 
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            onClick={handleEmojiPicker}
          >
            <SmileIcon className="h-4 w-4" />
          </Button>
        </div>
        <Button 
          type="submit" 
          className="bg-indigo-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          size="icon"
        >
          <SendIcon className="h-4 w-4" />
        </Button>
      </form>
    </footer>
  );
}
