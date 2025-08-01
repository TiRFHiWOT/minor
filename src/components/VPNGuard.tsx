import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useVPNDetection } from '@/hooks/useVPNDetection';
import { Loader } from 'lucide-react';

interface VPNGuardProps {
  children: React.ReactNode;
}

// Memoized loading component to prevent unnecessary re-renders
const LoadingSpinner = ({ message }: { message: string }) => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
);

export const VPNGuard = ({ children }: VPNGuardProps) => {
  console.log('🛡️ VPNGuard component mounted');
  const { isBlocked, isLoading, error } = useVPNDetection();
  const location = useLocation();
  const navigate = useNavigate();

  console.log('🛡️ VPNGuard state:', { 
    isBlocked, 
    isLoading, 
    error,
    pathname: location.pathname 
  });

  // Memoize navigation logic to prevent unnecessary re-renders
  const shouldRedirect = useMemo(() => 
    isBlocked && location.pathname !== '/vpn-blocked',
    [isBlocked, location.pathname]
  );

  useEffect(() => {
    // Only redirect if VPN is detected and user is not already on the VPN blocked page
    if (shouldRedirect) {
      console.log('🛡️ Redirecting to VPN blocked page');
      navigate('/vpn-blocked', { replace: true });
    }
  }, [shouldRedirect, navigate]);

  // Show error state if there's an error (but still allow access)
  if (error) {
    console.warn('🛡️ VPN detection error, allowing access:', error);
  }

  // Show loading spinner while checking VPN status
  if (isLoading) {
    return <LoadingSpinner message="Checking connection..." />;
  }

  // If VPN is detected and user is trying to access any page other than VPN blocked page, 
  // show redirecting message while navigation happens
  if (shouldRedirect) {
    return <LoadingSpinner message="Redirecting..." />;
  }

  // Render children normally if no VPN detected or if on VPN blocked page
  return <>{children}</>;
};