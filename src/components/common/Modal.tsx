import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  icon?: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
  icon,
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Premium Backdrop with Smooth Blur */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-md transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Window */}
      <div
        className={cn(
          'relative w-full bg-white rounded-3xl shadow-2xl shadow-slate-900/20 border border-slate-100 ring-1 ring-slate-900/5 z-10 flex flex-col max-h-[90vh] overflow-hidden transform transition-all duration-200 animate-in fade-in-0 zoom-in-95',
          maxWidthClasses[maxWidth],
          className
        )}
      >
        {/* Fixed Header */}
        {(title || description) && (
          <div className="shrink-0 flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-white/95 backdrop-blur-md z-10">
            <div className="flex items-center gap-3.5 pr-4 min-w-0 py-3">
              {icon && (
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-50 to-teal-50 text-brand-600 flex items-center justify-center shrink-0 border border-brand-200/50 shadow-xs">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug truncate">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="mt-0.5 text-xs text-slate-500 leading-normal line-clamp-2">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 transition flex items-center justify-center shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              aria-label="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable Body Content with clean custom scrollbar */}
        <div className="flex-1 overflow-y-auto px-6 py-5 overscroll-contain">
          {children}
        </div>

        {/* Optional Dedicated Footer */}
        {footer && (
          <div className="shrink-0 px-6 py-4 bg-slate-50/80 border-t border-slate-100 backdrop-blur-md rounded-b-3xl flex items-center justify-end gap-3 z-10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
