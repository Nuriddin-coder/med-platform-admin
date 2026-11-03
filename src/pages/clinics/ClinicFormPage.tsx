import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Building2,
  Clock,
  Sparkles,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { clinicsApi } from '@/api/clinics';
import type { CreateClinicDto, UpdateClinicDto } from '@/api/types';
import { FormField } from '@/components/common/FormField';
import { FileUpload } from '@/components/common/FileUpload';
import { Spinner } from '@/components/common/Spinner';
import { handleFormServerErrors } from '@/utils/formErrors';
import { formatDayOfWeek } from '@/utils/formatters';

const workingHourItemSchema = z.object({
  dayOfWeek: z.number().min(1).max(7),
  openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format: HH:mm bo'lishi kerak"),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format: HH:mm bo'lishi kerak"),
  isClosed: z.boolean(),
});

const clinicSchema = z.object({
  name: z.string().min(2, "Klinika nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  address: z.string().min(3, "Manzil kamida 3 ta belgidan iborat bo'lishi kerak"),
  city: z.string().min(2, "Shahar kiritilishi shart"),
  phone: z.string().min(7, "Telefon raqami kamida 7 ta belgidan iborat bo'lishi kerak"),
  email: z.string().email("Noto'g'ri email").optional().or(z.literal('')),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  workingHours: z.array(workingHourItemSchema).optional(),
  isActive: z.boolean().default(true),
});

type ClinicFormData = z.infer<typeof clinicSchema>;

const defaultWorkingHours = [
  { dayOfWeek: 1, openTime: '08:00', closeTime: '18:00', isClosed: false },
  { dayOfWeek: 2, openTime: '08:00', closeTime: '18:00', isClosed: false },
  { dayOfWeek: 3, openTime: '08:00', closeTime: '18:00', isClosed: false },
  { dayOfWeek: 4, openTime: '08:00', closeTime: '18:00', isClosed: false },
  { dayOfWeek: 5, openTime: '08:00', closeTime: '18:00', isClosed: false },
  { dayOfWeek: 6, openTime: '09:00', closeTime: '15:00', isClosed: false },
  { dayOfWeek: 7, openTime: '08:00', closeTime: '18:00', isClosed: true },
];

export const ClinicFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [logoUrlState, setLogoUrlState] = useState<string>('');

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClinicFormData>({
    resolver: zodResolver(clinicSchema),
    defaultValues: {
      name: '',
      address: '',
      city: 'Toshkent',
      phone: '',
      email: '',
      description: '',
      logoUrl: '',
      imageUrls: [],
      workingHours: defaultWorkingHours,
      isActive: true,
    },
  });

  const { fields } = useFieldArray({
    control,
    name: 'workingHours',
  });

  // Fetch clinic if in edit mode
  const { data: clinicData, isLoading: isClinicLoading } = useQuery({
    queryKey: ['clinic', id],
    queryFn: () => (id ? clinicsApi.getClinic(id) : null),
    enabled: isEdit,
  });

  useEffect(() => {
    if (isEdit && clinicData?.data) {
      const c = clinicData.data;
      setLogoUrlState(c.logoUrl || '');
      reset({
        name: c.name,
        address: c.address,
        city: c.city,
        phone: c.phone,
        email: c.email || '',
        description: c.description || '',
        logoUrl: c.logoUrl || '',
        imageUrls: c.imageUrls || [],
        workingHours: c.workingHours && c.workingHours.length > 0 ? c.workingHours : defaultWorkingHours,
        isActive: c.isActive,
      });
    }
  }, [isEdit, clinicData, reset]);

  const applyStandardHours = () => {
    for (let i = 0; i < 5; i++) {
      setValue(`workingHours.${i}.openTime`, '08:00');
      setValue(`workingHours.${i}.closeTime`, '18:00');
      setValue(`workingHours.${i}.isClosed`, false);
    }
    setValue('workingHours.5.openTime', '09:00');
    setValue('workingHours.5.closeTime', '15:00');
    setValue('workingHours.5.isClosed', false);
    setValue('workingHours.6.isClosed', true);
    toast.success("Standart ish vaqti (Du-Ju: 08:00-18:00, Sha: 09:00-15:00, Ya: Dam) o'rnatildi");
  };

  const createMutation = useMutation({
    mutationFn: async (formData: ClinicFormData) => {
      const payload: CreateClinicDto = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        logoUrl: logoUrlState || undefined,
        imageUrls: formData.imageUrls || [],
        workingHours: formData.workingHours || defaultWorkingHours,
        isActive: formData.isActive,
      };
      return clinicsApi.createClinic(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
      toast.success("Klinika muvaffaqiyatli yaratildi");
      navigate('/clinics');
    },
    onError: (err) => {
      handleFormServerErrors(err, setError, "Klinika yaratishda xatolik yuz berdi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: ClinicFormData) => {
      if (!id) throw new Error("ID topilmadi");
      const payload: UpdateClinicDto = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        logoUrl: logoUrlState || undefined,
        imageUrls: formData.imageUrls || [],
        workingHours: formData.workingHours || defaultWorkingHours,
        isActive: formData.isActive,
      };
      return clinicsApi.updateClinic(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
      toast.success("Klinika ma'lumotlari yangilandi");
      navigate('/clinics');
    },
    onError: (err) => {
      handleFormServerErrors(err, setError, "Tahrirlashda xatolik yuz berdi");
    },
  });

  const onSubmit = (data: ClinicFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEdit && isClinicLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-slate-500">Klinika ma'lumotlari yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-2 font-medium">
            <Link to="/clinics" className="hover:text-teal-600 transition">
              Klinikalar
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-800 font-semibold">
              {isEdit ? "Klinikani tahrirlash" : "Yangi klinika"}
            </span>
          </nav>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/clinics')}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition shadow-xs"
              title="Ortga qaytish"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {isEdit ? "Klinika ma'lumotlarini tahrirlash" : "Yangi klinika qo'shish"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEdit
                  ? "Klinika profili, logotipi va haftalik qabul jadvalini yangilang"
                  : "Platformaga yangi tibbiyot markazi qo'shish va uning ish tartibini belgilash"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Card 1: Asosiy ma'lumotlar */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Asosiy ma'lumotlar</h3>
              <p className="text-xs text-slate-500">Klinika nomi, manzili va aloqa vositalari</p>
            </div>
          </div>

          <FileUpload
            label="Klinika logotipi"
            value={logoUrlState}
            onChange={(url) => {
              setLogoUrlState(url);
              setValue('logoUrl', url);
            }}
            folder="clinic-logo"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
            <FormField
              label="Klinika nomi"
              placeholder="Masalan: Shox Med Center"
              error={errors.name?.message}
              required
              {...register('name')}
            />
            <FormField
              label="Shahar"
              placeholder="Toshkent"
              error={errors.city?.message}
              required
              {...register('city')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
            <FormField
              label="Manzil"
              placeholder="Mirobod t., Oybek ko'chasi, 12"
              error={errors.address?.message}
              required
              {...register('address')}
            />
            <FormField
              label="Telefon raqami"
              placeholder="+998712001122"
              error={errors.phone?.message}
              required
              {...register('phone')}
            />
          </div>

          <FormField
            label="Elektron pochta"
            type="email"
            placeholder="info@shoxmed.uz"
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="w-full">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Klinika haqida batafsil ma'lumot
            </label>
            <textarea
              rows={3}
              placeholder="Zamonaviy ko'p tarmoqli tibbiyot markazi..."
              className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              {...register('description')}
            />
          </div>
        </div>

        {/* Card 2: 7 kunlik ish tartibi (Contract 55) - Spacious Full Page */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Haftalik ish tartibi (Contract 55)</h3>
                <p className="text-xs text-slate-500">
                  Klinikaning har bir kun bo'yicha ochilish, yopilish yoki dam olish holati
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={applyStandardHours}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200/60 rounded-xl transition shadow-xs self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              Standart soatlar (08:00 - 18:00)
            </button>
          </div>

          {/* 7 Days Grid with Plenty of Room so "Dam olish" never wraps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {fields.map((item, index) => {
              const isClosed = watch(`workingHours.${index}.isClosed`);
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${
                    isClosed
                      ? 'bg-slate-50/70 border-slate-200 text-slate-400'
                      : 'bg-white border-slate-200 shadow-xs text-slate-700'
                  }`}
                >
                  <div className="w-28 shrink-0">
                    <span className="text-sm font-bold text-slate-900 block">
                      {formatDayOfWeek(index + 1)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {isClosed ? 'Dam olish kuni' : 'Qabul vaqti'}
                    </span>
                  </div>

                  {!isClosed ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
                        {...register(`workingHours.${index}.openTime` as const)}
                      />
                      <span className="text-slate-400 font-bold">—</span>
                      <input
                        type="time"
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white"
                        {...register(`workingHours.${index}.closeTime` as const)}
                      />
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-xl">
                      Dam olish kuni
                    </span>
                  )}

                  {/* Clean Non-wrapping Checkbox Pill */}
                  <label
                    htmlFor={`isClosed_${index}`}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100/80 transition cursor-pointer select-none text-xs font-semibold text-slate-600 shrink-0 ml-2"
                  >
                    <input
                      type="checkbox"
                      id={`isClosed_${index}`}
                      className="w-4 h-4 rounded text-rose-600 border-slate-300 focus:ring-rose-500 cursor-pointer"
                      {...register(`workingHours.${index}.isClosed` as const)}
                    />
                    <span className="whitespace-nowrap">Dam olish</span>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: Faollik holati & Actions */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActiveClinic"
              className="w-5 h-5 text-teal-600 border-slate-300 rounded-lg focus:ring-teal-500 cursor-pointer"
              {...register('isActive')}
            />
            <label htmlFor="isActiveClinic" className="text-sm font-semibold text-slate-800 cursor-pointer">
              Klinika tizimda faol holatda saqlansin (bemorlar izlay oladi)
            </label>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate('/clinics')}
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
              {isEdit ? "O'zgarishlarni saqlash" : "Klinikani yaratish"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
