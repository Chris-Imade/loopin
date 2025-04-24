import { useEffect } from "react";
import { useRouter } from "next/router";
import { useUserStore } from "../store/userStore";

export const useAuth = (redirectIfNotAuthenticated = true) => {
  const { user, isLoading } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    // Only redirect on client-side
    if (typeof window === "undefined") return;

    // Only redirect after we're sure auth state has been checked
    if (!isLoading && !user && redirectIfNotAuthenticated) {
      router.push("/");
    }
  }, [user, isLoading, router, redirectIfNotAuthenticated]);

  return { user, isLoading };
};
