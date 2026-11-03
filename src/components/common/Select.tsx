import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SelectOption {
  value: string | number;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
}

export const Select: React.FC<CustomSelectProps> = ({
  label,
  error,
  helperText,
  options,
  value: controlledValue,
  defaultValue,
  onChange,
  placeholder = 'Tanlang...',
  className,
  disabled = false,
  required = false,
  id,
}) => {
  const [internalValue, setInternalValue] = useState<string | number>(
    controlledValue !== undefined ? controlledValue : defaultValue !== undefined ? defaultValue : ''
  );
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentValue = controlledValue !== undefined ? controlledValue : internalValue;

  const selectedOption = options.find(
    (opt) => String(opt.value) === String(currentValue)
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (val: string | number) => {
    const stringVal = String(val);
    if (controlledValue === undefined) {
      setInternalValue(val);
    }
    if (onChange) {
      onChange(stringVal);
    }
    setIsOpen(false);
  };

  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={cn('w-full relative', className)} ref={dropdownRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
        >
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        id={selectId}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'relative w-full flex items-center justify-between rounded-xl border bg-white px-3.5 py-2.5 text-left text-sm transition-all duration-200 outline-none shadow-xs',
          isOpen
            ? 'border-brand-500 ring-3 ring-brand-500/15'
            : error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/15'
            : 'border-slate-200/90 hover:border-slate-300 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15',
          disabled && 'bg-slate-50 cursor-not-allowed opacity-60 text-slate-400',
          !selectedOption && 'text-slate-400'
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption ? (
            <>
              {selectedOption.icon && <span>{selectedOption.icon}</span>}
              <span className="font-medium text-slate-800 truncate">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>

        <span className="ml-2 pointer-events-none text-slate-400 transition-transform duration-200">
          <ChevronDown
            className={cn('w-4 h-4 transition-transform duration-200', isOpen && 'rotate-180 text-brand-600')}
          />
        </span>
      </button>

      {/* Animated Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-xl bg-white p-1.5 shadow-xl shadow-slate-200/50 border border-slate-100 divide-y divide-slate-50 animate-in fade-in-0 zoom-in-95 duration-150">
          {options.length === 0 ? (
            <div className="py-3 px-3 text-xs text-center text-slate-400">
              Variantlar mavjud emas
            </div>
          ) : (
            <div className="space-y-0.5">
              {options.map((option) => {
                const isSelected = String(option.value) === String(currentValue);
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm rounded-xl transition-all duration-150 text-left group',
                      isSelected
                        ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      {option.icon && <span className="shrink-0">{option.icon}</span>}
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{option.label}</span>
                        {option.sublabel && (
                          <span
                            className={cn(
                              'text-[11px] truncate',
                              isSelected ? 'text-brand-600/80' : 'text-slate-400 group-hover:text-slate-500'
                            )}
                          >
                            {option.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0 ml-2">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {error ? (
        <p className="mt-1.5 text-xs text-rose-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};
