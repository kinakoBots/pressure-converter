import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Image } from 'lucide-react';

interface SimplePhotoButtonProps {
  onSendPhoto: (imageData: string) => void;
}

export default function SimplePhotoButton({ onSendPhoto }: SimplePhotoButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Small files only to ensure reliable transmission
    if (file.size > 150 * 1024) { // 150KB max
      alert("Please select a smaller photo (under 150KB)");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    setIsLoading(true);
    
    // Simple direct approach - read as data URL and send
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Send the image data
        onSendPhoto(reader.result);
      }
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    
    reader.onerror = () => {
      setIsLoading(false);
      alert("Error reading photo");
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    
    reader.readAsDataURL(file);
  };
  
  return (
    <>
      <Button
        variant="secondary" 
        size="sm"
        onClick={handleClick}
        disabled={isLoading}
        className="max-w-[200px] mx-auto flex items-center gap-2"
      >
        <Image className="h-4 w-4" />
        {isLoading ? "Sending..." : "Share a Photo"}
      </Button>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}