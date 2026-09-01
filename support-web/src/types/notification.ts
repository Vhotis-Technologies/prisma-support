export type NotificationCategory = "booking" | "voucher" | "ticket" | "system";

/** UI inbox row. Mobile currently seeds this locally — no list endpoint exists. */
export type SupportNotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  category: NotificationCategory;
};

export type SaveNotificationTokenRequest = {
  token: string;
};

export type SaveNotificationTokenResponse = {
  success: boolean;
};
