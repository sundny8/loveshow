import { cn } from '@/lib/utils';
import { forwardRef, ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 focus:ring-primary-500':
              variant === 'primary',
            'bg-secondary-600 text-white shadow-sm hover:bg-secondary-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 focus:ring-secondary-500':
              variant === 'secondary',
            'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 focus:ring-slate-400':
              variant === 'outline',
            'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-slate-500':
              variant === 'ghost',
            'bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 focus:ring-red-500':
              variant === 'destructive',
          },
          {  
            'text-sm px-4 py-2': size === 'sm',
            'text-sm px-5 py-2.5': size === 'md',
            'text-base px-7 py-3.5': size === 'lg',
            'p-2 w-9 h-9': size === 'icon',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
