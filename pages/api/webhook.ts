import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { buffer } from "micro";
import { connectToDatabase } from "../../lib/mongodb";
import { updateUserSubscription } from "../../lib/models/user";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

/**
 * Update user's coin balance in MongoDB
 * @param {string} userId Firebase UID of the user
 * @param {number} amount Number of coins to add
 * @returns {Promise<boolean>} Success status
 */
async function addCoinsToUser(userId, amount) {
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection("users");

    // First get current balance to calculate new total
    const user = await usersCollection.findOne({ uid: userId });
    const currentCoins = user?.coins || 0;
    const newTotal = currentCoins + amount;

    console.log(
      `Adding ${amount} coins to user ${userId}. Current balance: ${currentCoins}, New total: ${newTotal}`
    );

    const result = await usersCollection.updateOne(
      { uid: userId },
      {
        $inc: { coins: amount },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );

    if (result.modifiedCount === 0 && result.upsertedCount === 0) {
      console.error(`Failed to update coin balance for user ${userId}`);
      return false;
    }

    console.log(
      `Successfully updated coin balance for user ${userId}. New total: ${newTotal}`
    );
    return true;
  } catch (error) {
    console.error("Error adding coins to user:", error);
    return false;
  }
}

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
    console.log("Processing checkout.session.completed event:", session.id);

    const isSubscription = session.metadata?.isSubscription === "true";

    if (isSubscription) {
      // Handle subscription completion
      if (session.metadata?.userId && session.metadata?.planId) {
        try {
          const userId = session.metadata.userId;
          const planId = session.metadata.planId;

          console.log(
            `Processing subscription for user ${userId}, plan ${planId}`
          );

          // Update user's premium status and subscription type in MongoDB
          const subscriptionUpdated = await updateUserSubscription(
            userId,
            planId
          );

          // Also update additional subscription details
          const { db } = await connectToDatabase();
          const usersCollection = db.collection("users");

          await usersCollection.updateOne(
            { uid: userId },
            {
              $set: {
                isPremium: true,
                subscriptionId: session.subscription as string,
                updatedAt: new Date(),
              },
            }
          );

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
            // Add coins to user in MongoDB
            const coinsAdded = await addCoinsToUser(userId, freeCoins);

            if (coinsAdded) {
              console.log(
                `Added ${freeCoins} free coins to user ${userId} for ${planId} subscription`
              );
            } else {
              console.error(`Failed to add coins to user ${userId}`);
            }
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

          console.log(
            `Processing coin purchase for user ${userId}, amount: ${coinsAmount}`
          );

          // Add coins to user's balance in MongoDB
          const coinsAdded = await addCoinsToUser(userId, coinsAmount);

          if (coinsAdded) {
            console.log(`Added ${coinsAmount} coins to user ${userId}`);
          } else {
            console.error(`Failed to add coins to user ${userId}`);
            return res
              .status(500)
              .json({ error: "Failed to add coins to user" });
          }
        } catch (error) {
          console.error("Error processing coin purchase:", error);
          return res
            .status(500)
            .json({ error: "Failed to process coin purchase" });
        }
      } else {
        console.error("Missing metadata in session:", session.id);
        return res
          .status(400)
          .json({ error: "Missing userId or coins in session metadata" });
      }
    }
  } else {
    console.log(`Received event ${event.type} - no action taken`);
  }

  res.status(200).json({ received: true });
}
