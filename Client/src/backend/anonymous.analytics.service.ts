import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { backendService } from "./api.service";
import { BackendRoute } from "./constants";

// Types for anonymous analytics
interface AnonymousGameSessionData {
  sessionId: string;
  gameId: string;
  startedAt?: Date;
  freeTimeLimitSeconds?: number;
}

interface UpdateGameSessionData {
  id: string;
  endedAt?: Date;
  reachedTimeLimit?: boolean;
}

interface LinkToUserData {
  sessionId: string;
  userId: string;
}

interface MarkVerifiedData {
  userId: string;
}

interface AnonymousUserMetrics {
  uniqueAnonymousUsers: number;
  filters: {
    startDate?: string;
    endDate?: string;
    country?: string;
    deviceType?: string;
  };
}

interface AnonymousGameSessionMetrics {
  totalGameSessions: number;
  sessionsWithPopup: number;
  avgDurationSeconds: number;
  uniqueUnregisteredUsers: number;
  filters: {
    startDate?: string;
    endDate?: string;
    country?: string;
    deviceType?: string;
  };
}

interface ConversionFunnelData {
  funnel: {
    uniqueVisitors: number;
    popupsShown: number;
    signupClicks: number;
    gamePopupClicks: number;
    registrations: number;
    verifiedUsers: number;
  };
  conversionRates: {
    popupRate: number;
    signupRate: number;
    verificationRate: number;
    overallConversionRate: number;
  };
  filters: {
    startDate?: string;
    endDate?: string;
    country?: string;
    deviceType?: string;
  };
}

interface TopConvertingGame {
  gameId: string;
  gameTitle: string;
  freeTimeMinutes: number;
  uniquePlayers: number;
  totalSessions: number;
  popupsShown: number;
  registrations: number;
  verifiedUsers: number;
  avgPlayTimeSeconds: number;
  conversionRate: number;
}

interface TopConvertingGamesData {
  games: TopConvertingGame[];
  filters: {
    limit?: number;
    startDate?: string;
    endDate?: string;
    country?: string;
    deviceType?: string;
  };
}

interface DeviceBreakdown {
  deviceType: string;
  uniqueUsers: number;
  totalSessions: number;
  registrations: number;
  percentage: number;
}

interface CountryBreakdown {
  country: string;
  uniqueUsers: number;
  totalSessions: number;
  registrations: number;
}

interface DemographicsData {
  deviceBreakdown: DeviceBreakdown[];
  countryBreakdown: CountryBreakdown[];
  filters: {
    startDate?: string;
    endDate?: string;
  };
}

interface UserJourneyData {
  journeyStats: {
    sessionId: string;
    totalGamesPlayed: number;
    uniqueGamesPlayed: number;
    totalPlayTime: number;
    gamesReachedTimeLimit: number;
    signupClicks: number;
    isConverted: boolean;
    isVerified: boolean;
    firstVisit: string;
    lastActivity: string;
    deviceType: string;
    country: string;
  };
  gameSequence: Array<{
    gameId: string;
    gameTitle: string;
    startedAt: string;
    endedAt?: string;
    durationSeconds?: number;
    reachedTimeLimit: boolean;
    freeTimeLimitSeconds: number;
  }>;
  signupEvents: Array<{
    type: string;
    gameId?: string;
    gameTitle?: string;
    createdAt: string;
  }>;
}

// Anonymous activity tracking hooks
export const useTrackAnonymousGameSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AnonymousGameSessionData) => {
      const response = await backendService.post('/api/anonymous/track-game-session', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate analytics queries
      queryClient.invalidateQueries({ queryKey: ['anonymousAnalytics'] });
    },
  });
};

export const useUpdateAnonymousGameSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateGameSessionData) => {
      const { id, ...updateData } = data;
      const response = await backendService.put(`/api/anonymous/update-game-session/${id}`, updateData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate analytics queries
      queryClient.invalidateQueries({ queryKey: ['anonymousAnalytics'] });
    },
  });
};

export const useLinkAnonymousToUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: LinkToUserData) => {
      const response = await backendService.post('/api/anonymous/link-to-user', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all analytics queries
      queryClient.invalidateQueries({ queryKey: ['anonymousAnalytics'] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ANALYTICS] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.SIGNUP_ANALYTICS_DATA] });
    },
  });
};

export const useMarkUserAsVerified = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: MarkVerifiedData) => {
      const response = await backendService.post('/api/anonymous/mark-verified', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all analytics queries
      queryClient.invalidateQueries({ queryKey: ['anonymousAnalytics'] });
      queryClient.invalidateQueries({ queryKey: [BackendRoute.ANALYTICS] });
    },
  });
};

// Analytics query hooks
export const useUniqueAnonymousUsers = (filters?: {
  startDate?: string;
  endDate?: string;
  country?: string;
  deviceType?: string;
}) => {
  return useQuery<AnonymousUserMetrics>({
    queryKey: ['anonymousAnalytics', 'uniqueUsers', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.country) params.append('country', filters.country);
      if (filters?.deviceType) params.append('deviceType', filters.deviceType);
      
      const response = await backendService.get(`/api/anonymous/analytics/unique-users?${params}`);
      return response.data;
    },
    refetchOnWindowFocus: false,
  });
};

export const useAnonymousGameSessions = (filters?: {
  startDate?: string;
  endDate?: string;
  country?: string;
  deviceType?: string;
}) => {
  return useQuery<AnonymousGameSessionMetrics>({
    queryKey: ['anonymousAnalytics', 'gameSessions', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.country) params.append('country', filters.country);
      if (filters?.deviceType) params.append('deviceType', filters.deviceType);
      
      const response = await backendService.get(`/api/anonymous/analytics/game-sessions?${params}`);
      return response.data;
    },
    refetchOnWindowFocus: false,
  });
};

export const useConversionFunnel = (filters?: {
  startDate?: string;
  endDate?: string;
  country?: string;
  deviceType?: string;
}) => {
  return useQuery<ConversionFunnelData>({
    queryKey: ['anonymousAnalytics', 'conversionFunnel', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.country) params.append('country', filters.country);
      if (filters?.deviceType) params.append('deviceType', filters.deviceType);
      
      const response = await backendService.get(`/api/anonymous/analytics/conversion-funnel?${params}`);
      return response.data;
    },
    refetchOnWindowFocus: false,
  });
};

export const useTopConvertingGames = (filters?: {
  limit?: number;
  startDate?: string;
  endDate?: string;
  country?: string;
  deviceType?: string;
}) => {
  return useQuery<TopConvertingGamesData>({
    queryKey: ['anonymousAnalytics', 'topGames', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.country) params.append('country', filters.country);
      if (filters?.deviceType) params.append('deviceType', filters.deviceType);
      
      const response = await backendService.get(`/api/anonymous/analytics/top-games?${params}`);
      return response.data;
    },
    refetchOnWindowFocus: false,
  });
};

export const useDemographicsBreakdown = (filters?: {
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery<DemographicsData>({
    queryKey: ['anonymousAnalytics', 'demographics', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      
      const response = await backendService.get(`/api/anonymous/analytics/demographics?${params}`);
      return response.data;
    },
    refetchOnWindowFocus: false,
  });
};

export const useUserJourney = (sessionId: string) => {
  return useQuery<UserJourneyData>({
    queryKey: ['anonymousAnalytics', 'userJourney', sessionId],
    queryFn: async () => {
      const response = await backendService.get(`/api/anonymous/analytics/user-journey/${sessionId}`);
      return response.data;
    },
    refetchOnWindowFocus: false,
    enabled: !!sessionId,
  });
};
