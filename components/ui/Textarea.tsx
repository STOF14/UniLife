// components/ui/Textarea.tsx
import { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className={`space-y-1.5 ${className}`}>
        {label && (
          <label className="block text-label uppercase tracking-[0.08em] text-text-secondary">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`block w-full bg-transparent border-b px-0 py-2 text-body text-text-primary placeholder:text-text-tertiary focus:outline-none transition-colors duration-200 ${
            error
              ? 'border-danger focus:border-danger'
              : 'border-border focus:border-text-primary'
          }`}
          {...props}
        />
        {error && <p className="mt-1 text-caption text-danger">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';