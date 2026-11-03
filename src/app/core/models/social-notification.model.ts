import { User } from './user.model';

export enum SocialNotificationType {
  COMMENT_ON_POST = 'COMMENT_ON_POST',
  COMMENT_ON_PET = 'COMMENT_ON_PET',
  SIGHTING_REPORTED = 'SIGHTING_REPORTED',
  ADOPTION_REQUEST_RECEIVED = 'ADOPTION_REQUEST_RECEIVED',
  ADOPTION_REQUEST_STATUS = 'ADOPTION_REQUEST_STATUS',
  FOLLOWUP_PROOF_SUBMITTED = 'FOLLOWUP_PROOF_SUBMITTED',
  GROUP_ACTIVITY = 'GROUP_ACTIVITY',
}

export interface SocialNotification {
  id: string;
  recipientId: string;
  actorId?: string | null;
  actor?: Partial<User> | null;
  actorNameFallback?: string | null;
  type: SocialNotificationType;
  title: string;
  message: string;
  targetUrl: string;
  entityId?: string | null;
  previewImageUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface SocialNotificationsResponse {
  items: SocialNotification[];
  unreadCount: number;
  totalCount: number;
}

