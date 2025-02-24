import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local';
  multiline?: boolean;
  rows?: number;
}

const FormInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, FormInputProps>(
  ({ className, label, error, helperText, type = 'text', multiline = false, rows = 3, ...props }, ref) => {
    const inputClassName = cn(
      'block w-full rounded-md border-gray-300 shadow-sm transition-colors',
      'focus:border-primary-500 focus:ring-primary-500 sm:text-sm',
      'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
      error && 'border-error-main focus:border-error-main focus:ring-error-main',
      className
    );

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        {multiline ? (
          <textarea
            className={inputClassName}
            rows={rows}
            ref={ref as React.Ref<HTMLTextAreaElement>}
            {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            type={type}
            className={inputClassName}
            ref={ref as React.Ref<HTMLInputElement>}
            {...props}
          />
        )}
        {error && (
          <p className="mt-1 text-sm text-error-main">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export { FormInput };
