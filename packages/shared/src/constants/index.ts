export const SUPPORTED_LOCALES = ['ko', 'en', 'ja', 'zh-Hant', 'zh-Hans', 'fr'] as const;
export const DEFAULT_LOCALE = 'en';
export const DEFAULT_TIMEZONE = 'UTC';

export const BOOKING_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CANCELED: 'canceled',
  EXPIRED: 'expired',
} as const;

export const APPOINTMENT_STATUS = {
  CONFIRMED: 'confirmed',
  CANCELED: 'canceled',
  RESCHEDULED: 'rescheduled',
} as const;

export const CLASSROOM_ROLE = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
} as const;

export const MEMBERSHIP_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  BLOCKED: 'blocked',
} as const;

export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  CLOSED: 'closed',
} as const;

export const INVITE_TYPE = {
  STUDENT: 'student',
  TEACHER: 'teacher',
} as const;

export const ERROR_CODES = {
  SCHEDULE_CONFLICT: 'schedule.conflict',
  INVITE_EXPIRED: 'invite.expired',
  INVITE_REVOKED: 'invite.revoked',
  INVITE_MAX_USES: 'invite.maxUses',
  UNAUTHORIZED: 'auth.unauthorized',
  FORBIDDEN: 'auth.forbidden',
} as const;

// Queue names
export const QUEUE_NOTIFICATION = 'notification';
export const QUEUE_EMAIL = 'email';

// API pagination defaults
export const DEFAULT_PAGE = 1;
export const DEFAULT_PER_PAGE = 20;
