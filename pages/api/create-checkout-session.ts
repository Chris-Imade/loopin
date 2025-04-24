import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { priceId, userId, planId } = req.body;

    if (!priceId || !userId) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Check if this is a subscription or one-time payment based on planId pattern
    const isSubscription =
      planId &&
      (planId === "premium-monthly" ||
        planId === "premium-yearly" ||
        planId === "creator");

    // Create different session types based on whether it's a subscription or one-time payment
    let session;

    if (isSubscription) {
      // Create subscription session
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${req.headers.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/subscription/canceled`,
        metadata: {
          userId,
          planId,
          isSubscription: "true",
        },
      });
    } else {
      // Create one-time payment session for coins
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${req.headers.origin}/coins/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/coins/canceled`,
        metadata: {
          userId,
          packageId: planId, // Using planId as packageId for coins
          isSubscription: "false",
        },
      });
    }

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
}
