export interface CommentResponse {
  id: number;
  ticketId: number;
  userId: number;
  userRole: string;
  message: string;
  createdAt: string;
}
