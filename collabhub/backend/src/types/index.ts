// Common Types for CollabHub Backend

// User Roles
export type UserRole = 'FOUNDER' | 'TALENT' | 'INVESTOR' | 'ADMIN';

// Entity Types
export type EntityType = 
  | 'USER' 
  | 'STARTUP' 
  | 'STARTUP_ROLE' 
  | 'APPLICATION' 
  | 'ACCESS_REQUEST' 
  | 'CONVERSATION' 
  | 'MESSAGE' 
  | 'SUBSCRIPTION' 
  | 'AUDIT_LOG' 
  | 'NOTIFICATION';

// Status Types
export type UserStatus = 'ACTIVE' | 'BANNED' | 'PENDING_VERIFICATION';
export type StartupStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'SUSPENDED';
export type StartupVisibility = 'PUBLIC' | 'PRIVATE' | 'INVESTORS_ONLY';
export type StartupStage = 'IDEA' | 'MVP' | 'GROWTH' | 'SCALE';
export type RoleType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'EQUITY_ONLY';
export type ApplicationStatus = 'PENDING' | 'REVIEWING' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
export type AccessStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
export type AccessLevel = 'VIEW_PROFILE' | 'VIEW_DECK' | 'FULL_ACCESS';
export type ConversationType = 'DIRECT' | 'GROUP' | 'STARTUP_CHANNEL';
export type MessageType = 'TEXT' | 'FILE' | 'SYSTEM';
export type SubscriptionStatus = 'NONE' | 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'TRIALING';
export type SubscriptionTier = 'FREE' | 'PRO' | 'ENTERPRISE';
export type NotificationType = 
  | 'APPLICATION_UPDATE' 
  | 'ACCESS_REQUEST' 
  | 'MESSAGE' 
  | 'SYSTEM' 
  | 'PAYMENT';

// Base DynamoDB Item
export interface BaseItem {
  PK: string;
  SK: string;
  entityType: EntityType;
  createdAt: string;
  updatedAt?: string;
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
}

// User Entity
export interface UserItem extends BaseItem {
  userId: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  bio?: string;
  skills?: string[];
  linkedinUrl?: string;
  status: UserStatus;
  stripeCustomerId?: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionTier: SubscriptionTier;
}

// Startup Entity
export interface StartupItem extends BaseItem {
  startupId: string;
  founderId: string;
  name: string;
  tagline: string;
  description: string;
  industry: string;
  stage: StartupStage;
  fundingGoal?: number;
  fundingRaised?: number;
  logoUrl?: string;
  websiteUrl?: string;
  pitchDeckUrl?: string;
  visibility: StartupVisibility;
  status: StartupStatus;
  teamSize: number;
  location: string;
  tags: string[];
}

// Startup Role Entity
export interface StartupRoleItem extends BaseItem {
  roleId: string;
  startupId: string;
  title: string;
  description: string;
  type: RoleType;
  compensation?: string;
  equityRange?: string;
  skills: string[];
  isOpen: boolean;
  applicantCount: number;
}

// Application Entity
export interface ApplicationItem extends BaseItem {
  applicationId: string;
  startupId: string;
  roleId: string;
  applicantId: string;
  coverLetter: string;
  resumeUrl?: string;
  status: ApplicationStatus;
  founderNotes?: string;
}

// Access Request Entity
export interface AccessRequestItem extends BaseItem {
  accessId: string;
  requesterId: string;
  startupId: string;
  founderId: string;
  message?: string;
  status: AccessStatus;
  accessLevel: AccessLevel;
  grantedAt?: string;
  expiresAt?: string;
}

// Conversation Entity
export interface ConversationItem extends BaseItem {
  conversationId: string;
  participants: string[];
  type: ConversationType;
  relatedStartupId?: string;
  relatedApplicationId?: string;
  lastMessageAt: string;
  lastMessagePreview: string;
}

// Message Entity
export interface MessageItem extends BaseItem {
  messageId: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  fileUrl?: string;
  readBy: string[];
}

// Subscription Entity
export interface SubscriptionItem extends BaseItem {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

// Notification Entity
export interface NotificationItem extends BaseItem {
  notificationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  isRead: boolean;
}

// Audit Log Entity
export interface AuditLogItem extends BaseItem {
  auditId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

// API Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// JWT Claims
export interface JwtClaims {
  sub: string;
  email: string;
  'custom:role': UserRole;
  'cognito:groups'?: string[];
}
