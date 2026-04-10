export type NotificationCategory =
  | "booking"
  | "voucher"
  | "ticket"
  | "system";

export interface SupportNotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  category: NotificationCategory;
}
