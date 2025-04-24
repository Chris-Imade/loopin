import React from "react";
import {
  SparklesIcon as HeroSparklesIcon,
  ArrowRightIcon as HeroArrowRightIcon,
} from "@heroicons/react/24/solid";

export const SparklesIcon = ({ width = 24, height = 24, ...props }) => (
  <HeroSparklesIcon width={width} height={height} {...props} />
);

export const ArrowRightIcon = ({ width = 24, height = 24, ...props }) => (
  <HeroArrowRightIcon width={width} height={height} {...props} />
);
