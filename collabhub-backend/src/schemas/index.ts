import { z } from 'zod';

// User Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  role: z.enum(['FOUNDER', 'TALENT', 'INVESTOR']),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  bio: z.string().max(1000).optional(),
  skills: z.array(z.string()).max(20).optional(),
  linkedinUrl: z.string().url().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});

// Startup Schemas
export const createStartupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  tagline: z.string().min(10, 'Tagline must be at least 10 characters').max(200),
  description: z.string().min(50, 'Description must be at least 50 characters').max(5000),
  industry: z.string().min(1, 'Industry is required'),
  stage: z.enum(['IDEA', 'MVP', 'GROWTH', 'SCALE']),
  fundingGoal: z.number().positive().optional(),
  websiteUrl: z.string().url().optional().nullable(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'INVESTORS_ONLY']).default('PUBLIC'),
  location: z.string().min(1, 'Location is required').max(100),
  tags: z.array(z.string()).max(10).default([]),
});

export const updateStartupSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  tagline: z.string().min(10).max(200).optional(),
  description: z.string().min(50).max(5000).optional(),
  industry: z.string().optional(),
  stage: z.enum(['IDEA', 'MVP', 'GROWTH', 'SCALE']).optional(),
  fundingGoal: z.number().positive().optional().nullable(),
  fundingRaised: z.number().min(0).optional(),
  websiteUrl: z.string().url().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  pitchDeckUrl: z.string().url().optional().nullable(),
  location: z.string().max(100).optional(),
  tags: z.array(z.string()).max(10).optional(),
  teamSize: z.number().int().positive().optional(),
});

export const updateVisibilitySchema = z.object({
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'INVESTORS_ONLY']),
});

// Role Schemas
export const createRoleSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters').max(3000),
  type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'EQUITY_ONLY']),
  compensation: z.string().max(100).optional(),
  equityRange: z.string().max(50).optional(),
  skills: z.array(z.string()).min(1, 'At least one skill required').max(15),
  isOpen: z.boolean().default(true),
});

// Application Schemas
export const createApplicationSchema = z.object({
  startupId: z.string().min(1, 'Startup ID is required'),
  roleId: z.string().min(1, 'Role ID is required'),
  coverLetter: z.string().min(50, 'Cover letter must be at least 50 characters').max(3000),
  resumeUrl: z.string().url().optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['REVIEWING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED']),
  notes: z.string().max(1000).optional(),
});

// Chat Schemas
export const createConversationSchema = z.object({
  participantIds: z.array(z.string()).min(1, 'At least one participant required'),
  type: z.enum(['DIRECT', 'GROUP', 'STARTUP_CHANNEL']).default('DIRECT'),
  relatedStartupId: z.string().optional(),
  relatedApplicationId: z.string().optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000),
  type: z.enum(['TEXT', 'FILE', 'SYSTEM']).default('TEXT'),
  fileUrl: z.string().url().optional(),
});

// Payment Schemas
export const createCheckoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  successUrl: z.string().url('Invalid success URL'),
  cancelUrl: z.string().url('Invalid cancel URL'),
});

// Admin Schemas
export const banUserSchema = z.object({
  reason: z.string().min(10, 'Ban reason must be at least 10 characters').max(500),
});

export const moderateStartupSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING_REVIEW']),
  notes: z.string().max(1000).optional(),
});

// Access Request Schemas
export const createAccessRequestSchema = z.object({
  startupId: z.string().min(1, 'Startup ID is required'),
  message: z.string().max(500).optional(),
  requestedLevel: z.enum(['VIEW_PROFILE', 'VIEW_DECK', 'FULL_ACCESS']).default('VIEW_PROFILE'),
});

export const grantAccessSchema = z.object({
  accessLevel: z.enum(['VIEW_PROFILE', 'VIEW_DECK', 'FULL_ACCESS']),
  expiresInDays: z.number().int().positive().max(365).optional(),
});

// Validation helper
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

// Extract validation error messages
export function formatValidationErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }
  return errors;
}
