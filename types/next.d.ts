// Add types for Next.js page configurations
import { NextPage } from "next";
import { ReactElement, ReactNode } from "react";

declare module "next" {
  export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
    getLayout?: (page: ReactElement) => ReactNode;
  };

  export interface ExperimentalConfig {
    optimizeCss?: boolean;
    scrollRestoration?: boolean;
  }
}

// Allowing dynamic export on page modules
declare module "*.tsx" {
  const dynamic: string;
  export { dynamic };
}
