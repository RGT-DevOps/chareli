import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useSystemConfigByKey } from '../../backend/configuration.service';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { backendService } from '../../backend/api.service';
import { useQueryClient } from '@tanstack/react-query';
import { BackendRoute } from '../../backend/constants';

export interface BulkFreeTimeConfigurationRef {
  getSettings: () => {
    defaultFreeTime: number;
  };
}

interface BulkFreeTimeConfigurationProps {
  disabled?: boolean;
}

const BulkFreeTimeConfiguration = forwardRef<BulkFreeTimeConfigurationRef, BulkFreeTimeConfigurationProps>(
  ({ disabled }, ref) => {
    const [defaultFreeTime, setDefaultFreeTime] = useState(0);
    const [isUpdating, setIsUpdating] = useState(false);
    const queryClient = useQueryClient();

    const { data: configData, isLoading } = useSystemConfigByKey('bulk_free_time_settings');

    useEffect(() => {
      if (configData?.value?.defaultFreeTime !== undefined) {
        setDefaultFreeTime(configData.value.defaultFreeTime);
      }
    }, [configData]);

    useImperativeHandle(ref, () => ({
      getSettings: () => ({
        defaultFreeTime
      })
    }));

    const handleApplyToAllGames = async () => {
      if (defaultFreeTime < 0) {
        toast.error('Free time cannot be negative');
        return;
      }

      try {
        setIsUpdating(true);
        
        // Call backend endpoint to update all games
        const response = await backendService.post('/api/games/bulk-update-free-time', {
          freeTime: defaultFreeTime
        });

        // Invalidate games queries to refresh the cache
        queryClient.invalidateQueries({ queryKey: [BackendRoute.GAMES] });

        const gamesUpdated = response.data?.gamesUpdated || 0;

        console.log("bulk update response", response)

        toast.success(`Successfully updated free time to ${defaultFreeTime} minutes for ${gamesUpdated} game(s)!`);
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || 'Failed to update games';
        toast.error(errorMessage);
        console.error('Error updating bulk free time:', error);
      } finally {
        setIsUpdating(false);
      }
    };

    if (isLoading) {
      return (
        <div className="mb-6 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#6A7282]" />
          </div>
        </div>
      );
    }

    return (
      <div className="mb-6 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg sm:text-xl font-worksans text-[#6A7282] dark:text-white mb-4">
          Bulk Free Game Time Configuration
        </h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="default-free-time" className="text-base font-medium text-black dark:text-white mb-2 block">
              Default Free Game Time (minutes)
            </Label>
            <Input
              id="default-free-time"
              type="number"
              min="0"
              value={defaultFreeTime}
              onChange={(e) => setDefaultFreeTime(parseInt(e.target.value) || 0)}
              disabled={disabled || isUpdating}
              className="max-w-xs bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white"
              placeholder="Enter free time in minutes..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Set the default free game time for new games (saved when you click "Save Configuration")
            </p>
          </div>

          <div className="pt-4 border-t border-gray-300 dark:border-gray-600">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <Label className="text-base font-medium text-black dark:text-white mb-2 block">
                  Apply to All Existing Games
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Click the button below to update the free game time for <strong>all existing games</strong> to the value set above.
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-3">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    ⚠️ <strong>Warning:</strong> This action will overwrite the free time for all games in the system.
                  </p>
                </div>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleApplyToAllGames}
              disabled={disabled || isUpdating}
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating All Games...
                </>
              ) : (
                `Apply ${defaultFreeTime} mins to All Games`
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

BulkFreeTimeConfiguration.displayName = 'BulkFreeTimeConfiguration';

export default BulkFreeTimeConfiguration;
