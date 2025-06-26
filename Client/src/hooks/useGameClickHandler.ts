import { useNavigate } from 'react-router-dom';
import { useRecordGameClick } from '../backend/games.service';
import { backendService } from '../backend/api.service';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
interface UseGameClickHandlerOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  trackingEnabled?: boolean;
}

export const useGameClickHandler = (
  options: UseGameClickHandlerOptions = {}
) => {
  const navigate = useNavigate();
  const recordGameClick = useRecordGameClick();
  const { isAuthenticated } = useAuth();
  const { onSuccess, onError, trackingEnabled = true } = options;

  const handleGameClick = async (gameId: string) => {
    try {
      if (isAuthenticated) {
        await backendService.post(`/api/games/${gameId}/access`);
      }
      navigate(`/gameplay/${gameId}`);

      if (trackingEnabled) {
        try {
          await recordGameClick.mutateAsync(gameId);
          onSuccess?.();
        } catch (error) {
          console.warn('Failed to track game click:', error);
          onError?.(error);
        }
      }
    } catch (error) {
      toast.error('Could not prepare game session.Please try again');
      console.error('Error granting game access', error);
    }
  };

  return {
    handleGameClick,
    isTracking: recordGameClick.isPending,
    trackingError: recordGameClick.error,
  };
};
