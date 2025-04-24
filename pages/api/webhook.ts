import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { buffer } from "micro";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../../firebase/config";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const isSubscription = session.metadata?.isSubscription === "true";

    if (isSubscription) {
      // Handle subscription completion
      if (session.metadata?.userId && session.metadata?.planId) {
        try {
          const userId = session.metadata.userId;
          const planId = session.metadata.planId;

          // Update user's premium status and subscription type
          await updateDoc(doc(db, "users", userId), {
            isPremium: true,
            subscriptionId: session.subscription as string,
            subscriptionType: planId,
            updatedAt: new Date().toISOString(),
          });

          console.log(
            `Updated subscription for user ${userId} to plan ${planId}`
          );

          // Add free coins based on plan type
          let freeCoins = 0;

          if (planId === "premium-monthly") {
            freeCoins = 50;
          } else if (planId === "premium-yearly") {
            freeCoins = 100;
          } else if (planId === "creator") {
            freeCoins = 150;
          }

          if (freeCoins > 0) {
            await updateDoc(doc(db, "users", userId), {
              coins: increment(freeCoins),
            });
            console.log(
              `Added ${freeCoins} free coins to user ${userId} for ${planId} subscription`
            );
          }
        } catch (error) {
          console.error("Error processing subscription:", error);
          return res
            .status(500)
            .json({ error: "Failed to process subscription" });
        }
      }
    } else {
      // Handle coin purchase completion
      if (session.metadata?.userId && session.metadata?.coins) {
        try {
          const userId = session.metadata.userId;
          const coinsAmount = parseInt(session.metadata.coins, 10);

          // Add coins to user's balance
          await updateDoc(doc(db, "users", userId), {
            coins: increment(coinsAmount),
          });

          console.log(`Added ${coinsAmount} coins to user ${userId}`);
        } catch (error) {
          console.error("Error processing coin purchase:", error);
          return res
            .status(500)
            .json({ error: "Failed to process coin purchase" });
        }
      }
    }
  }

  res.status(200).json({ received: true });
}
