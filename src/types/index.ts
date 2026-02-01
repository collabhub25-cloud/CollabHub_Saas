// User Roles
export type UserRole = 'founder' | 'talent' | 'investor' | 'guest';

// User Interface
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  createdAt: string;
  isVerified: boolean;
}

// Founder Profile
export interface FounderProfile {
  userId: string;
  bio: string;
  company: string;
  location: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  experience: string;
  previousCompanies: string[];
  skills: string[];
}

// Talent Profile
export interface TalentProfile {
  userId: string;
  bio: string;
  location: string;
  title: string;
  skills: string[];
  experience: string;
  portfolio?: string;
  github?: string;
  linkedin?: string;
  resume?: string;
  availability: 'immediate' | '2weeks' | '1month' | 'negotiable';
  expectedSalary?: string;
  isOpenToWork: boolean;
}

// Investor Profile
export interface InvestorProfile {
  userId: string;
  firm?: string;
  title: string;
  bio: string;
  location: string;
  investmentStage: string[];
  checkSize: string;
  sectors: string[];
  portfolioCompanies: number;
  linkedin?: string;
  website?: string;
  isAccredited: boolean;
}

// Startup
export type StartupStage = 'idea' | 'mvp' | 'seed' | 'series-a' | 'series-b' | 'growth';
export type StartupStatus = 'active' | 'hiring' | 'funded' | 'closed';

export interface Startup {
  id: string;
  name: string;
  tagline: string;
  description: string;
  logo?: string;
  coverImage?: string;
  founderId: string;
  founder: User;
  stage: StartupStage;
  status: StartupStatus;
  location: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  industry: string[];
  foundedDate: string;
  teamSize: number;
  fundingRaised: string;
  roles: Role[];
  teamMembers: TeamMember[];
  milestones: Milestone[];
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Role/Job Opening
export type RoleType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'cofounder';
export type RoleStatus = 'open' | 'filled' | 'paused';

export interface Role {
  id: string;
  startupId: string;
  title: string;
  description: string;
  type: RoleType;
  location: string;
  isRemote: boolean;
  salary?: string;
  equity?: string;
  skills: string[];
  requirements: string[];
  responsibilities: string[];
  status: RoleStatus;
  applicationsCount: number;
  createdAt: string;
}

// Team Member
export interface TeamMember {
  id: string;
  userId: string;
  user: User;
  startupId: string;
  role: string;
  joinDate: string;
  isActive: boolean;
}

// Milestone
export type MilestoneStatus = 'pending' | 'in-progress' | 'completed' | 'delayed';

export interface Milestone {
  id: string;
  startupId: string;
  title: string;
  description: string;
  dueDate: string;
  status: MilestoneStatus;
  assignedTo?: string;
  completedAt?: string;
}

// Application
export type ApplicationStatus = 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'accepted';

export interface Application {
  id: string;
  roleId: string;
  role: Role;
  startupId: string;
  startup: Startup;
  talentId: string;
  talent: User;
  talentProfile: TalentProfile;
  status: ApplicationStatus;
  coverLetter?: string;
  resume?: string;
  appliedAt: string;
  updatedAt: string;
  notes?: string;
}

// Message/Chat
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: User;
  content: string;
  attachments?: Attachment[];
  createdAt: string;
  isRead: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

// Investor Interest
export interface InvestorInterest {
  id: string;
  investorId: string;
  investor: User;
  startupId: string;
  startup: Startup;
  status: 'interested' | 'contacted' | 'meeting-scheduled' | 'passed';
  notes?: string;
  createdAt: string;
}

// Bookmark
export interface Bookmark {
  id: string;
  userId: string;
  startupId: string;
  startup: Startup;
  createdAt: string;
}

// Notification
export type NotificationType = 
  | 'application_received' 
  | 'application_status_changed' 
  | 'message_received' 
  | 'role_filled' 
  | 'investor_interest' 
  | 'team_member_joined' 
  | 'milestone_completed';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

// Analytics
export interface StartupAnalytics {
  startupId: string;
  views: number;
  uniqueViews: number;
  applications: number;
  conversionRate: number;
  topSkills: { skill: string; count: number }[];
  viewsOverTime: { date: string; count: number }[];
}

// Filter Types
export interface StartupFilters {
  stage?: StartupStage[];
  industry?: string[];
  location?: string;
  isRemote?: boolean;
  skills?: string[];
  search?: string;
}

export interface TalentFilters {
  skills?: string[];
  experience?: string;
  availability?: string;
  location?: string;
  isOpenToWork?: boolean;
  search?: string;
}

// Navigation
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  roles?: UserRole[];
}

// Pricing Plan
export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  period: 'month' | 'year';
  features: string[];
  isPopular?: boolean;
  cta: string;
}
