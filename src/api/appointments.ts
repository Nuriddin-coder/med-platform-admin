import { api } from './client';
import type {
  Appointment,
  PaginationQueryParams,
} from './types';
import type { AppointmentStatusType } from '@/constants/enums';

export interface AppointmentsQueryParams extends PaginationQueryParams {
  status?: string;
  doctorId?: string;
  patientId?: string;
  clinicId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const appointmentsApi = {
  getAppointments: async (params?: AppointmentsQueryParams) => {
    return api.get<Appointment[]>('/appointments', params as Record<string, unknown>);
  },

  getAppointment: async (id: string) => {
    return api.get<Appointment>(`/appointments/${id}`);
  },

  updateStatus: async (id: string, status: AppointmentStatusType) => {
    return api.patch<Appointment, { status: string }>(`/appointments/${id}/status`, { status });
  },

  confirmAppointment: async (id: string) => {
    return api.patch<Appointment>(`/appointments/${id}/confirm`);
  },

  rejectAppointment: async (id: string, cancelReason?: string) => {
    return api.patch<Appointment, { cancelReason?: string }>(`/appointments/${id}/reject`, {
      cancelReason,
    });
  },

  cancelAppointment: async (id: string, cancelReason?: string) => {
    return api.patch<Appointment, { cancelReason?: string }>(`/appointments/${id}/cancel`, {
      cancelReason,
    });
  },

  completeAppointment: async (id: string) => {
    return api.patch<Appointment>(`/appointments/${id}/complete`);
  },
};

