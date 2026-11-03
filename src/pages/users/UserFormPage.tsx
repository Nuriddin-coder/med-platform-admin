import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { usersApi } from '@/api/users';
import type { CreateUserDto, UpdateUserDto, User as UserType } from '@/api/types';
import { Role, UserStatus, RoleType, UserStatusType } from '@/constants/enums';
import { FormField } from '@/components/common/FormField';
import { Select } from '@/components/common/Select';
import { Spinner } from '@/components/common/Spinner';
import { handleFormServerErrors } from '@/utils/formErrors';

const createUserSchema = z
  .object({
    firstName: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
    lastName: z.string().min(2, "Familiya kamida 2 ta belgidan iborat bo'lishi kerak"),
    email: z.string().email("Noto'g'ri email formati").optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    password: z.string().min(8, "Parol kamida 8 ta belgidan iborat bo'lishi kerak"),
    role: z.enum([Role.SUPER_ADMIN, Role.ADMIN, Role.CLINIC_MANAGER, Role.DOCTOR, Role.PATIENT]),
    status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED, UserStatus.PENDING_VERIFICATION]).default(UserStatus.ACTIVE),
  })
  .refine((data) => data.email || data.phone, {
    message: "Email yoki telefon raqamidan kamida bittasi kiritilishi shart",
    path: ['email'],
  });

const updateUserSchema = z
  .object({
    firstName: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
    lastName: z.string().min(2, "Familiya kamida 2 ta belgidan iborat bo'lishi kerak"),
    email: z.string().email("Noto'g'ri email formati").optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    role: z.enum([Role.SUPER_ADMIN, Role.ADMIN, Role.CLINIC_MANAGER, Role.DOCTOR, Role.PATIENT]),
    status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED, UserStatus.PENDING_VERIFICATION]),
  })
  .refine((data) => data.email || data.phone, {
    message: "Email yoki telefon raqamidan kamida bittasi kiritilishi shart",
    path: ['email'],
  });

type UserFormData = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  password?: string;
  role: RoleType;
  status: UserStatusType;
};

const roleOptions = [
  { value: Role.SUPER_ADMIN, label: 'Super Admin', sublabel: "Tizimning to'liq boshqaruvi" },
  { value: Role.ADMIN, label: 'Admin', sublabel: 'Umumiy boshqaruv huquqlari' },
  { value: Role.CLINIC_MANAGER, label: 'Klinika menejeri', sublabel: 'Biriktirilgan klinika boshqaruvi' },
  { value: Role.DOCTOR, label: 'Shifokor', sublabel: 'Tibbiy faoliyat' },
  { value: Role.PATIENT, label: 'Bemor', sublabel: 'Foydalanuvchi mijoz' },
];

const statusOptions = [
  { value: UserStatus.ACTIVE, label: 'Faol (Active)', sublabel: 'Tizimga cheklovlarsiz kira oladi' },
  { value: UserStatus.PENDING_VERIFICATION, label: 'Tasdiqlash kutilmoqda', sublabel: 'Hali tasdiqlanmagan' },
  { value: UserStatus.BLOCKED, label: 'Bloklangan (Blocked)', sublabel: 'Kirish taqiqlangan' },
];

export const UserFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // Query to find user if editing
  const { data: usersData, isLoading: isUserLoading } = useQuery({
    queryKey: ['users-list-for-form'],
    queryFn: () => usersApi.getUsers({ limit: 100 }),
    enabled: isEdit,
  });

  useEffect(() => {
    if (isEdit && usersData?.data) {
      const user = (usersData.data as UserType[]).find((u) => u.id === id);
      if (user) {
        reset({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email || '',
          phone: user.phone || '',
          role: user.role as RoleType,
          status: user.status as UserStatusType,
        });
      }
    }
  }, [isEdit, usersData, id, reset]);

  const createMutation = useMutation({
    mutationFn: async (formData: UserFormData) => {
      const payload: CreateUserDto = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        password: formData.password!,
        role: formData.role,
        status: formData.status,
      };
      return usersApi.createUser(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Foydalanuvchi muvaffaqiyatli yaratildi");
      navigate('/users');
    },
    onError: (err) => {
      handleFormServerErrors(err, setError, "Foydalanuvchi yaratishda xatolik yuz berdi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: UserFormData) => {
      if (!id) throw new Error("ID topilmadi");
      const payload: UpdateUserDto = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        role: formData.role,
        status: formData.status,
      };
      return usersApi.updateUser(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Foydalanuvchi ma'lumotlari yangilandi");
      navigate('/users');
    },
    onError: (err) => {
      handleFormServerErrors(err, setError, "Tahrirlashda xatolik yuz berdi");
    },
  });

  const onSubmit = (data: UserFormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEdit && isUserLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-slate-500">Foydalanuvchi ma'lumotlari yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb & Navigation */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-2 font-medium">
          <Link to="/users" className="hover:text-teal-600 transition">
            Foydalanuvchilar
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-semibold">
            {isEdit ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi"}
          </span>
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition shadow-xs"
            title="Ortga qaytish"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isEdit ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi qo'shish"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit
                ? "Foydalanuvchi shaxsiy rekvizitlari, roli va holatini yangilang"
                : "Tizimga yangi xodim yoki boshqaruvchi hisobini qo'shing"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Card 1: Asosiy ma'lumotlar */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Shaxsiy ma'lumotlar</h3>
              <p className="text-xs text-slate-500">Foydalanuvchining to'liq ismi va aloqa rekvizitlari</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
            <FormField
              label="Ism"
              placeholder="Ali"
              error={errors.firstName?.message}
              required
              {...register('firstName')}
            />
            <FormField
              label="Familiya"
              placeholder="Valiyev"
              error={errors.lastName?.message}
              required
              {...register('lastName')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
            <FormField
              label="Elektron pochta"
              type="email"
              placeholder="ali@med.uz"
              error={errors.email?.message}
              {...register('email')}
            />
            <FormField
              label="Telefon raqami"
              placeholder="+998901234567"
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          {!isEdit && (
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
          )}
        </div>

        {/* Card 2: Rol va holat */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Roli va kirish huquqlari</h3>
              <p className="text-xs text-slate-500">Tizim bo'limlariga kirish ruxsatnomasi va faollik holati</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 items-start">
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select
                  label="Tizimdagi roli"
                  placeholder="Rolni tanlang..."
                  options={roleOptions}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.role?.message}
                  required
                />
              )}
            />

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  label="Foydalanuvchi holati"
                  placeholder="Holatni tanlang..."
                  options={statusOptions}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.status?.message}
                  required
                />
              )}
            />
          </div>
        </div>

        {/* Action Footer */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/users')}
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
            {isEdit ? "O'zgarishlarni saqlash" : "Foydalanuvchini yaratish"}
          </button>
        </div>
      </form>
    </div>
  );
};
