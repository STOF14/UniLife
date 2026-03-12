// components/ui/Textarea.tsx
import { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className={`space-y-2 ${className}`}>
        {label && (
          <label className="block text-label uppercase tracking-[0.1em] text-text-muted">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`block w-full border-b bg-transparent px-0 py-2.5 text-body text-text-primary placeholder:text-text-muted focus:outline-none transition-colors duration-300 ease-contemplative ${
            error
              ? 'border-danger focus:border-danger'
              : 'border-border focus:border-text-secondary'
          }`}
          {...props}
        />
        {error && <p className="mt-1 text-caption text-danger">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';