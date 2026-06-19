export interface Notification {
  id: string;
  userId: number;
  role: string;
  ticketId: number;
  eventType: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  expiresAt: string | null;
}
