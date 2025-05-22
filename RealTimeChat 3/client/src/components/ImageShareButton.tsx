import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

interface ImageShareButtonProps {
  onSendImage: (imageData: string) => void;
}

export default function ImageShareButton({ onSendImage }: ImageShareButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Very strict size limit to ensure reliable transmission
    if (file.size > 100 * 1024) { // 100KB max
      alert("Please select a smaller image (under 100KB) for reliable sharing.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use FileReader for simplicity
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        onSendImage(imageData);
        setIsLoading(false);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      
      reader.onerror = () => {
        console.error("Error reading file");
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing image:", error);
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isLoading}
        className="text-indigo-600 flex items-center gap-2"
      >
        <Camera className="h-4 w-4" />
        {isLoading ? "Processing..." : "Share Photo"}
      </Button>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
}