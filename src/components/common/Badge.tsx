import React from 'react';
import { cn } from '@/utils/cn';
import { Role, AppointmentStatus, UserStatus } from '@/constants/enums';

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'teal';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className,
  dot = false,
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
  };

  const dotStyles: Record<BadgeVariant, string> = {
    default: 'bg-slate-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    purple: 'bg-purple-500',
    teal: 'bg-teal-500',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        variantStyles[variant],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotStyles[variant])} />}
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{
  status?: string | null;
  className?: string;
}> = ({ status, className }) => {
  if (!status) return null;

  switch (status) {
    // Appointment statuses
    case AppointmentStatus.PENDING:
      return (
        <Badge variant="warning" dot className={className}>
          Kutilmoqda
        </Badge>
      );
    case AppointmentStatus.CONFIRMED:
      return (
        <Badge variant="info" dot className={className}>
          Tasdiqlangan
        </Badge>
      );
    case AppointmentStatus.COMPLETED:
      return (
        <Badge variant="success" dot className={className}>
          Yakunlangan
        </Badge>
      );
    case AppointmentStatus.CANCELLED:
      return (
        <Badge variant="danger" dot className={className}>
          Bekor qilingan
        </Badge>
      );
    case AppointmentStatus.REJECTED:
      return (
        <Badge variant="danger" dot className={className}>
          Rad etilgan
        </Badge>
      );

    // User statuses
    case UserStatus.ACTIVE:
      return (
        <Badge variant="success" dot className={className}>
          Faol
        </Badge>
      );
    case UserStatus.BLOCKED:
      return (
        <Badge variant="danger" dot className={className}>
          Bloklangan
        </Badge>
      );
    case UserStatus.PENDING_VERIFICATION:
      return (
        <Badge variant="warning" dot className={className}>
          Tasdiqlash kutilmoqda
        </Badge>
      );

    // Roles
    case Role.SUPER_ADMIN:
      return (
        <Badge variant="purple" className={className}>
          Super Admin
        </Badge>
      );
    case Role.ADMIN:
      return (
        <Badge variant="teal" className={className}>
          Admin
        </Badge>
      );
    case Role.CLINIC_MANAGER:
      return (
        <Badge variant="info" className={className}>
          Klinika Menejeri
        </Badge>
      );
    case Role.DOCTOR:
      return (
        <Badge variant="default" className={className}>
          Shifokor
        </Badge>
      );
    case Role.PATIENT:
      return (
        <Badge variant="default" className={className}>
          Bemor
        </Badge>
      );

    default:
      return <Badge className={className}>{status}</Badge>;
  }
};

