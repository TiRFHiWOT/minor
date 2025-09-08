import { useState, useEffect } from "react";
import { sessionManager, TempUser } from "@/utils/sessionManager";
import { validateAnonymousContent } from "@/utils/anonymousUtils";

interface TempUserState {
  tempUser: TempUser | null;
  isLoading: boolean;
  canPost: boolean;
  remainingPosts: number;
}

export const useTempUser = () => {
  const [state, setState] = useState<TempUserState>({
    tempUser: null,
    isLoading: true,
    canPost: false,
    remainingPosts: 0,
  });

  useEffect(() => {
    initializeTempUser();
  }, []);

  const initializeTempUser = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      // Initialize session and get temp user ID
      await sessionManager.initializeSession();
      // Get temp user data
      const tempUser = await sessionManager.getTempUserData();
      // Force canPost: true and remainingPosts: 999999 for new sessions
      setState({
        tempUser,
        isLoading: false,
        canPost: true,
        remainingPosts: 999999,
      });
      console.debug(
        "[useTempUser] Forced canPost: true, remainingPosts: 999999 for new session",
        tempUser
      );
    } catch (error) {
      console.error("Error initializing temp user:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        canPost: false,
        remainingPosts: 0,
      }));
    }
  };

  const refreshRateLimit = async () => {
    try {
      // Always allow unlimited posting for anonymous users
      setState((prev) => ({ ...prev, canPost: true, remainingPosts: 999999 }));
      console.debug(
        "[useTempUser] Forced canPost: true, remainingPosts: 999999 in refreshRateLimit"
      );
    } catch (error) {
      console.error("Error refreshing rate limit:", error);
    }
  };

  const validateContent = (content: string) => {
    return validateAnonymousContent(content);
  };

  const getTempUserId = () => {
    return sessionManager.getTempUserId();
  };

  const recordPost = async () => {
    await sessionManager.recordPost();
  };

  return {
    ...state,
    refreshRateLimit,
    validateContent,
    getTempUserId,
    recordPost,
  };
};
