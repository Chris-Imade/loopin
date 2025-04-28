import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { coinPackages } from "../../store/coinStore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

// Create a mapping between package IDs and their Stripe price IDs
// This will be replaced with actual Stripe price IDs created in the Stripe dashboard
const PRICE_ID_MAP: { [key: string]: string } = {
  small: process.env.NEXT_PUBLIC_STRIPE_SMALL_PACK_ID || "price_small_pack",
  medium: process.env.NEXT_PUBLIC_STRIPE_MEDIUM_PACK_ID || "price_medium_pack",
  large: process.env.NEXT_PUBLIC_STRIPE_LARGE_PACK_ID || "price_large_pack",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { packageId, userId } = req.body;

    if (!packageId || !userId) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Find the coin package
    const coinPackage = coinPackages.find((pkg) => pkg.id === packageId);
    if (!coinPackage) {
      return res.status(400).json({ error: "Invalid package ID" });
    }

    // Create the Stripe checkout session for a one-time payment
    const session = await stripe.checkout.sessions.create({
      mode: "payment", // Use 'payment' for one-time charges instead of 'subscription'
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${coinPackage.name} - ${coinPackage.coins} Loopin Coins`,
              description: `Purchase ${coinPackage.coins} Loopin Coins`,
              images: ["https://example.com/coin-image.png"], // Replace with actual coin image URL
            },
            unit_amount: Math.round(coinPackage.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        packageId,
        coins: coinPackage.coins.toString(),
      },
      success_url: `${req.headers.origin}/coins/success?session_id={CHECKOUT_SESSION_ID}&package_id=${packageId}`,
      cancel_url: `${req.headers.origin}/coins/canceled`,
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
}
