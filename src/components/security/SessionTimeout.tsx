import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SessionTimeoutProps {
  /** Timeout duration in minutes (default: 30) */
  timeoutDuration?: number;
  /** Warning time before timeout in minutes (default: 5) */
  warningTime?: number;
}

/**
 * SessionTimeout Component - Manages user session timeouts for security
 * Automatically logs out inactive users and provides warnings before timeout
 */
export const SessionTimeout = ({ 
  timeoutDuration = 30, 
  warningTime = 5 
}: SessionTimeoutProps) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef(Date.now());

  const resetTimeout = () => {
    lastActivityRef.current = Date.now();
    
    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    setShowWarning(false);

    if (!user) return;

    // Set warning timeout
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      setTimeLeft(warningTime * 60); // Convert minutes to seconds
      
      // Start countdown
      countdownRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, (timeoutDuration - warningTime) * 60 * 1000);

    // Set logout timeout
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, timeoutDuration * 60 * 1000);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Session Expired",
        description: "You have been logged out due to inactivity.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error during automatic logout:', error);
    }
  };

  const handleExtendSession = () => {
    setShowWarning(false);
    resetTimeout();
    toast({
      title: "Session Extended",
      description: "Your session has been extended.",
      variant: "default",
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!user) return;

    const activityEvents = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 
      'touchstart', 'click', 'focus'
    ];

    const resetOnActivity = () => {
      const now = Date.now();
      // Only reset if it's been more than 1 minute since last activity to avoid excessive resets
      if (now - lastActivityRef.current > 60000) {
        resetTimeout();
      }
    };

    // Add event listeners for user activity
    activityEvents.forEach(event => {
      document.addEventListener(event, resetOnActivity, true);
    });

    // Initialize timeout
    resetTimeout();

    return () => {
      // Cleanup
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetOnActivity, true);
      });
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [user, timeoutDuration, warningTime]);

  if (!user) return null;

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Timeout Warning</AlertDialogTitle>
          <AlertDialogDescription>
            Your session will expire in <strong>{formatTime(timeLeft)}</strong> due to inactivity.
            You will be automatically logged out for security reasons.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleLogout}>
            Logout Now
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleExtendSession}>
            Extend Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};