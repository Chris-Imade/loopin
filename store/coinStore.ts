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
  packages: CoinPackage[];
  dailyRewardClaimed: boolean;
  dailyRewardLastClaimed: string | null; // ISO date string
  loadUserCoins: (userId: string) => Promise<void>;
  addCoins: (userId: string, amount: number) => Promise<void>;
  spendCoins: (userId: string, amount: number) => Promise<boolean>;
  claimDailyReward: (userId: string) => Promise<boolean>;
  resetDailyReward: () => void;
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

export const useCoinStore = create<CoinState>()(
  persist(
    (set, get) => ({
      coins: 0,
      isLoading: false,
      packages: coinPackages,
      dailyRewardClaimed: false,
      dailyRewardLastClaimed: null,

      loadUserCoins: async (userId: string) => {
        set({ isLoading: true });
        try {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            set({ coins: userData.coins || 0 });
          } else {
            // Initialize coins if user document doesn't have them
            await updateDoc(doc(db, "users", userId), {
              coins: 0,
            });
          }
        } catch (error) {
          console.error("Error loading user coins:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      addCoins: async (userId: string, amount: number) => {
        try {
          await updateDoc(doc(db, "users", userId), {
            coins: increment(amount),
          });

          // Update local state
          set((state) => ({ coins: state.coins + amount }));
        } catch (error) {
          console.error("Error adding coins:", error);
          throw error;
        }
      },

      spendCoins: async (userId: string, amount: number) => {
        const { coins } = get();

        // Check if user has enough coins
        if (coins < amount) {
          return false;
        }

        try {
          await updateDoc(doc(db, "users", userId), {
            coins: increment(-amount),
          });

          // Update local state
          set((state) => ({ coins: state.coins - amount }));
          return true;
        } catch (error) {
          console.error("Error spending coins:", error);
          return false;
        }
      },

      claimDailyReward: async (userId: string) => {
        const today = new Date().toISOString().split("T")[0];
        const { dailyRewardLastClaimed } = get();

        // Check if already claimed today
        if (dailyRewardLastClaimed === today) {
          return false;
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
          }));

          return true;
        } catch (error) {
          console.error("Error claiming daily reward:", error);
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
