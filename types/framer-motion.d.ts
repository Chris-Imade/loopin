import { AnimationProps } from "framer-motion";

// Custom type definitions to augment Framer Motion's types
declare module "framer-motion" {
  export interface MotionTransitionProps {
    delay?: number;
    duration?: number;
    type?: string;
    stiffness?: number;
    damping?: number;
    mass?: number;
    velocity?: number;
    ease?: string | Array<number>;
    bounce?: number;
    restSpeed?: number;
    restDelta?: number;
  }

  export interface AnimatePresenceProps {
    mode?: "sync" | "wait" | "popLayout";
  }

  // Extend the existing AnimationProps with our custom transition type
  export interface AnimationProps {
    transition?: MotionTransitionProps;
  }
}
