import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

interface SimpleSendImageProps {
  onSend: (imageData: string) => void;
}

export default function SimpleSendImage({ onSend }: SimpleSendImageProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    // Stricter size limit for better WebSocket transmission
    if (file.size > 300 * 1024) {
      alert('Image too large! Please select an image smaller than 300KB for reliable sharing.');
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    // Process and compress the image before sending
    const img = new Image();
    img.onload = () => {
      // Create canvas for resizing/compression
      const canvas = document.createElement('canvas');
      
      // Calculate new dimensions (max 600px width/height)
      let width = img.width;
      let height = img.height;
      const MAX_SIZE = 600;
      
      if (width > height && width > MAX_SIZE) {
        height = Math.round(height * (MAX_SIZE / width));
        width = MAX_SIZE;
      } else if (height > MAX_SIZE) {
        width = Math.round(width * (MAX_SIZE / height));
        height = MAX_SIZE;
      }
      
      // Set canvas dimensions and draw resized image
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to compressed JPEG
        const compressedImage = canvas.toDataURL('image/jpeg', 0.7);
        
        // Send the compressed image
        console.log("Sending compressed image");
        onSend(compressedImage);
      } else {
        // Fallback if canvas context isn't available
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData = e.target?.result as string;
          onSend(imageData);
        };
        reader.readAsDataURL(file);
      }
      
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    // Handle image loading errors
    img.onerror = () => {
      console.error('Error loading image');
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    // Load the image from file
    const reader = new FileReader();
    reader.onload = (e) => img.src = e.target?.result as string;
    reader.onerror = () => {
      console.error('Error reading file');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };
  
  return (
    <div>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={handleButtonClick} 
        disabled={isUploading}
        title="Send a photo"
        className="text-blue-500 hover:text-blue-700 hover:bg-blue-100"
      >
        <Camera className="h-5 w-5" />
        <span className="sr-only">Send Photo</span>
      </Button>
      <input 
        type="file" 
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}