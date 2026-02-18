// ─────────────────────────────────────────────
// Shared Types
// ─────────────────────────────────────────────

export type Locale = 'ko' | 'en' | 'ja' | 'zh-Hant' | 'zh-Hans' | 'fr';

export type ClassroomRole = 'admin' | 'teacher' | 'student';
export type MembershipStatus = 'active' | 'pending' | 'blocked';
export type InviteType = 'student' | 'teacher';

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'canceled'
  | 'expired';

export type AppointmentStatus = 'confirmed' | 'canceled' | 'rescheduled';

export type NotificationType =
  | 'booking_request'
  | 'booking_accepted'
  | 'booking_rejected'
  | 'booking_canceled'
  | 'appointment_canceled'
  | 'appointment_rescheduled'
  | 'general';

export type TicketStatus = 'open' | 'in_progress' | 'closed';

// ── Entity shapes returned from the API ──────────────────────────

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  timezone: string;
  locale: Locale;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  ownerUserId: string;
  defaultTimezone: string;
  createdAt: string;
}

export interface Studio {
  id: string;
  organizationId: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export interface Classroom {
  id: string;
  studioId: string;
  name: string;
  description?: string;
  timezone: string;
  createdBy: string;
  createdAt: string;
}

export interface ClassroomMembership {
  id: string;
  classroomId: string;
  userId: string;
  roleInClassroom: ClassroomRole;
  status: MembershipStatus;
  joinedAt: string;
}

export interface InviteCode {
  id: string;
  classroomId: string;
  code: string;
  type: InviteType;
  expiresAt?: string;
  maxUses?: number;
  usedCount: number;
  isRevoked: boolean;
  createdBy: string;
  createdAt: string;
}

export interface BookingRequest {
  id: string;
  classroomId: string;
  requestedTeacherId?: string;
  studentId: string;
  startAt: string;
  endAt: string;
  message?: string;
  status: BookingStatus;
  createdAt: string;
  respondedAt?: string;
}

export interface Appointment {
  id: string;
  classroomId: string;
  teacherId: string;
  studentId: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  payloadJson: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  classroomId: string;
  createdBy: string;
  title: string;
  content: string;
  status: TicketStatus;
  createdAt: string;
}

// ── API response helpers ──────────────────────────────────────────

export interface ApiError {
  statusCode: number;
  message: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}
