import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../../lib/cn';

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}>;

export function Button({ children, className, variant = 'secondary', ...props }: ButtonProps) {
  return (
    <button className={cn('button', `button-${variant}`, className)} {...props}>
      {children}
    </button>
  );
}
