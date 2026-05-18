import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import onboardingReducer from "@/app/store/slices/onboardingSlice";
import authReducer from "@/app/store/slices/authSlice";
import { authApi } from "@/app/store/api/authApi";
import { notificationApi } from "@/app/store/api/notificationApi";
import dashboardApi from "@/app/store/api/dashboardApi";
import bookingApi from "@/app/store/api/bookingApi";
import crewApi from "@/app/store/api/crewApi";
import customerApi from "@/app/store/api/customerApi";
import activityApi from "@/app/store/api/activityApi";
import ticketApi from "@/app/store/api/ticketApi";
import voucherApi from "@/app/store/api/voucherApi";
import giftVoucherApi from "@/app/store/api/giftVoucherApi";
import accountingApi from "@/app/store/api/accountingApi";
import payoutApi from "@/app/store/api/payoutApi";

export const store = configureStore({
  reducer: {
    onboarding: onboardingReducer,
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [bookingApi.reducerPath]: bookingApi.reducer,
    [crewApi.reducerPath]: crewApi.reducer,
    [customerApi.reducerPath]: customerApi.reducer,
    [activityApi.reducerPath]: activityApi.reducer,
    [ticketApi.reducerPath]: ticketApi.reducer,
    [voucherApi.reducerPath]: voucherApi.reducer,
    [giftVoucherApi.reducerPath]: giftVoucherApi.reducer,
    [accountingApi.reducerPath]: accountingApi.reducer,
    [payoutApi.reducerPath]: payoutApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      notificationApi.middleware,
      dashboardApi.middleware,
      bookingApi.middleware,
      crewApi.middleware,
      customerApi.middleware,
      activityApi.middleware,
      ticketApi.middleware,
      voucherApi.middleware,
      giftVoucherApi.middleware,
      accountingApi.middleware,
      payoutApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
