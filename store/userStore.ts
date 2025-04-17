
import { create } from 'zustand';
import { auth } from '../lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';

interface UserState {
  user: any;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  subscriptionStatus?: string;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: true,
  signInWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      set({ user: result.user });
    } catch (error) {
      console.error('Google auth error:', error);
    }
  },
  
  signInWithApple: async () => {
    try {
      const provider = new OAuthProvider('apple.com');
      const result = await signInWithPopup(auth, provider);
      set({ user: result.user });
    } catch (error) {
      console.error('Apple auth error:', error);
    }
  },
  signInWithEmail: async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      set({ user: result.user });
    } catch (error) {
      console.error('Email auth error:', error);
      throw error;
    }
  },
  signUp: async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      set({ user: result.user });
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }
}));

auth.onAuthStateChanged((user) => {
  useUserStore.setState({ user, isLoading: false });
});
