import type { components, paths } from './schema';

export type Schemas = components['schemas'];
export type Paths = paths;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorPayload;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Schemas DTO shortcut exports
export type User = Schemas['UserResponseDto'];
export type CreateUserDto = Schemas['CreateUserDto'];
export type UpdateUserDto = Schemas['UpdateUserDto'];

export type AuthResponseData = Schemas['AuthResponseDto'];
export type LoginDto = Schemas['LoginDto'];
export type RefreshTokenDto = Schemas['RefreshTokenDto'];

export type AdminStats = Schemas['AdminStatsResponseDto'];
export type AppointmentsChartPoint = Schemas['AppointmentsChartPointDto'];
export type AdminLog = Schemas['AdminLogResponseDto'];

export type Clinic = Schemas['ClinicResponseDto'];
export type ClinicDetail = Schemas['ClinicDetailResponseDto'];
export type CreateClinicDto = Schemas['CreateClinicDto'];
export type UpdateClinicDto = Schemas['UpdateClinicDto'];
export type ClinicWorkingHourItem = Schemas['ClinicWorkingHourItemDto'];

export type Doctor = Schemas['DoctorResponseDto'];
export type CreateDoctorDto = Schemas['CreateDoctorDto'];
export type UpdateDoctorDto = Schemas['UpdateDoctorDto'];

export type Patient = Schemas['PatientResponseDto'];
export type UpdatePatientDto = Schemas['UpdatePatientDto'];

export type Appointment = Schemas['AppointmentResponseDto'];
export type UpdateAppointmentStatusDto = Schemas['UpdateAppointmentStatusDto'];

export type Specialization = Schemas['SpecializationResponseDto'];
export type CreateSpecializationDto = Schemas['CreateSpecializationDto'];
export type UpdateSpecializationDto = Schemas['UpdateSpecializationDto'];

export type Service = Schemas['ServiceResponseDto'];
export type CreateServiceDto = Schemas['CreateServiceDto'];
export type UpdateServiceDto = Schemas['UpdateServiceDto'];

export type Notification = Schemas['NotificationResponseDto'];
export type UnreadCount = Schemas['UnreadCountResponseDto'];
export type PlatformSettings = Schemas['PlatformSettingsResponseDto'];
export type UpdatePlatformSettingsDto = Schemas['UpdatePlatformSettingsDto'];
export type PermissionsResponse = Schemas['PermissionsResponseDto'];
export type UpdateUserPermissionsDto = Schemas['UpdateUserPermissionsDto'];
export type UserPermissionItem = Schemas['UserPermissionItemDto'];
export type AdminLogAdminBrief = Schemas['AdminLogAdminBriefDto'];
export type UploadedImage = Schemas['UploadedImageResponseDto'];

// Query params for lists
export interface PaginationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdminLogsQueryParams extends PaginationQueryParams {
  action?: string;
  entity?: string;
  adminId?: string;
}
