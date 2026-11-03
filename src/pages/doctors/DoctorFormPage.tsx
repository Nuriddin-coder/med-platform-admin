import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Stethoscope,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { doctorsApi } from '@/api/doctors';
import { specializationsApi } from '@/api/specializations';
import { clinicsApi } from '@/api/clinics';
import type { CreateDoctorDto, UpdateDoctorDto } from '@/api/types';
import { FormField } from '@/components/common/FormField';
import { Select } from '@/components/common/Select';
import { FileUpload } from '@/components/common/FileUpload';
import { Spinner } from '@/components/common/Spinner';
import { handleFormServerErrors } from '@/utils/formErrors';

const createDoctorSchema = z.object({
  firstName: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  lastName: z.string().min(2, "Familiya kamida 2 ta belgidan iborat bo'lishi kerak"),
  email: z.string().email("Noto'g'ri email formati"),
  phone: z.string().optional(),
  password: z.string().min(8, "Parol kamida 8 ta belgidan iborat bo'lishi kerak"),
  specializationId: z.string().min(1, "Mutaxassislik tanlanishi shart"),
  experienceYears: z.coerce.number().min(0, "Manfiy bo'lishi mumkin emas"),
  consultationPrice: z.coerce.number().min(0, "Manfiy bo'lishi mumkin emas"),
  bio: z.string().optional(),
  education: z.string().optional(),
  avatarUrl: z.string().optional(),
  clinicIds: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

const updateDoctorSchema = z.object({
  firstName: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  lastName: z.string().min(2, "Familiya kamida 2 ta belgidan iborat bo'lishi kerak"),
  specializationId: z.string().min(1, "Mutaxassislik tanlanishi shart"),
  experienceYears: z.coerce.number().min(0, "Manfiy bo'lishi mumkin emas"),
  consultationPrice: z.coerce.number().min(0, "Manfiy bo'lishi mumkin emas"),
  bio: z.string().optional(),
  education: z.string().optional(),
  avatarUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

type DoctorFormData = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  password?: string;
  specializationId: string;
  experienceYears: number;
  consultationPrice: number;
  bio?: string;
  education?: string;
  avatarUrl?: string;
  clinicIds?: string[];
  isActive: boolean;
};

export const DoctorFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showPassword, setShowPassword] = useState(false);
  const [avatarUrlState, setAvatarUrlState] = useState('');

  // Fetch specializations
  const { data: specData } = useQuery({
    queryKey: ['specializations-options'],
    queryFn: () => specializationsApi.getSpecializations({ limit: 100 }),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch clinics
  const { data: clinicsData } = useQuery({
    queryKey: ['clinics-options'],
    queryFn: () => clinicsApi.getClinics({ limit: 100 }),
    staleTime: 1000 * 60 * 5,
  });

  const specializationOptions = (specData?.data || []).map((s) => ({
    value: s.id,
    label: s.name,
    sublabel: s.description || undefined,
  }));

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
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DoctorFormData>({
    resolver: zodResolver(isEdit ? updateDoctorSchema : createDoctorSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      specializationId: '',
      experienceYears: 1,
      consultationPrice: 150000,
      bio: '',
      education: '',
      clinicIds: [],
      isActive: true,
    },
  });

  // Fetch doctor data if edit
  const { data: doctorData, isLoading: isDoctorLoading } = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => (id ? doctorsApi.getDoctor(id) : null),
    enabled: isEdit,
  });

  useEffect(() => {
    if (isEdit && doctorData?.data) {
      const d = doctorData.data;
      setAvatarUrlState(d.avatarUrl || '');
      reset({
        firstName: d.firstName,
        lastName: d.lastName,
        specializationId: d.specializationId || d.specialization?.id || '',
        experienceYears: d.experienceYears || 0,
        consultationPrice: d.consultationPrice || 150000,
        bio: d.bio || '',
        education: d.education || '',
        avatarUrl: d.avatarUrl || '',
        isActive: d.isActive,
      });
    }
  }, [isEdit, doctorData, reset]);

  const createMutation = useMutation({
    mutationFn: async (formData: DoctorFormData) => {
      const payload: CreateDoctorDto = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email!.trim(),
        phone: formData.phone?.trim() || undefined,
        password: formData.password!,
        specializationId: formData.specializationId,
        experienceYears: Number(formData.experienceYears),
        consultationPrice: Number(formData.consultationPrice),
        bio: formData.bio?.trim() || undefined,
        education: formData.education?.trim() || undefined,
        clinicIds: formData.clinicIds || [],
      };
      const res = await doctorsApi.createDoctor(payload);
      if (res?.data?.id && avatarUrlState) {
        await doctorsApi.updateDoctor(res.data.id, { avatarUrl: avatarUrlState });
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast.success("Shifokor muvaffaqiyatli yaratildi");
      navigate('/doctors');
    },
    onError: (err) => {
      handleFormServerErrors(err, setError, "Shifokor yaratishda xatolik yuz berdi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: DoctorFormData) => {
      if (!id) throw new Error("ID topilmadi");
      const payload: UpdateDoctorDto = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        specializationId: formData.specializationId,
        experienceYears: Number(formData.experienceYears),
        consultationPrice: Number(formData.consultationPrice),
        bio: formData.bio?.trim() || undefined,
        education: formData.education?.trim() || undefined,
        avatarUrl: avatarUrlState || undefined,
        isActive: formData.isActive,
      };
      return doctorsApi.updateDoctor(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast.success("Shifokor ma'lumotlari yangilandi");
      navigate('/doctors');
    },
    onError: (err) => {
      handleFormServerErrors(err, setError, "Tahrirlashda xatolik yuz berdi");
    },
  });

  const onSubmit = (data: DoctorFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const selectedClinicIds = watch('clinicIds') || [];

  const toggleClinic = (clinicId: string) => {
    const current = [...selectedClinicIds];
    const index = current.indexOf(clinicId);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(clinicId);
    }
    setValue('clinicIds', current);
  };

  if (isEdit && isDoctorLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-slate-500">Shifokor ma'lumotlari yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb & Navigation */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-2 font-medium">
          <Link to="/doctors" className="hover:text-teal-600 transition">
            Shifokorlar
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-semibold">
            {isEdit ? "Shifokorni tahrirlash" : "Yangi shifokor"}
          </span>
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/doctors')}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition shadow-xs"
            title="Ortga qaytish"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isEdit ? "Shifokor ma'lumotlarini tahrirlash" : "Yangi shifokor qo'shish"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit
                ? "Shifokor profili, mutaxassisligi va konsultatsiya narxini yangilang"
                : "Tizimga yangi shifokor profili va hisob ma'lumotlarini kiriting"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Card 1: Profil va fotosurat */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Shaxsiy va aloqa ma'lumotlari</h3>
              <p className="text-xs text-slate-500">Shifokor ismi, fotosurati va tizimga kirish rekvizitlari</p>
            </div>
          </div>

          <FileUpload
            label="Shifokor fotosurati"
            value={avatarUrlState}
            onChange={(url) => {
              setAvatarUrlState(url);
              setValue('avatarUrl', url);
            }}
            folder="avatar"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
            <FormField
              label="Ism"
              placeholder="Anvar"
              error={errors.firstName?.message}
              required
              {...register('firstName')}
            />
            <FormField
              label="Familiya"
              placeholder="Karimov"
              error={errors.lastName?.message}
              required
              {...register('lastName')}
            />
          </div>

          {!isEdit && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
                <FormField
                  label="Elektron pochta (Login)"
                  type="email"
                  placeholder="anvar.karimov@med.uz"
                  error={errors.email?.message}
                  required
                  {...register('email')}
                />
                <FormField
                  label="Telefon raqami"
                  placeholder="+998901234567"
                  error={errors.phone?.message}
                  {...register('phone')}
                />
              </div>

              <FormField
                label="Maxfiy parol"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password?.message}
                required
                {...register('password')}
              />
            </>
          )}
        </div>

        {/* Card 2: Mutaxassislik va qabul shartlari */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Kasbiy faoliyat va konsultatsiya</h3>
              <p className="text-xs text-slate-500">Tibbiy soha, ish tajribasi va xizmat narxi</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5 items-start">
            <Controller
              name="specializationId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Mutaxassislik"
                  placeholder="Mutaxassislikni tanlang..."
                  options={specializationOptions}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.specializationId?.message}
                  required
                />
              )}
            />

            <FormField
              label="Tajriba (yil)"
              type="number"
              placeholder="5"
              error={errors.experienceYears?.message}
              required
              {...register('experienceYears')}
            />

            <FormField
              label="Konsultatsiya narxi (so'm)"
              type="number"
              placeholder="150000"
              error={errors.consultationPrice?.message}
              required
              {...register('consultationPrice')}
            />
          </div>

          <FormField
            label="Ta'limi va ilmiy darajasi"
            placeholder="Toshkent Tibbiyot Akademiyasi, Kardiologiya kafedrasi"
            error={errors.education?.message}
            {...register('education')}
          />

          <div className="w-full">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              Shifokor haqida qisqacha ma'lumot (Bio)
            </label>
            <textarea
              rows={3}
              placeholder="Shifokorning tibbiy faoliyati, sertifikatlari va tajribasi..."
              className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              {...register('bio')}
            />
          </div>
        </div>

        {/* Card 3: Biriktiriladigan klinikalar (Faqat yangi yaratishda) */}
        {!isEdit && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Faoliyat yuritadigan klinikalar</h3>
            <p className="text-xs text-slate-500">
              Shifokor faoliyat ko'rsatadigan tibbiyot markazlarini tanlang (ixtiyoriy, keyinroq ham biriktirish mumkin)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
              {clinicOptions.map((c) => {
                const isChecked = selectedClinicIds.includes(String(c.value));
                return (
                  <button
                    key={String(c.value)}
                    type="button"
                    onClick={() => toggleClinic(String(c.value))}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                      isChecked
                        ? 'border-teal-500 bg-teal-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="w-4 h-4 mt-0.5 rounded text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{c.label}</p>
                      {c.sublabel && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{c.sublabel}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Card 4: Faollik holati va saqlash */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActiveDoctor"
              className="w-5 h-5 text-teal-600 border-slate-300 rounded-lg focus:ring-teal-500 cursor-pointer"
              {...register('isActive')}
            />
            <label htmlFor="isActiveDoctor" className="text-sm font-semibold text-slate-800 cursor-pointer">
              Shifokor faol holatda saqlansin (bemorlar qabulga yozilishi mumkin)
            </label>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate('/doctors')}
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
              {isEdit ? "O'zgarishlarni saqlash" : "Shifokorni yaratish"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
