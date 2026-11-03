import { api } from './client';
import type {
  Clinic,
  ClinicDetail,
  CreateClinicDto,
  UpdateClinicDto,
  PaginationQueryParams,
} from './types';

export interface ClinicsQueryParams extends PaginationQueryParams {
  city?: string;
  serviceId?: string;
  minRating?: number;
}

export const clinicsApi = {
  getClinics: async (params?: ClinicsQueryParams) => {
    return api.get<Clinic[]>('/clinics', params as Record<string, unknown>);
  },

  getClinic: async (id: string) => {
    return api.get<ClinicDetail>(`/clinics/${id}`);
  },

  createClinic: async (data: CreateClinicDto) => {
    return api.post<Clinic, CreateClinicDto>('/clinics', data);
  },

  updateClinic: async (id: string, data: UpdateClinicDto) => {
    return api.patch<Clinic, UpdateClinicDto>(`/clinics/${id}`, data);
  },

  deleteClinic: async (id: string) => {
    return api.delete<{ message: string }>(`/clinics/${id}`);
  },

  addDoctor: async (clinicId: string, doctorId: string) => {
    return api.post<{ message: string }, { doctorId: string }>(`/clinics/${clinicId}/doctors`, {
      doctorId,
    });
  },

  removeDoctor: async (clinicId: string, doctorId: string) => {
    return api.delete<{ message: string }>(`/clinics/${clinicId}/doctors/${doctorId}`);
  },
};
