import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface PaginationProps {
  currentPage: number;
  totalPages?: number;
  total?: number;
  limit?: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages: propTotalPages,
  total,
  limit = 10,
  onPageChange,
  isLoading = false,
  className,
}) => {
  // Calculate total pages if not explicitly provided
  const computedTotalPages =
    propTotalPages !== undefined
      ? propTotalPages
      : total !== undefined && limit > 0
      ? Math.max(1, Math.ceil(total / limit))
      : 1;

  const totalPages = Math.max(1, computedTotalPages);

  // Generate page items according to required logic (1 2 3 ... 13 14)
  const items: (number | '...')[] = [];
  if (totalPages <= 6) {
    for (let i = 1; i <= totalPages; i++) {
      items.push(i);
    }
  } else {
    if (currentPage <= 3) {
      // Near start: 1, 2, 3, 4, ..., totalPages - 1, totalPages
      items.push(1, 2, 3, 4, '...', totalPages - 1, totalPages);
    } else if (currentPage >= totalPages - 2) {
      // Near end: 1, 2, ..., totalPages - 3, totalPages - 2, totalPages - 1, totalPages
      items.push(1, 2, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      // In middle: 1, ..., curr - 1, curr, curr + 1, ..., totalPages - 1, totalPages
      items.push(
        1,
        '...',
        currentPage - 1,
        currentPage,
        currentPage + 1,
        '...',
        totalPages - 1,
        totalPages
      );
    }
  }

  return (
    <div className={cn('flex items-center justify-center gap-1.5 flex-wrap', className)}>
      {/* Previous Page Button */}
      <button
        type="button"
        disabled={currentPage <= 1 || isLoading}
        onClick={() => onPageChange(currentPage - 1)}
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-100 text-slate-600 disabled:opacity-35 disabled:cursor-not-allowed transition flex items-center justify-center font-medium shadow-xs"
        title="Oldingi sahifa"
        aria-label="Oldingi sahifa"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Dynamic Page Items */}
      {items.map((item, idx) => {
        if (item === '...') {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="w-7 h-9 sm:w-8 sm:h-10 flex items-center justify-center text-slate-400 font-bold tracking-widest text-sm select-none"
            >
              ...
            </span>
          );
        }

        const isCurrent = item === currentPage;
        return (
          <button
            key={`page-${item}`}
            type="button"
            disabled={isLoading}
            onClick={() => onPageChange(item)}
            className={cn(
              'w-9 h-9 sm:w-10 sm:h-10 rounded-2xl transition-all duration-150 flex items-center justify-center text-xs sm:text-sm font-semibold shadow-xs',
              isCurrent
                ? 'bg-teal-600 hover:bg-teal-700 text-white font-bold border border-teal-600 shadow-sm shadow-teal-600/20 scale-105'
                : 'border border-slate-200/90 bg-slate-50/70 hover:bg-slate-100 text-slate-700 hover:text-slate-900'
            )}
            aria-current={isCurrent ? 'page' : undefined}
          >
            {item}
          </button>
        );
      })}

      {/* Next Page Button */}
      <button
        type="button"
        disabled={currentPage >= totalPages || isLoading}
        onClick={() => onPageChange(currentPage + 1)}
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-100 text-slate-600 disabled:opacity-35 disabled:cursor-not-allowed transition flex items-center justify-center font-medium shadow-xs"
        title="Keyingi sahifa"
        aria-label="Keyingi sahifa"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

