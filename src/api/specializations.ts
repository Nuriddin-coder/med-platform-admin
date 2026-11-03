import { api } from './client';
import type {
  Specialization,
  CreateSpecializationDto,
  UpdateSpecializationDto,
  PaginationQueryParams,
} from './types';

export interface SpecializationsQueryParams extends PaginationQueryParams {
  isActive?: boolean;
}

export const specializationsApi = {
  getSpecializations: async (params?: SpecializationsQueryParams) => {
    return api.get<Specialization[]>('/specializations', params as Record<string, unknown>);
  },

  getSpecialization: async (id: string) => {
    return api.get<Specialization>(`/specializations/${id}`);
  },

  createSpecialization: async (data: CreateSpecializationDto) => {
    return api.post<Specialization, CreateSpecializationDto>('/specializations', data);
  },

  updateSpecialization: async (id: string, data: UpdateSpecializationDto) => {
    return api.patch<Specialization, UpdateSpecializationDto>(`/specializations/${id}`, data);
  },

  deleteSpecialization: async (id: string) => {
    return api.delete<{ message: string }>(`/specializations/${id}`);
  },
};

