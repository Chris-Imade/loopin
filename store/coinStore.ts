import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price: number;
  priceId: string; // Stripe price ID
  bestValue?: boolean;
}

interface CoinState {
  coins: number;
  isLoading: boolean;
  isOffline: boolean;
  errorMessage: string | null;
  packages: CoinPackage[];
  dailyRewardClaimed: boolean;
  dailyRewardLastClaimed: string | null; // ISO date string
  loadUserCoins: (userId: string) => Promise<void>;
  addCoins: (userId: string, amount: number) => Promise<void>;
  spendCoins: (userId: string, amount: number) => Promise<boolean>;
  claimDailyReward: (userId: string) => Promise<boolean>;
  resetDailyReward: () => void;
  clearError: () => void;
  setOfflineStatus: (status: boolean) => void;
}

export const coinPackages: CoinPackage[] = [
  {
    id: "small",
    name: "Small Pack",
    coins: 100,
    price: 1.99,
    priceId: "price_small_pack",
  },
  {
    id: "medium",
    name: "Medium Pack",
    coins: 300,
    price: 4.99,
    priceId: "price_medium_pack",
  },
  {
    id: "large",
    name: "Large Pack",
    coins: 750,
    price: 9.99,
    priceId: "price_large_pack",
    bestValue: true,
  },
];

// Daily login reward amount
const DAILY_REWARD_AMOUNT = 10;

// Helper to check if we're in development mode
const isDevelopment =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

// Mock coin data for development when APIs are not available
const MOCK_COIN_DATA = {
  coins: 100,
  lastUpdated: new Date().toISOString(),
};

// Helper to check if the error is related to being offline
const isOfflineError = (error: any): boolean => {
  if (!error) return false;

  // First check if browser is offline
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return true;
  }

  // Check for common network error messages
  return (
    error.message?.includes("offline") ||
    error.message?.includes("network") ||
    error.message?.includes("unavailable") ||
    error.message?.includes("failed to get") ||
    error.message?.includes("transaction failed") ||
    error.status === 503 ||
    error.status === 504
  );
};

// Helper function to get user token for API requests
const getUserToken = async (): Promise<string> => {
  // Get the current user token from Firebase Auth
  const auth = (await import("firebase/auth")).getAuth();
  if (!auth.currentUser) {
    throw new Error("User not authenticated");
  }
  return auth.currentUser.getIdToken();
};

