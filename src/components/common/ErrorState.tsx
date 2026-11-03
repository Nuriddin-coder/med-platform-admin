import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Xatolik yuz berdi",
  message = "Ma'lumotlarni yuklashda muammo bo'ldi. Qaytadan urinib ko'ring.",
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center bg-rose-50/50 rounded-xl border border-rose-200',
        className
      )}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 text-rose-600 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600 max-w-md">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition"
        >
          <RotateCcw className="w-4 h-4" />
          Qayta urinish
        </button>
      )}
    </div>
  );
};

