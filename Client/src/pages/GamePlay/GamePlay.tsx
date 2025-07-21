import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/ui/card";
import { LazyImage } from "../../components/ui/LazyImage";
import { LuExpand, LuX } from "react-icons/lu";
import KeepPlayingModal from "../../components/modals/KeepPlayingModal";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useGameById } from "../../backend/games.service";
import {
  useCreateAnalytics,
  useUpdateAnalytics,
} from "../../backend/analytics.service";
import {
  useTrackAnonymousGameSession,
  useUpdateAnonymousGameSession,
} from "../../backend/anonymous.analytics.service";
import { getVisitorSessionId } from "../../utils/sessionUtils";
import type { SimilarGame } from "../../backend/types";
import GameLoadingScreen from "../../components/single/GameLoadingScreen";

export default function GamePlay() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const { data: game, isLoading, error } = useGameById(gameId || "");
  const { mutate: createAnalytics } = useCreateAnalytics();
  const { mutate: updateAnalytics } = useUpdateAnalytics();
  const analyticsIdRef = useRef<string | null>(null);
  
  // Anonymous analytics
  const { mutate: trackAnonymousSession } = useTrackAnonymousGameSession();
  const { mutate: updateAnonymousSession } = useUpdateAnonymousGameSession();
  const anonymousSessionIdRef = useRef<string | null>(null);
  const reachedTimeLimitRef = useRef<boolean>(false);

  const handleOpenSignUpModal = () => {
    setIsSignUpModalOpen(true);
  };

  const [expanded, setExpanded] = useState(false);
  const [isGameLoading, setIsGameLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const { isAuthenticated } = useAuth();

  console.log(isSignUpModalOpen);

  // Reset loading states when gameId changes (for similar games navigation)
  useEffect(() => {
    setIsGameLoading(true);
    setLoadProgress(0);
    setTimeRemaining(null);
    
    // Clear any existing session refs when navigating to a new game
    const currentAnalyticsId = analyticsIdRef.current;
    const currentAnonymousId = anonymousSessionIdRef.current;
    
    if (currentAnalyticsId) {
      updateAnalytics({
        id: currentAnalyticsId,
        endTime: new Date(),
      });
      analyticsIdRef.current = null;
    }
    
    if (currentAnonymousId) {
      updateAnonymousSession({
        id: currentAnonymousId,
        endedAt: new Date(),
        reachedTimeLimit: reachedTimeLimitRef.current 
      });
      anonymousSessionIdRef.current = null;
      reachedTimeLimitRef.current = false;
    }
  }, [gameId, updateAnalytics, updateAnonymousSession]);



  useEffect(() => {
    if (game?.gameFile?.s3Key) {
      const timer = setTimeout(() => {
        setIsGameLoading(false);
        setLoadProgress(100);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [game]);

  // Timer for non-authenticated users - starts after game is loaded
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (game && !isAuthenticated && game.config > 0 && !isGameLoading) {
      setIsModalOpen(false);
      setTimeRemaining(game.config * 60);
      
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(timer);
            setIsModalOpen(true);
            
            reachedTimeLimitRef.current = true;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
        setIsModalOpen(false);
      }
    };
  }, [game, isAuthenticated, isGameLoading, updateAnonymousSession]);


  // Create analytics record when game starts
  useEffect(() => {
    if (!game) return;

    // Prevent duplicate calls
    if (isAuthenticated && analyticsIdRef.current) return;
    if (!isAuthenticated && anonymousSessionIdRef.current) return;

    if (isAuthenticated) {
      createAnalytics(
        {
          gameId: game.id,
          activityType: "game_session",
          startTime: new Date(),
        },
        {
          onSuccess: (response) => {
            console.log('✅ Authenticated session created:', response.id);
            analyticsIdRef.current = response.id;
          },
          onError: (error: any) => {
            console.error('❌ Failed to create authenticated session:', error);
          }
        }
      );
    } else {
      const sessionId = getVisitorSessionId();
      const startTime = new Date();
      
      trackAnonymousSession(
        {
          sessionId,
          gameId: game.id,
          startedAt: startTime,
        },
        {
          onSuccess: (response) => {
            anonymousSessionIdRef.current = response.id;
          },
          onError: (error: any) => {
            console.error('❌ Failed to track anonymous session:', error);
          }
        }
      );
    }
  }, [game, isAuthenticated, createAnalytics, trackAnonymousSession]);



  const location = useLocation();

  const updateEndTime = async () => {
    if (!analyticsIdRef.current) return;
    
    try {
      const endTime = new Date();
      await updateAnalytics({
        id: analyticsIdRef.current,
        endTime,
      });
      analyticsIdRef.current = null;
    } catch (error) {
      console.error('Failed to update analytics:', error);
      analyticsIdRef.current = null;
    }
  };

  
  const updateAnonymousEndTime = () => {
    if (!anonymousSessionIdRef.current) return;
    
    const sessionId = anonymousSessionIdRef.current;
    const endTime = new Date();
    
    updateAnonymousSession(
      {
        id: sessionId,
        endedAt: endTime,
        reachedTimeLimit: reachedTimeLimitRef.current 
      },
      {
        onSuccess: (response) => {
          console.log('✅ Anonymous session updated successfully:', response);
        },
        onError: (error: any) => {
          console.error('❌ Failed to update anonymous session:', error);
        }
      }
    );
    
    // Clear refs after initiating update
    anonymousSessionIdRef.current = null;
    reachedTimeLimitRef.current = false;
  };

  // Handle route changes
  useEffect(() => {
    // Only update if we're actually leaving the current game page
    const currentPath = location.pathname;
    const isGameplayPage = currentPath.includes('/gameplay/');
    const currentGameInPath = currentPath.split('/gameplay/')[1];
    
    // Don't update if we're still on the same game page or just arrived
    if (isGameplayPage && currentGameInPath === gameId) {
      return;
    }
     
    if (analyticsIdRef.current) {
      updateEndTime();
    }
    if (anonymousSessionIdRef.current) {
      updateAnonymousEndTime();
    }
  }, [location, gameId]);



  // Handle page unload and cleanup
  useEffect(() => {
    
    const handleBeforeUnload = () => {;
      const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
      
      if (analyticsIdRef.current) {
        const endTime = new Date();
        const url = `${baseURL}/api/analytics/${analyticsIdRef.current}/end`;
        const data = new Blob([JSON.stringify({ endTime })], {
          type: 'application/json',
        });
        navigator.sendBeacon(url, data);
        analyticsIdRef.current = null;
      }
      
      if (anonymousSessionIdRef.current) {
        const endTime = new Date();
        const url = `${baseURL}/api/anonymous/update-game-session/${anonymousSessionIdRef.current}`;
        const data = new Blob([JSON.stringify({ 
          endedAt: endTime,
          reachedTimeLimit: reachedTimeLimitRef.current
        })], {
          type: 'application/json',
        });
        navigator.sendBeacon(url, data);
        anonymousSessionIdRef.current = null;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (analyticsIdRef.current) {
        updateEndTime();
      }
      
      if (anonymousSessionIdRef.current) {
        updateAnonymousEndTime();
      }
      
      window.removeEventListener('beforeunload', handleBeforeUnload);
      const iframe = document.querySelector<HTMLIFrameElement>("#gameIframe");
      if (iframe) {
        iframe.src = "about:blank";
      }
    };
  }, []);

  // Handle game loading progress
  const handleLoadProgress = (progress: number) => {
    setLoadProgress(progress);
  };

  return (
    <div>
      {isLoading ? (
        <div className="flex items-center justify-center h-[80vh]">
          <span className="text-xl">Loading game...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-[80vh]">
          <span className="text-xl text-red-500">
            {error instanceof Error ? error.message : "Error loading game"}
          </span>
        </div>
      ) : game?.gameFile?.s3Key ? (
        <>
          <div className={expanded ? "fixed inset-0 z-40 bg-black" : "relative"}>
            <div
              className={`relative ${
                expanded
                  ? "h-screen w-full"
                  : "w-full"
              } overflow-hidden`}
              // style={{ background: "#18181b" }}
            >
              {isGameLoading && (
                <GameLoadingScreen
                  game={game}
                  onProgress={handleLoadProgress}
                  progress={loadProgress}
                />
              )}
              {!isModalOpen ? (
                <iframe
                  src={`${game.gameFile.s3Key}`}
                  className={`w-full`}
                  style={{ 
                    display: "block", 
                    // background: "transparent",
                    height: expanded ? "calc(100% - 60px)" : "100vh",
                    border: "none"
                  }}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  title={game.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  scrolling="no"
                  onLoad={() => {
                    setLoadProgress(100);
                  }}
                />
              ) : (
                <div 
                  className="w-full bg-gray-900"
                  style={{ 
                    height: expanded ? "calc(100% - 60px)" : "100vh",
                  }}
                />
              )}

              {/* Beautiful game platform overlay when time is up */}
              {isModalOpen && (
                <div 
                  className="absolute inset-0 z-50 bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900"
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseUp={(e) => e.preventDefault()}
                  onMouseMove={(e) => e.preventDefault()}
                  onClick={(e) => e.preventDefault()}
                  onKeyDown={(e) => e.preventDefault()}
                  onKeyUp={(e) => e.preventDefault()}
                  onTouchStart={(e) => e.preventDefault()}
                  onTouchMove={(e) => e.preventDefault()}
                  onTouchEnd={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                  tabIndex={-1}
                />
              )}
              <KeepPlayingModal
                open={isModalOpen}
                openSignUpModal={handleOpenSignUpModal}
                isGameLoading={isGameLoading}
              />
              {expanded && (
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-2 bg-[#2d0036] border-t border-purple-400 z-50">
                  <span className="text-white text-sm font-semibold">
                    {game.title}
                  </span>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span role="img" aria-label="smile" className="text-xl">
                        😍
                      </span>
                      <span role="img" aria-label="smile" className="text-xl">
                        🥲
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      {/* Timer display for unauthenticated users in fullscreen */}
                      {!isAuthenticated && timeRemaining !== null && timeRemaining > 0 && (
                        <div className="flex items-center space-x-2 bg-purple-600/20 px-3 py-1 rounded-full border border-purple-400/30">
                          <span className="text-xs text-purple-300">⏱️</span>
                          <span className="text-white text-sm font-medium">
                            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      )}
                      <button
                        className="text-white hover:text-purple-400 transition-colors"
                        onClick={() => setExpanded((e) => !e)}
                        title={expanded ? "Exit Fullscreen" : "Expand"}
                      >
                        <LuExpand className="w-5 h-5" />
                      </button>
                      <button
                        className="text-white hover:text-purple-400 transition-colors"
                        onClick={() => {
                          if (analyticsIdRef.current) {
                            updateEndTime();
                          }
                          if (anonymousSessionIdRef.current) {
                            updateAnonymousEndTime();
                          }
                          navigate(-1);
                        }}
                        title="Close Game"
                      >
                        <LuX className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {!expanded && (
              <div className="flex items-center justify-between px-6 py-2 bg-[#2d0036] border-t border-purple-400 rounded-b-2xl">
                <span className="text-white text-sm font-semibold">
                  {game.title}
                </span>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span role="img" aria-label="smile" className="text-xl">
                      😍
                    </span>
                    <span role="img" aria-label="smile" className="text-xl">
                      🥲
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    {/* Timer display for unauthenticated users */}
                    {!isAuthenticated && timeRemaining !== null && timeRemaining > 0 && (
                      <div className="flex items-center space-x-2 bg-purple-600/20 px-3 py-1 rounded-full border border-purple-400/30">
                        <span className="text-xs text-purple-300">⏱️</span>
                        <span className="text-white text-sm font-medium">
                          {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    )}
                    <button
                      className="text-white hover:text-purple-400 transition-colors"
                      onClick={() => setExpanded((e) => !e)}
                      title={expanded ? "Exit Fullscreen" : "Expand"}
                    >
                      <LuExpand className="w-5 h-5" />
                    </button>
                    <button
                      className="text-white hover:text-purple-400 transition-colors cursor-pointer"
                      onClick={() => {
                        if (analyticsIdRef.current) {
                          updateEndTime();
                        }
                        if (anonymousSessionIdRef.current) {
                          updateAnonymousEndTime();
                        }
                        navigate('/');
                      }}
                      title="Close Game"
                    >
                      <LuX className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Similar Games section */}
          {!expanded && game.similarGames && game.similarGames.length > 0 && (
            <div className="dark:bg-[#18181b] p-2">
              <h2 className="text-2xl font-semibold dark:text-white text-[#18181b] mb-4 px-4">
                Similar Games
              </h2>
              <Card className="border-hidden shadow-none p-0 bg-transparent">
                <div className="grid gap-[8px] w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 justify-items-center">
                  {game.similarGames.map((similarGame: SimilarGame) => (
                    <div key={similarGame.id} className="relative p-[10px] group cursor-pointer w-full max-w-[360px]">
                      <div className="relative h-[290px] min-h-[290px] max-h-[290px] rounded-[18px] border-4 border-transparent group-hover:border-[#D946EF] transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(217,70,239,0.3)] overflow-hidden"
                           onClick={() => {
                             if (analyticsIdRef.current) {
                               updateEndTime();
                             }
                             if (anonymousSessionIdRef.current) {
                               updateAnonymousEndTime();
                             }
                             navigate(`/gameplay/${similarGame.id}`);
                           }}>
                        <LazyImage
                          src={similarGame.thumbnailFile?.s3Key || ""}
                          alt={similarGame.title}
                          className="w-full h-full object-cover"
                          loadingClassName="rounded-[14px]"
                          spinnerColor="#D946EF"
                          rootMargin="50px"
                        />
                        {/* Game Info Overlay - Only visible on hover */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-b-[14px] p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out">
                          <h3 className="text-white font-bold text-lg mb-1 truncate">
                            {similarGame.title}
                          </h3>
                          {similarGame.description && (
                            <p className="text-gray-200 text-sm leading-tight">
                              {similarGame.description.length > 80 
                                ? `${similarGame.description.substring(0, 80)}...` 
                                : similarGame.description
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center h-[80vh]">
          <span className="text-xl">
            Game not found or no game file available
          </span>
        </div>
      )}
    </div>
  );
}
