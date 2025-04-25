import { useState, useEffect } from "react";
import { Text, Box } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";

// Fun waiting messages
const waitingMessages = [
  "Looking for someone as awesome as you...",
  "Searching the galaxy for your next chat buddy...",
  "Roses are red, violets are blue, finding someone special just for you...",
  "Did you know? The average person meets 10,000 people in their lifetime.",
  "Fun fact: You're only 6 connections away from anyone on Earth!",
  "Hang tight! Great conversations are worth waiting for.",
  "Matching you with someone who might change your perspective...",
  "What's the best thing about Switzerland? Not sure, but the flag is a big plus.",
  "Why don't scientists trust atoms? Because they make up everything.",
  "I was going to tell a time-traveling joke, but you didn't like it.",
  "Life's like a box of matches, finding the right one makes you light up!",
  "Connecting dots and people since 2023!",
  "The real treasure was the friends we made along the way...",
  "Plot twist: Your next best friend is loading...",
  "Shuffling through amazing people to find your match...",
];

export const RandomWaitingMessage = () => {
  const [message, setMessage] = useState("");
  const [key, setKey] = useState(0); // For animation

  useEffect(() => {
    // Choose initial random message
    const randomIndex = Math.floor(Math.random() * waitingMessages.length);
    setMessage(waitingMessages[randomIndex]);

    // Change message every 8 seconds
    const interval = setInterval(() => {
      const newIndex = Math.floor(Math.random() * waitingMessages.length);
      setMessage(waitingMessages[newIndex]);
      setKey((prev) => prev + 1); // Trigger animation
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box height="24px">
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 10 } as any}
          animate={{ opacity: 1, y: 0 } as any}
          exit={{ opacity: 0, y: -10 } as any}
          transition={{ duration: 0.5 }}
        >
          <Text color="whiteAlpha.800" textAlign="center" px={4}>
            {message}
          </Text>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
};
