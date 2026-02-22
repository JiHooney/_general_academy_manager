import { z } from 'zod';

// ─────────────────────────────────────────────
// Auth Schemas
// ─────────────────────────────────────────────

export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(80),
  timezone: z.string().default('UTC'),
  locale: z.enum(['ko', 'en', 'ja', 'zh-Hant', 'zh-Hans', 'fr']).default('en'),
});
export type SignupDto = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof LoginSchema>;

// ─────────────────────────────────────────────
// Studio / Classroom Schemas
// ─────────────────────────────────────────────

export const CreateStudioSchema = z.object({
  name: z.string().min(1).max(100),
});
export type CreateStudioDto = z.infer<typeof CreateStudioSchema>;

export const CreateClassroomSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  timezone: z.string().default('UTC'),
});
export type CreateClassroomDto = z.infer<typeof CreateClassroomSchema>;

// ─────────────────────────────────────────────
// Invite Schemas
// ─────────────────────────────────────────────

export const CreateInviteSchema = z.object({
  type: z.enum(['student', 'teacher']),
  expiresAt: z.string().datetime().optional(),
  maxUses: z.number().int().positive().optional(),
});
export type CreateInviteDto = z.infer<typeof CreateInviteSchema>;

export const JoinInviteSchema = z.object({
  code: z.string().min(1),
});
export type JoinInviteDto = z.infer<typeof JoinInviteSchema>;

// ─────────────────────────────────────────────
// Booking / Appointment Schemas
// ─────────────────────────────────────────────

export const CreateBookingRequestSchema = z.object({
  requestedTeacherId: z.string().uuid().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  message: z.string().max(1000).optional(),
});
export type CreateBookingRequestDto = z.infer<typeof CreateBookingRequestSchema>;

export const TeacherRecommendSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
});
export type TeacherRecommendDto = z.infer<typeof TeacherRecommendSchema>;

export const UpdateAppointmentSchema = z.object({
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  note: z.string().max(1000).optional(),
  status: z.enum(['confirmed', 'canceled', 'rescheduled']).optional(),
});
export type UpdateAppointmentDto = z.infer<typeof UpdateAppointmentSchema>;

// ─────────────────────────────────────────────
// Calendar Query Schema
// ─────────────────────────────────────────────

export const CalendarQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});
export type CalendarQuery = z.infer<typeof CalendarQuerySchema>;

// ─────────────────────────────────────────────
// Ticket Schemas
// ─────────────────────────────────────────────

export const CreateTicketSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
});
export type CreateTicketDto = z.infer<typeof CreateTicketSchema>;

export const UpdateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'closed']).optional(),
  content: z.string().max(5000).optional(),
});
export type UpdateTicketDto = z.infer<typeof UpdateTicketSchema>;
