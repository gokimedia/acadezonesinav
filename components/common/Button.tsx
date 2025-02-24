'use client';

import {
  ButtonHTMLAttributes,
  forwardRef,
  useMemo,
} from 'react';
import { VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500',
        secondary:
          'bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-500',
        outline:
          'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700',
        ghost:
          'hover:bg-gray-100 text-gray-700',
        danger:
          'bg-error-main text-white hover:bg-error-dark focus-visible:ring-error-main',
        success:
          'bg-success-main text-white hover:bg-success-dark focus-visible:ring-success-main',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

/**
 * Button bileşeni:
 * - `loading` true olduğunda disabled olur ve bir spinner gösterir.
 * - Varsayılan `type` = "button"
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, loading, children, type = 'button', ...props },
    ref
  ) => {
    // Button stillerini hesapla
    const computedClasses = useMemo(
      () => buttonVariants({ variant, size, className }),
      [variant, size, className]
    );

    return (
      <button
        ref={ref}
        type={type}
        className={cn(computedClasses)}
        disabled={loading || props.disabled}
        aria-busy={loading ? 'true' : 'false'}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
