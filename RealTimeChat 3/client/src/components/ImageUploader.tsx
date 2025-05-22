import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (imageData: string) => void;
}

export default function ImageUploader({ onImageSelected }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    // Check file size - limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large! Please select an image smaller than 5MB.');
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    // Convert the image to a data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      
      // Compress the image before sending
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Scale down large images
        let width = img.width;
        let height = img.height;
        
        // Max dimensions
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        
        if (width > MAX_WIDTH) {
          height = height * (MAX_WIDTH / width);
          width = MAX_WIDTH;
        }
        
        if (height > MAX_HEIGHT) {
          width = width * (MAX_HEIGHT / height);
          height = MAX_HEIGHT;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get as JPEG with compression
          const compressedImage = canvas.toDataURL('image/jpeg', 0.7);
          console.log("Compressed image: original size:", imageData.length, "new size:", compressedImage.length);
          
          onImageSelected(compressedImage);
          setIsUploading(false);
        } else {
          // Fallback if canvas context isn't available
          console.log("Using original image (no compression)");
          onImageSelected(imageData);
          setIsUploading(false);
        }
        
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      
      img.src = imageData;
    };
    
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
        title="Upload an image"
        className="text-blue-500 hover:text-blue-700 hover:bg-blue-100"
      >
        <Camera className="h-5 w-5" />
        <span className="sr-only">Upload Image</span>
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