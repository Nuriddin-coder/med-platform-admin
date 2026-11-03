import React from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
} from 'lucide-react';
import type { PaginationMeta } from '@/api/types';
import { Spinner } from './Spinner';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { Pagination } from './Pagination';
import { cn } from '@/utils/cn';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  meta?: PaginationMeta;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  // Search & Filter
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  // Sort
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (field: string) => void;
  // Pagination
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  // Extra Header Actions
  action?: React.ReactNode;
  filters?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  meta,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  search,
  onSearchChange,
  searchPlaceholder = "Qidirish...",
  sortBy,
  sortOrder,
  onSortChange,
  onPageChange,
  onLimitChange: _onLimitChange,
  action,
  filters,
  emptyTitle = "Ma'lumot topilmadi",
  emptyDescription = "Qidiruv parametrlarini o'zgartirib ko'ring yoki yangi ma'lumot qo'shing",
  onRowClick,
}: DataTableProps<T>) {
  const currentPage = meta?.page || 1;
  const totalPages = meta?.totalPages || 1;
  const total = meta?.total ?? data.length;
  const limit = meta?.limit || 10;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      {(onSearchChange || action || filters) && (
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex flex-1 items-center gap-3 flex-wrap">
            {onSearchChange && (
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search ?? ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
            )}
            {filters}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}

      {/* Content State */}
      {isError ? (
        <div className="p-8">
          <ErrorState message={errorMessage} onRetry={onRetry} />
        </div>
      ) : (
        <div className="relative overflow-x-auto min-h-[300px]">
          {isLoading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Spinner size="lg" label="Ma'lumotlar yuklanmoqda..." />
            </div>
          )}

          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
              <tr>
                {columns.map((col) => {
                  const isCurrentSort = sortBy === col.key;
                  return (
                    <th
                      key={col.key}
                      className={cn(
                        'px-5 py-3.5 font-semibold select-none',
                        col.sortable && 'cursor-pointer hover:text-slate-800 transition-colors',
                        col.className
                      )}
                      onClick={() => col.sortable && onSortChange && onSortChange(col.key)}
                    >
                      <div className="inline-flex items-center gap-1.5">
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span className="text-slate-400">
                            {isCurrentSort ? (
                              sortOrder === 'asc' ? (
                                <ArrowUp className="w-3.5 h-3.5 text-brand-600" />
                              ) : (
                                <ArrowDown className="w-3.5 h-3.5 text-brand-600" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 hover:text-slate-600" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length > 0 ? (
                data.map((row, idx) => (
                  <tr
                    key={(row.id as string) || idx}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={cn(
                      'hover:bg-brand-50/20 transition-colors',
                      onRowClick && 'cursor-pointer'
                    )}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={cn('px-5 py-4 text-slate-700', col.className)}>
                        {col.render
                          ? col.render(row, idx)
                          : (row[col.key] as React.ReactNode) ?? '-'}
                      </td>
                    ))}
                  </tr>
                ))
              ) : !isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center">
                    <EmptyState title={emptyTitle} description={emptyDescription} />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      {/* Centered Standalone Pagination */}
      {meta && (
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/40 flex items-center justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={(page) => onPageChange && onPageChange(page)}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
}

