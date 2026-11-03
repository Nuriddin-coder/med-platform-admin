import React, { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { specializationsApi } from '@/api/specializations';
import type { CreateSpecializationDto, UpdateSpecializationDto } from '@/api/types';
import { FormField } from '@/components/common/FormField';
import { Spinner } from '@/components/common/Spinner';
import { handleFormServerErrors } from '@/utils/formErrors';

const specializationSchema = z.object({
  name: z.string().min(2, "Mutaxassislik nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  slug: z.string().optional(),
  iconUrl: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type SpecializationFormData = z.infer<typeof specializationSchema>;

export const SpecializationFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SpecializationFormData>({
    resolver: zodResolver(specializationSchema),
    defaultValues: {
      name: '',
      slug: '',
      iconUrl: '',
      description: '',
      isActive: true,
    },
  });

  const { data: specData, isLoading } = useQuery({
    queryKey: ['specialization', id],
    queryFn: () => (id ? specializationsApi.getSpecialization(id) : null),
    enabled: isEdit,
  });

  useEffect(() => {
    if (isEdit && specData?.data) {
      const s = specData.data;
      reset({
        name: s.name,
        slug: s.slug || '',
        iconUrl: s.iconUrl || '',
        description: s.description || '',
        isActive: s.isActive,
      });
    }
  }, [isEdit, specData, reset]);

  const createMutation = useMutation({
    mutationFn: async (formData: SpecializationFormData) => {
      const payload: CreateSpecializationDto = {
        name: formData.name.trim(),
        slug: formData.slug?.trim() || undefined,
        iconUrl: formData.iconUrl?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        isActive: formData.isActive,
      };
      return specializationsApi.createSpecialization(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
      toast.success("Mutaxassislik muvaffaqiyatli yaratildi");
      navigate('/specializations');
    },
    onError: (err) => {
      handleFormServerErrors(err, setError, "Mutaxassislik yaratishda xatolik yuz berdi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: SpecializationFormData) => {
      if (!id) throw new Error("ID topilmadi");
      const payload: UpdateSpecializationDto = {
        name: formData.name.trim(),
        slug: formData.slug?.trim() || undefined,
        iconUrl: formData.iconUrl?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        isActive: formData.isActive,
      };
      return specializationsApi.updateSpecialization(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specializations'] });
      toast.success("Mutaxassislik ma'lumotlari yangilandi");
      navigate('/specializations');
    },
    onError: (err) => {
      handleFormServerErrors(err, setError, "Tahrirlashda xatolik yuz berdi");
    },
  });

  const onSubmit = (data: SpecializationFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-slate-500">Mutaxassislik ma'lumotlari yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb & Navigation */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-2 font-medium">
          <Link to="/specializations" className="hover:text-teal-600 transition">
            Mutaxassisliklar
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-semibold">
            {isEdit ? "Mutaxassislikni tahrirlash" : "Yangi mutaxassislik"}
          </span>
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/specializations')}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition shadow-xs"
            title="Ortga qaytish"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isEdit ? "Mutaxassislikni tahrirlash" : "Yangi mutaxassislik qo'shish"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit
                ? "Mutaxassislik nomi, tavsifi va holatini yangilang"
                : "Shifokorlar biriktiriladigan yangi tibbiy sohani tizimga kiriting"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Soha ma'lumotlari</h3>
              <p className="text-xs text-slate-500">Mutaxassislik nomi, URL identifikatori va tavsifi</p>
            </div>
          </div>

          <FormField
            label="Mutaxassislik nomi"
            placeholder="Masalan: Kardiologiya"
            error={errors.name?.message}
            required
            {...register('name')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
            <FormField
              label="Slug (URL identifikator)"
              placeholder="kardiologiya"
              helperText="Bo'sh qoldirilsa backend avtomatik yaratadi"
              error={errors.slug?.message}
              {...register('slug')}
            />
            <FormField
              label="Ikonka URL manzili"
              placeholder="/icons/cardiology.svg (ixtiyoriy)"
              error={errors.iconUrl?.message}
              {...register('iconUrl')}
            />
          </div>

          <div className="w-full">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              Tavsif va soha haqida ma'lumot
            </label>
            <textarea
              rows={3}
              placeholder="Ushbu tibbiy soha haqida qisqacha ma'lumot..."
              className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              {...register('description')}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isActiveSpec"
              className="w-5 h-5 text-teal-600 border-slate-300 rounded-lg focus:ring-teal-500 cursor-pointer"
              {...register('isActive')}
            />
            <label htmlFor="isActiveSpec" className="text-sm font-semibold text-slate-800 cursor-pointer">
              Faol mutaxassislik sifatida ko'rsatilsin (shifokorlar tanlay oladi)
            </label>
          </div>
        </div>

        {/* Action Footer */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/specializations')}
            className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-teal-700/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
          >
            {(isSubmitting || createMutation.isPending || updateMutation.isPending) && (
              <Spinner size="sm" className="border-t-white" />
            )}
            <CheckCircle2 className="w-4.5 h-4.5" />
            {isEdit ? "O'zgarishlarni saqlash" : "Mutaxassislikni yaratish"}
          </button>
        </div>
      </form>
    </div>
  );
};

