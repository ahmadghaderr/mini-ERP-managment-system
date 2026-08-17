export interface AccessRequest {
  id: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt: string | null;
}

export interface ApproveAccessRequestPayload {
  userName: string;
  role: string;
}