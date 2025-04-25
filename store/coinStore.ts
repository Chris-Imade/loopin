import { create } from "zustand";
import { persist } from "zustand/middleware";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase/config";

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

// Helper to check if the error is related to being offline
const isOfflineError = (error: any): boolean => {
  if (!error) return false;

  // First check if browser is offline
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return true;
  }

  // Check for common Firebase offline error codes and messages
  return (
    error.code === "failed-precondition" ||
    error.code === "unavailable" ||
    error.code === "unimplemented" ||
    error.code?.includes("offline") ||
    error.message?.includes("offline") ||
    error.message?.includes("network") ||
    error.message?.includes("unavailable") ||
    error.message?.includes("failed to get") ||
    error.message?.includes("transaction failed") ||
    error.name === "FirebaseError" ||
    // Check for GRPC status codes used by Firebase
    error.code === "resource-exhausted" ||
    error.code === "internal" ||
    error.code === "deadline-exceeded"
  );
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
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            set({
              coins: userData.coins || 0,
              isOffline: false,
            });
          } else {
            // Initialize coins if user document doesn't have them
            try {
              await updateDoc(doc(db, "users", userId), {
                coins: 0,
              });
              set({ coins: 0, isOffline: false });
            } catch (initError: any) {
              console.log("Could not initialize user coins, using local value");

              if (isOfflineError(initError)) {
                set({
                  isOffline: true,
                  errorMessage:
                    "Unable to connect to server. Using cached data.",
                });
              }
            }
          }
        } catch (error: any) {
          console.error("Error loading user coins:", error);

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
          await updateDoc(doc(db, "users", userId), {
            coins: increment(amount),
          });

          // Update local state
          set((state) => ({
            coins: state.coins + amount,
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
          await updateDoc(doc(db, "users", userId), {
            coins: increment(-amount),
          });

          // Update local state
          set((state) => ({
            coins: state.coins - amount,
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

          return false;
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
          await updateDoc(doc(db, "users", userId), {
            coins: increment(DAILY_REWARD_AMOUNT),
            lastDailyReward: today,
          });

          // Update local state
          set((state) => ({
            coins: state.coins + DAILY_REWARD_AMOUNT,
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
