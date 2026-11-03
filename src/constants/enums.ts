export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  PATIENT: 'PATIENT',
  CLINIC_MANAGER: 'CLINIC_MANAGER',
} as const;

export type RoleType = (typeof Role)[keyof typeof Role];

export const AppointmentStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
} as const;

export type AppointmentStatusType = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  BLOCKED: 'BLOCKED',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
} as const;

export type UserStatusType = (typeof UserStatus)[keyof typeof UserStatus];

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
} as const;

export type GenderType = (typeof Gender)[keyof typeof Gender];

export const NotificationType = {
  APPOINTMENT_CREATED: 'APPOINTMENT_CREATED',
  APPOINTMENT_CONFIRMED: 'APPOINTMENT_CONFIRMED',
  APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
  APPOINTMENT_RESCHEDULED: 'APPOINTMENT_RESCHEDULED',
  APPOINTMENT_REJECTED: 'APPOINTMENT_REJECTED',
  NEW_PATIENT_BOOKED: 'NEW_PATIENT_BOOKED',
  APPOINTMENT_REMINDER: 'APPOINTMENT_REMINDER',
} as const;

export type NotificationTypeType = (typeof NotificationType)[keyof typeof NotificationType];

export const MedicalDocumentType = {
  LAB_RESULT: 'LAB_RESULT',
  DIAGNOSIS: 'DIAGNOSIS',
  PRESCRIPTION: 'PRESCRIPTION',
  IMAGING: 'IMAGING',
  OTHER: 'OTHER',
} as const;

export type MedicalDocumentTypeType = (typeof MedicalDocumentType)[keyof typeof MedicalDocumentType];

export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  SLOT_ALREADY_BOOKED: 'SLOT_ALREADY_BOOKED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_BLOCKED: 'USER_BLOCKED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  FILE_INVALID: 'FILE_INVALID',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Admin panelga kirishi mumkin bo'lgan rollar:
 * SUPER_ADMIN, ADMIN, CLINIC_MANAGER
 */
export const ALLOWED_ADMIN_ROLES: RoleType[] = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.CLINIC_MANAGER,
];