export const useCoinStore = create<CoinState>()(
  persist(
    (set, get) => ({
      coins: 0,
      isLoading: false,
      isOffline: false,
      errorMessage: null,
      packages: coinPackages,
      dailyRewardClaimed: false,
      dailyRewardLastClaimed: null,

      setOfflineStatus: (status: boolean) => {
        set({ isOffline: status });
      },

      clearError: () => {
        set({ errorMessage: null });
      },

      loadUserCoins: async (userId: string) => {
        set({ isLoading: true, errorMessage: null });

        // Immediately check offline status
        if (!navigator.onLine) {
          console.log("Device is offline, using cached coin data");
          set({
            isOffline: true,
            isLoading: false,
            errorMessage: "You're offline. Using cached coin data.",
          });
          return;
        }

        try {
          // Get user token for authentication
          const token = await getUserToken();

          // Get user data from MongoDB API
          const response = await fetch(`/api/user/coins?userId=${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            // If in development mode and API fails, use mock data
            if (isDevelopment) {
              console.log("Using mock coin data in development mode");
              set({
                coins: MOCK_COIN_DATA.coins,
                isOffline: false,
                isLoading: false,
              });
              return;
            }
            throw new Error(`Failed to load coins: ${response.statusText}`);
          }

          const data = await response.json();

          set({
            coins: data.coins || 0,
            isOffline: false,
          });
        } catch (error: any) {
          console.error("Error loading user coins:", error);

          // For development, provide mock data even if API fails
          if (isDevelopment) {
            console.log("Using mock coin data in development due to API error");
            set({
              coins: MOCK_COIN_DATA.coins,
              isOffline: false,
              isLoading: false,
              errorMessage: "Using mock coin data - API error in development",
            });
            return;
          }

          // Check if it's an offline error
          if (isOfflineError(error)) {
            set({
              isOffline: true,
              errorMessage: "Unable to reach the server. Using cached data.",
            });
            console.log("Using cached coin data due to offline status");
          } else {
            // Some other error
            set({
              errorMessage: error.message || "Failed to load coin data",
            });
          }
        } finally {
          set({ isLoading: false });
        }
      },

      addCoins: async (userId: string, amount: number) => {
        set({ errorMessage: null });

        // Check network connectivity first
        if (!navigator.onLine) {
          console.error("Cannot add coins while offline");
          set({
            isOffline: true,
            errorMessage:
              "Cannot add coins while offline. Please check your connection.",
          });
          throw new Error(
            "You appear to be offline. Please check your connection and try again."
          );
        }

        try {
          // Get user token for authentication
          const token = await getUserToken();

          // In development mode, simulate successful API call
          if (isDevelopment) {
            const newTotal = get().coins + amount;
            console.log(`[DEV] Adding ${amount} coins. New total: ${newTotal}`);

            // Update local state
            set((state) => ({
              coins: newTotal,
              isOffline: false,
            }));

            return;
          }

          // Add coins via MongoDB API
          const response = await fetch("/api/user/coins", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ userId, amount }),
          });

          if (!response.ok) {
            throw new Error(`Failed to add coins: ${response.statusText}`);
          }

          const data = await response.json();

          // Update local state
          set((state) => ({
            coins: data.newTotal || state.coins + amount,
            isOffline: false,
          }));
        } catch (error: any) {
          console.error("Error adding coins:", error);

          if (isOfflineError(error)) {
            set({
              isOffline: true,
              errorMessage:
                "Cannot add coins while offline. Please check your connection.",
            });
          } else {
            set({ errorMessage: error.message || "Failed to add coins" });
          }

          throw error;
        }
      },

      spendCoins: async (userId: string, amount: number) => {
        set({ errorMessage: null });
        const { coins } = get();

        // Check if user has enough coins
        if (coins < amount) {
          set({ errorMessage: "Not enough coins for this action" });
          return false;
        }

        // Check network connectivity
        if (!navigator.onLine) {
          console.error("Cannot spend coins while offline");
          set({
            isOffline: true,
            errorMessage:
              "Cannot spend coins while offline. Please check your connection.",
          });
          throw new Error(
            "You appear to be offline. Please check your connection and try again."
          );
        }

        try {
          // Get user token for authentication
          const token = await getUserToken();

          // In development mode, simulate successful API call
          if (isDevelopment) {
            const newTotal = get().coins - amount;
            console.log(
              `[DEV] Spending ${amount} coins. New total: ${newTotal}`
            );

            // Update local state
            set((state) => ({
              coins: newTotal,
              isOffline: false,
            }));

            return true;
          }

          // Spend coins via MongoDB API
          const response = await fetch("/api/user/coins/spend", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ userId, amount }),
          });

          if (!response.ok) {
            throw new Error(`Failed to spend coins: ${response.statusText}`);
          }

          const data = await response.json();

          // Update local state
          set((state) => ({
            coins: data.newTotal || state.coins - amount,
            isOffline: false,
          }));
          return true;
        } catch (error: any) {
          console.error("Error spending coins:", error);

          if (isOfflineError(error)) {
            set({
              isOffline: true,
              errorMessage:
                "Cannot spend coins while offline. Please check your connection.",
            });
          } else {
            set({ errorMessage: error.message || "Failed to spend coins" });
          }

          throw error;
        }
      },

      claimDailyReward: async (userId: string) => {
        set({ errorMessage: null });
        const today = new Date().toISOString().split("T")[0];
        const { dailyRewardLastClaimed } = get();

        // Check if already claimed today
        if (dailyRewardLastClaimed === today) {
          return false;
        }

        // Check network connectivity
        if (!navigator.onLine) {
          console.error("Cannot claim reward while offline");
          set({
            isOffline: true,
            errorMessage:
              "Cannot claim rewards while offline. Please check your connection.",
          });
          throw new Error(
            "You appear to be offline. Please check your connection and try again."
          );
        }

        try {
          // In development mode, simulate successful API call
          if (isDevelopment) {
            console.log(
              `[DEV] Claiming daily reward of ${DAILY_REWARD_AMOUNT} coins`
            );

            // Update local state
            set((state) => ({
              coins: state.coins + DAILY_REWARD_AMOUNT,
              dailyRewardClaimed: true,
              dailyRewardLastClaimed: today,
              isOffline: false,
            }));

            return true;
          }

          // Get user token for authentication
          const token = await getUserToken();

          // Claim daily reward via API
          const response = await fetch("/api/user/coins/claim", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ userId }),
          });

          if (!response.ok) {
            throw new Error(
              `Failed to claim daily reward: ${response.statusText}`
            );
          }

          const data = await response.json();

          // Update local state
          set((state) => ({
            coins: data.newTotal || state.coins + DAILY_REWARD_AMOUNT,
            dailyRewardClaimed: true,
            dailyRewardLastClaimed: today,
            isOffline: false,
          }));

          return true;
        } catch (error: any) {
          console.error("Error claiming daily reward:", error);

          if (isOfflineError(error)) {
            set({
              isOffline: true,
              errorMessage:
                "Cannot claim rewards while offline. Please check your connection.",
            });
          } else {
            set({
              errorMessage: error.message || "Failed to claim daily reward",
            });
          }

          return false;
        }
      },

      resetDailyReward: () => {
        const today = new Date().toISOString().split("T")[0];
        const { dailyRewardLastClaimed } = get();

        // Reset daily reward status if it's a new day
        if (dailyRewardLastClaimed !== today) {
          set({ dailyRewardClaimed: false });
        }
      },
    }),
    {
      name: "loopin-coins-storage",
      partialize: (state) => ({
        coins: state.coins,
        dailyRewardClaimed: state.dailyRewardClaimed,
        dailyRewardLastClaimed: state.dailyRewardLastClaimed,
      }),
    }
  )
);
