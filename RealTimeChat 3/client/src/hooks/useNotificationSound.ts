import { useRef, useEffect } from 'react';

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Create audio element on mount
    audioRef.current = new Audio('/notification.mp3');
    
    // Clean up on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  // Function to play notification sound
  const playNotification = () => {
    if (audioRef.current) {
      // Reset to beginning in case it's already playing
      audioRef.current.currentTime = 0;
      
      // Play the notification sound
      audioRef.current.play().catch(error => {
        // Handle cases where sound can't be played
        // (e.g., browser restrictions requiring user interaction first)
        console.log('Could not play notification sound:', error);
      });
    }
  };
  
  return { playNotification };
}