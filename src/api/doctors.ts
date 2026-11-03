import { api } from './client';
import type {
  Doctor,
  CreateDoctorDto,
  UpdateDoctorDto,
  PaginationQueryParams,
} from './types';

export interface DoctorsQueryParams extends PaginationQueryParams {
  specializationId?: string;
  clinicId?: string;
  city?: string;
  serviceId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}

export const doctorsApi = {
  getDoctors: async (params?: DoctorsQueryParams) => {
    return api.get<Doctor[]>('/doctors', params as Record<string, unknown>);
  },

  getDoctor: async (id: string) => {
    return api.get<Doctor>(`/doctors/${id}`);
  },

  createDoctor: async (data: CreateDoctorDto) => {
    return api.post<Doctor, CreateDoctorDto>('/doctors', data);
  },

  updateDoctor: async (id: string, data: UpdateDoctorDto) => {
    return api.patch<Doctor, UpdateDoctorDto>(`/doctors/${id}`, data);
  },

  deleteDoctor: async (id: string) => {
    return api.delete<{ message: string }>(`/doctors/${id}`);
  },

  assignToClinic: async (clinicId: string, doctorId: string) => {
    return api.post<{ message: string }, { doctorId: string }>(`/clinics/${clinicId}/doctors`, {
      doctorId,
    });
  },

  removeFromClinic: async (clinicId: string, doctorId: string) => {
    return api.delete<{ message: string }>(`/clinics/${clinicId}/doctors/${doctorId}`);
  },
};

