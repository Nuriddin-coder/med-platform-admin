import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Spinner } from './Spinner';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Tasdiqlash',
  cancelText = 'Bekor qilish',
  variant = 'danger',
  isLoading = false,
}) => {
  const confirmButtonClasses = {
    danger:
      'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white shadow-sm shadow-rose-600/20 focus:ring-rose-500/30',
    warning:
      'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-sm shadow-amber-600/20 focus:ring-amber-500/30',
    primary:
      'bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white shadow-sm shadow-brand-600/20 focus:ring-brand-500/30',
  };

  const iconStyles = {
    danger: 'bg-rose-50 text-rose-600 border-rose-200/80',
    warning: 'bg-amber-50 text-amber-600 border-amber-200/80',
    primary: 'bg-brand-50 text-brand-600 border-brand-200/80',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="flex flex-col items-center text-center py-2">
        <div
          className={`flex items-center justify-center w-14 h-14 rounded-2xl border shadow-xs mb-4 ${iconStyles[variant]}`}
        >
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
        <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs">{message}</p>

        <div className="mt-6 flex items-center justify-center gap-3 w-full">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 ${confirmButtonClasses[variant]}`}
          >
            {isLoading && <Spinner size="sm" className="border-t-white" />}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

