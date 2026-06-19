export interface AttachmentResponse {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
  isBroken?: boolean;
}
