import React, { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Layers,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { servicesApi } from '@/api/services';
import { clinicsApi } from '@/api/clinics';
import type { CreateServiceDto, UpdateServiceDto } from '@/api/types';
import { FormField } from '@/components/common/FormField';
import { Select } from '@/components/common/Select';
import { Spinner } from '@/components/common/Spinner';
import { handleFormServerErrors } from '@/utils/formErrors';

const serviceSchema = z.object({
  name: z.string().min(2, "Xizmat nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  clinicId: z.string().min(1, "Klinika tanlanishi shart"),
  price: z.coerce.number().min(0, "Narx manfiy bo'lishi mumkin emas"),
  durationMinutes: z.coerce.number().min(5, "Davomiyligi kamida 5 daqiqa bo'lishi kerak"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export const ServiceFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch clinics
  const { data: clinicsData } = useQuery({
    queryKey: ['clinics-options-for-service'],
    queryFn: () => clinicsApi.getClinics({ limit: 100 }),
    staleTime: 1000 * 60 * 5,
  });

  const clinicOptions = (clinicsData?.data || []).map((c) => ({
    value: c.id,
    label: c.name,
    sublabel: `${c.city}, ${c.address}`,
  }));

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      clinicId: '',
      price: 150000,
      durationMinutes: 30,
      description: '',
      isActive: true,
    },
  });

  const { data: serviceData, isLoading } = useQuery({
    queryKey: ['service', id],
    queryFn: () => (id ? servicesApi.getService(id) : null),
    enabled: isEdit,
  });

  useEffect(() => {
    if (isEdit && serviceData?.data) {
      const s = serviceData.data;
      reset({
        name: s.name,
        clinicId: s.clinicId,
        price: s.price,
        durationMinutes: s.durationMinutes,
        description: s.description || '',
        isActive: s.isActive,
      });
    }
  }, [isEdit, serviceData, reset]);

  const createMutation = useMutation({
    mutationFn: async (formData: ServiceFormData) => {
      const payload: CreateServiceDto = {
        name: formData.name.trim(),
        clinicId: formData.clinicId,
        price: Number(formData.price),
        durationMinutes: Number(formData.durationMinutes),
        description: formData.description?.trim() || undefined,
        isActive: formData.isActive,
      };
      return servicesApi.createService(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success("Xizmat muvaffaqiyatli yaratildi");
      navigate('/services');
    },
    onError: (err) => {
      handleFormServerErrors(err, setError, "Xizmat yaratishda xatolik yuz berdi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: ServiceFormData) => {
      if (!id) throw new Error("ID topilmadi");
      const payload: UpdateServiceDto = {
        name: formData.name.trim(),
        clinicId: formData.clinicId,
        price: Number(formData.price),
        durationMinutes: Number(formData.durationMinutes),
        description: formData.description?.trim() || undefined,
        isActive: formData.isActive,
      };
      return servicesApi.updateService(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success("Xizmat ma'lumotlari yangilandi");
      navigate('/services');
    },
    onError: (err) => {
      handleFormServerErrors(err, setError, "Tahrirlashda xatolik yuz berdi");
    },
  });

  const onSubmit = (data: ServiceFormData) => {
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
        <p className="text-sm font-medium text-slate-500">Xizmat ma'lumotlari yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb & Navigation */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-2 font-medium">
          <Link to="/services" className="hover:text-teal-600 transition">
            Xizmatlar
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-semibold">
            {isEdit ? "Xizmatni tahrirlash" : "Yangi xizmat"}
          </span>
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/services')}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition shadow-xs"
            title="Ortga qaytish"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isEdit ? "Xizmat ma'lumotlarini tahrirlash" : "Yangi xizmat qo'shish"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit
                ? "Tibbiy xizmat narxi, muddati va klinikasini yangilang"
                : "Klinika uchun yangi tibbiy xizmat va uning narxini belgilang"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Xizmat parametrlari</h3>
              <p className="text-xs text-slate-500">Xizmat nomi, biriktirilgan klinika, narx va davomiylik</p>
            </div>
          </div>

          <FormField
            label="Xizmat nomi"
            placeholder="Masalan: Birlamchi konsultatsiya"
            error={errors.name?.message}
            required
            {...register('name')}
          />

          <Controller
            name="clinicId"
            control={control}
            render={({ field }) => (
              <Select
                label="Klinika"
                placeholder="Klinikani tanlang..."
                options={clinicOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.clinicId?.message}
                required
              />
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
            <FormField
              label="Narxi (so'mda)"
              type="number"
              placeholder="150000"
              leftIcon={<DollarSign className="w-4 h-4" />}
              error={errors.price?.message}
              required
              {...register('price')}
            />
            <FormField
              label="Davomiyligi (daqiqa)"
              type="number"
              placeholder="30"
              leftIcon={<Clock className="w-4 h-4" />}
              error={errors.durationMinutes?.message}
              required
              {...register('durationMinutes')}
            />
          </div>

          <div className="w-full">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Tavsif va shartlar
            </label>
            <textarea
              rows={3}
              placeholder="Xizmat tafsilotlari, qabul shartlari va tavsifi..."
              className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              {...register('description')}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isActiveService"
              className="w-5 h-5 text-teal-600 border-slate-300 rounded-lg focus:ring-teal-500 cursor-pointer"
              {...register('isActive')}
            />
            <label htmlFor="isActiveService" className="text-sm font-semibold text-slate-800 cursor-pointer">
              Faol xizmat sifatida ko'rsatilsin (bemorlar tanlay oladi)
            </label>
          </div>
        </div>

        {/* Action Footer */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/services')}
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
            {isEdit ? "O'zgarishlarni saqlash" : "Xizmatni yaratish"}
          </button>
        </div>
      </form>
    </div>
  );
};

