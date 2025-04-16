
import { create } from 'zustand';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

interface UserState {
  user: any;
  isLoading: boolean;
  signIn: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: true,
  signIn: async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      set({ user: result.user });
    } catch (error) {
      console.error('Auth error:', error);
    }
  }
}));

// Initialize auth state listener
auth.onAuthStateChanged((user) => {
  useUserStore.setState({ user, isLoading: false });
});
