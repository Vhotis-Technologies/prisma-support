import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/** Role selected on sign-up UI; only `support` can complete public registration. */
export type SignUpRoleSelection = "admin" | "support" | null;

export interface OnboardingState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  signUpRole: SignUpRoleSelection;
}

const initialState: OnboardingState = {
  /** Default to support so self-service signup is one step; user can switch to Admin to read notice. */
  signUpRole: "support",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
};

const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
    setSignUpData(state, action: PayloadAction<OnboardingState>) {
      return action.payload;
    },
    setSignUpRole(state, action: PayloadAction<SignUpRoleSelection>) {
      state.signUpRole = action.payload;
    },
    clearOnboarding() {
      return initialState;
    },
  },
});

export const { setSignUpData, setSignUpRole, clearOnboarding } =
  onboardingSlice.actions;
export default onboardingSlice.reducer;
