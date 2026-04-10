/**
 * Unauthenticated onboarding routes: sign-in / sign-up navigation and Redux `onboardingSlice` helpers.
 *
 * `signUpRole` persists the user’s role choice during multi-step sign-up before auth completes.
 *
 * @module app_hooks/useOnboarding
 */
import { router, type Href } from "expo-router";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/app/store/main_store";
import {
  clearOnboarding,
  setSignUpRole,
  type SignUpRoleSelection,
} from "@/app/store/slices/onboardingSlice";

/**
 * @returns Navigation callbacks, current `signUpRole`, dispatch helpers for onboarding slice.
 */
export function useOnboarding() {
  const dispatch = useDispatch();
  const signUpRole = useSelector((s: RootState) => s.onboarding.signUpRole);

  const navigateToSignIn = useCallback(() => {
    router.push("/onboarding/SigninScreen" as Href);
  }, []);

  const navigateToSignUp = useCallback(() => {
    router.push("/onboarding/SignUpScreen" as Href);
  }, []);

  const setRole = useCallback(
    (role: SignUpRoleSelection) => {
      dispatch(setSignUpRole(role));
    },
    [dispatch]
  );

  const resetOnboarding = useCallback(() => {
    dispatch(clearOnboarding());
  }, [dispatch]);

  return {
    signUpRole,
    setSignUpRole: setRole,
    clearOnboarding: resetOnboarding,
    navigateToSignIn,
    navigateToSignUp,
  };
}
