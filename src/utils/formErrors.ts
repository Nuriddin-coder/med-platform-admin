import axios from 'axios';
import { UseFormSetError, FieldValues, Path } from 'react-hook-form';
import type { ApiErrorResponse } from '@/api/types';
import toast from 'react-hot-toast';

/**
 * Maps backend error.details[].field to react-hook-form fields
 * Contract 2: { "success": false, "error": { "code": "...", "message": "...", "details": [{ "field": "email", "message": "..." }] } }
 */
export function handleFormServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fallbackMessage = "Ma'lumotlarni saqlashda xatolik yuz berdi"
): string {
  if (axios.isAxiosError(error)) {
    const errorResponse = error.response?.data as ApiErrorResponse | undefined;
    const payload = errorResponse?.error;

    if (payload?.details && Array.isArray(payload.details) && payload.details.length > 0) {
      let fieldMatched = false;
      payload.details.forEach((item) => {
        if (item.field) {
          setError(item.field as Path<T>, {
            type: 'server',
            message: item.message,
          });
          fieldMatched = true;
        }
      });

      if (!fieldMatched && payload.message) {
        toast.error(payload.message);
      }
      return payload.message || fallbackMessage;
    }

    if (payload?.message) {
      toast.error(payload.message);
      return payload.message;
    }
  }

  if (error instanceof Error) {
    toast.error(error.message);
    return error.message;
  }

  toast.error(fallbackMessage);
  return fallbackMessage;
}

