import { api } from './client';
import type {
  Patient,
  UpdatePatientDto,
  PaginationQueryParams,
} from './types';

export const patientsApi = {
  getPatients: async (params?: PaginationQueryParams) => {
    return api.get<Patient[]>('/patients', params as Record<string, unknown>);
  },

  getPatient: async (id: string) => {
    return api.get<Patient>(`/patients/${id}`);
  },

  updatePatient: async (id: string, data: UpdatePatientDto) => {
    return api.patch<Patient, UpdatePatientDto>(`/patients/${id}`, data);
  },
};

