import React, { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  UserCheck,
  CheckCircle2,
  ChevronRight,
  Activity,
  HeartPulse,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { patientsApi } from '@/api/patients';
import type { UpdatePatientDto } from '@/api/types';
import { Gender, GenderType } from '@/constants/enums';
import { FormField } from '@/components/common/FormField';
import { Select } from '@/components/common/Select';
import { Spinner } from '@/components/common/Spinner';
import { handleFormServerErrors } from '@/utils/formErrors';

const updatePatientSchema = z.object({
  firstName: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  lastName: z.string().min(2, "Familiya kamida 2 ta belgidan iborat bo'lishi kerak"),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email("Noto'g'ri email formati").optional().or(z.literal('')),
  birthDate: z.string().optional().or(z.literal('')),
  gender: z.enum([Gender.MALE, Gender.FEMALE]).optional(),
  bloodType: z.string().optional(),
  address: z.string().optional(),
  allergies: z.string().optional(),
});

type PatientFormData = {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  gender?: GenderType;
  bloodType?: string;
  address?: string;
  allergies?: string;
};

const genderOptions = [
  { value: Gender.MALE, label: 'Erkak (Male)' },
  { value: Gender.FEMALE, label: 'Ayol (Female)' },
];

const bloodTypeOptions = [
  { value: 'A+', label: 'A+ (II musbat)' },
  { value: 'A-', label: 'A- (II manfiy)' },
  { value: 'B+', label: 'B+ (III musbat)' },
  { value: 'B-', label: 'B- (III manfiy)' },
  { value: 'AB+', label: 'AB+ (IV musbat)' },
  { value: 'AB-', label: 'AB- (IV manfiy)' },
  { value: 'O+', label: 'O+ (I musbat)' },
  { value: 'O-', label: 'O- (I manfiy)' },
];

export const PatientFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(updatePatientSchema),
  });

  const { data: patientData, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => (id ? patientsApi.getPatient(id) : null),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (patientData?.data) {
      const p = patientData.data;
      reset({
        firstName: p.firstName,
        lastName: p.lastName,
        phone: p.phone || '',
        email: p.email || '',
        birthDate: p.birthDate ? p.birthDate.split('T')[0] : '',
        gender: (p.gender as GenderType) || undefined,
        bloodType: (p.bloodType as UpdatePatientDto['bloodType']) || undefined,
        address: p.address || '',
        allergies: p.allergies || '',
      });
    }
  }, [patientData, reset]);

  const updateMutation = useMutation({
    mutationFn: async (formData: PatientFormData) => {
      if (!id) throw new Error("ID topilmadi");
      const payload: UpdatePatientDto = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        birthDate: formData.birthDate || undefined,
        gender: formData.gender,
        bloodType: formData.bloodType,
        address: formData.address?.trim() || undefined,
        allergies: formData.allergies?.trim() || undefined,
      };
      return patientsApi.updatePatient(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success("Bemor ma'lumotlari yangilandi");
      navigate('/patients');
    },
    onError: (err) => {
      handleFormServerErrors(err, setError, "Tahrirlashda xatolik yuz berdi");
    },
  });

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-slate-500">Bemor ma'lumotlari yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb & Navigation */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-2 font-medium">
          <Link to="/patients" className="hover:text-teal-600 transition">
            Bemorlar
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-semibold">Bemorni tahrirlash</span>
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition shadow-xs"
            title="Ortga qaytish"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Bemor ma'lumotlarini tahrirlash
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Bemorning shaxsiy ma'lumotlari, tibbiy ko'rsatkichlari va manzilini yangilang
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-6">
        {/* Card 1: Shaxsiy ma'lumotlar */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Shaxsiy va aloqa ma'lumotlari</h3>
              <p className="text-xs text-slate-500">Bemorning to'liq ismi, telefon raqami va manzili</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
            <FormField
              label="Ism"
              placeholder="Bekzod"
              error={errors.firstName?.message}
              required
              {...register('firstName')}
            />
            <FormField
              label="Familiya"
              placeholder="Toshmatov"
              error={errors.lastName?.message}
              required
              {...register('lastName')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
            <FormField
              label="Telefon raqami"
              placeholder="+998901234567"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <FormField
              label="Elektron pochta"
              type="email"
              placeholder="bekzod@gmail.com"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>

          <FormField
            label="Yashash manzili"
            placeholder="Toshkent sh., Chilonzor tumani, 9-mavze, 12-uy"
            error={errors.address?.message}
            {...register('address')}
          />
        </div>

        {/* Card 2: Tibbiy ko'rsatkichlar */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-xs">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Tibbiy ko'rsatkichlar</h3>
              <p className="text-xs text-slate-500">Tug'ilgan sana, jinsi, qon guruhi va allergiyalari</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5 items-start">
            <FormField
              label="Tug'ilgan sana"
              type="date"
              error={errors.birthDate?.message}
              {...register('birthDate')}
            />

            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Select
                  label="Jinsi"
                  placeholder="Jinsni tanlang..."
                  options={genderOptions}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.gender?.message}
                />
              )}
            />

            <Controller
              name="bloodType"
              control={control}
              render={({ field }) => (
                <Select
                  label="Qon guruhi"
                  placeholder="Qon guruhini tanlang..."
                  options={bloodTypeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.bloodType?.message}
                />
              )}
            />
          </div>

          <div className="w-full">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              Allergiyalar va qarshi ko'rsatmalar
            </label>
            <textarea
              rows={2}
              placeholder="Masalan: Penitsillin, chang, sitrus mevalar..."
              className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              {...register('allergies')}
            />
          </div>
        </div>

        {/* Action Footer */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={isSubmitting || updateMutation.isPending}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-teal-700/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
          >
            {(isSubmitting || updateMutation.isPending) && (
              <Spinner size="sm" className="border-t-white" />
            )}
            <CheckCircle2 className="w-4.5 h-4.5" />
            O'zgarishlarni saqlash
          </button>
        </div>
      </form>
    </div>
  );
};
