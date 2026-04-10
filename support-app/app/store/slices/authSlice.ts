import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { SupportUserPayload } from "@/app/store/api/authApi";

export interface AuthState {
  access: string | null;
  refresh: string | null;
  user: SupportUserPayload | null;
}

const initialState: AuthState = {
  access: null,
  refresh: null,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(
      state,
      action: PayloadAction<{
        access: string;
        refresh: string;
        user?: SupportUserPayload | null;
      }>,
    ) {
      state.access = action.payload.access;
      state.refresh = action.payload.refresh;
      state.user = action.payload.user ?? null;
    },
    
    setTokens(
      state,
      action: PayloadAction<{ access: string; refresh: string }>,
    ) {
      state.access = action.payload.access;
      state.refresh = action.payload.refresh;
    },
    updateUser(state, action: PayloadAction<Partial<SupportUserPayload>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        return;
      }
      const p = action.payload;
      if (
        p.id &&
        p.email != null &&
        p.first_name != null &&
        p.last_name != null &&
        p.role != null
      ) {
        state.user = p as SupportUserPayload;
      }
    },
    clearSession() {
      return initialState;
    },
  },
});

export const { setSession, setTokens, updateUser, clearSession } =
  authSlice.actions;
export default authSlice.reducer;
