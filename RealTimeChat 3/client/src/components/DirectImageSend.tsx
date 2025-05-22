import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

interface DirectImageSendProps {
  onSendImage: (imageData: string) => void;
}

export default function DirectImageSend({ onSendImage }: DirectImageSendProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    // Strict size limit for WebSockets
    if (file.size > 200 * 1024) {
      alert('Image too large! Please select an image smaller than 200KB for reliable sharing.');
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    // Simple direct approach - read as data URL and send
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      onSendImage(imageData);
      setIsUploading(false);
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.onerror = () => {
      console.error('Error reading file');
      setIsUploading(false);
    };
    
    reader.readAsDataURL(file);
  };
  
  return (
    <Button 
      variant="outline"
      size="sm"
      onClick={handleButtonClick}
      disabled={isUploading}
      className="flex items-center space-x-1 mx-auto"
    >
      <Camera className="h-4 w-4" />
      <span>Send Photo</span>
      <input 
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </Button>
  );
}