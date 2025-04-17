
import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export const PREMIUM_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID;
export const CREATOR_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_CREATOR_PRICE_ID;
