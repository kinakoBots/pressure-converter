import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SmileIcon, SendIcon, Camera } from 'lucide-react';
import { SocketMessageType } from '@/lib/types';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onTyping: (isTyping: boolean) => void;
  onSendImage?: (imageData: string) => void;
}

export default function MessageInput({ onSendMessage, onTyping, onSendImage }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    
    // Handle image submission
    if (imagePreview && onSendImage) {
      console.log("Sending image:", imagePreview.substring(0, 50) + "...");
      onSendImage(imagePreview);
      setImagePreview(null);
      setMessage('');
      return;
    }
    
    // Handle text submission
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
  
  // Removed handleImageSelected - now using handleFileChange directly
  
  const cancelImageUpload = () => {
    setImagePreview(null);
  };
  
  // Direct send image button with improved handling
  const handleSendImageDirectly = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any form submission
    e.stopPropagation(); // Stop event bubbling
    
    if (imagePreview && onSendImage) {
      console.log("Directly sending image - size:", imagePreview.length);
      
      // Try to limit image size if it's too large
      let processedImage = imagePreview;
      if (processedImage.length > 500000) {
        console.log("Image is large, might need compression");
      }
      
      // Actually send the image
      onSendImage(processedImage);
      
      // Reset state
      setImagePreview(null);
      setMessage('');
    }
  };
  
  // Handle file selection for photos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Size limit check
    if (file.size > 100 * 1024) { // 100KB max
      alert("Please select a smaller photo (under 100KB) for reliable sharing.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setImagePreview(imageData);
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.onerror = () => {
      console.error("Error reading file");
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    
    reader.readAsDataURL(file);
  };
  
  return (
    <footer className="bg-white border-t border-gray-200 px-4 py-3 sticky bottom-0">
      {imagePreview && (
        <div className="mb-2 relative">
          <div className="relative border rounded-lg p-2 inline-block">
            <img 
              src={imagePreview} 
              alt="Upload preview" 
              className="h-24 w-auto rounded" 
            />
            <button
              onClick={cancelImageUpload}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
              type="button"
            >
              ×
            </button>
            <button
              onClick={handleSendImageDirectly}
              className="absolute bottom-2 right-2 bg-indigo-500 text-white rounded-full px-3 py-1 text-xs font-medium"
              type="button"
            >
              Send Photo
            </button>
          </div>
        </div>
      )}
      
      <form ref={formRef} onSubmit={handleSubmit} className="flex items-center space-x-2">
        <div className="flex-grow relative">
          <input 
            type="text" 
            placeholder={imagePreview ? "Add a caption (optional)..." : "Type a message..."} 
            className="w-full border border-gray-300 rounded-full px-4 py-2 pr-20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            autoComplete="off"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex">
            {/* Temporarily disabled image upload while we improve it */}
            <Button 
              type="button" 
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={handleEmojiPicker}
            >
              <SmileIcon className="h-4 w-4" />
            </Button>
          </div>
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
