import { useState, useCallback, useEffect } from 'react';

export function useMicrophonePermission() {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  // Check if microphone permission is already granted
  const checkPermission = useCallback(async () => {
    try {
      setIsChecking(true);
      
      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("MediaDevices API not supported");
        setHasPermission(false);
        setIsChecking(false);
        return false;
      }
      
      // Try to get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // If we get here, permission was granted
      setHasPermission(true);
      
      // Release tracks
      stream.getTracks().forEach(track => track.stop());
      
      setIsChecking(false);
      return true;
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      setHasPermission(false);
      setIsChecking(false);
      return false;
    }
  }, []);

  // Request microphone permission
  const requestPermission = useCallback(async () => {
    try {
      setIsChecking(true);
      
      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("MediaDevices API not supported");
        setHasPermission(false);
        setIsChecking(false);
        return false;
      }
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // If we get here, permission was granted
      setHasPermission(true);
      
      // Release tracks
      stream.getTracks().forEach(track => track.stop());
      
      setIsChecking(false);
      return true;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      setHasPermission(false);
      setIsChecking(false);
      return false;
    }
  }, []);

  // Check permission when component mounts
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    hasPermission,
    isChecking,
    checkPermission,
    requestPermission
  };
}