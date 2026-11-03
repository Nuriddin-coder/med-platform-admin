import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Lock, User as UserIcon, Eye, EyeOff, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

import { apiClient, extractErrorMessage } from '@/api/client';
import type { ApiSuccessResponse, AuthResponseData } from '@/api/types';
import { authStore } from '@/store/authStore';
import { ALLOWED_ADMIN_ROLES, RoleType } from '@/constants/enums';
import { FormField } from '@/components/common/FormField';
import { Spinner } from '@/components/common/Spinner';

const loginSchema = z.object({
  login: z.string().min(1, 'Email yoki telefon raqamini kiriting'),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      login: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      const res = await apiClient.post<ApiSuccessResponse<AuthResponseData>>(
        '/auth/login',
        {
          login: data.login.trim(),
          password: data.password,
        }
      );

      if (res.data?.success && res.data.data) {
        const authData = res.data.data;
        const userRole = authData.user.role as RoleType;

        // Check role permission for admin portal
        if (!ALLOWED_ADMIN_ROLES.includes(userRole)) {
          toast.error(
            "Kirish taqiqlangan! Bu panel faqat ma'muriyat (SUPER_ADMIN, ADMIN, CLINIC_MANAGER) uchun mo'ljallangan."
          );
          return;
        }

        // Store tokens and user
        authStore.setAuth(authData);
        toast.success(`Xush kelibsiz, ${authData.user.firstName}!`);
        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, "Login yoki parol noto'g'ri");
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/20 to-sky-50/40 p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 text-white shadow-lg shadow-brand-500/25 mb-4">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            MedPlatform Admin
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Tibbiy platformani boshqarish tizimiga kirish
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              label="Login (Email yoki telefon)"
              placeholder="admin@med.uz yoki +998901234567"
              leftIcon={<UserIcon className="w-4 h-4" />}
              error={errors.login?.message}
              required
              {...register('login')}
            />

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
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
              error={errors.password?.message}
              required
              {...register('password')}
            />

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 shadow-md shadow-brand-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                {isLoading ? (
                  <Spinner size="sm" className="border-t-white" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                Tizimga kirish
              </button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Xavfsiz ulanish: Kirish huquqi faqat Super Admin, Admin va Klinika Menejerlariga berilgan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
