import React, { createContext, useContext, useId } from 'react';
import { cn } from '../../lib/utils';

// Form Context
interface FormContextValue {
  id: string;
}

const FormContext = createContext<FormContextValue | undefined>(undefined);

// Form component
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function Form({ className, onSubmit, children, ...props }: FormProps) {
  const id = useId();

  return (
    <FormContext.Provider value={{ id }}>
      <form
        className={cn('space-y-4', className)}
        onSubmit={onSubmit}
        {...props}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
}

// Form item (wrapper for form fields)
interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {}

export function FormItem({ className, ...props }: FormItemProps) {
  return (
    <div className={cn('space-y-1.5', className)} {...props} />
  );
}

// Form label
interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function FormLabel({ className, required, children, ...props }: FormLabelProps) {
  return (
    <label
      className={cn(
        'text-sm font-medium text-gray-700 dark:text-gray-300 leading-none',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

// Form control (wrapper for inputs)
interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {}

export function FormControl({ className, ...props }: FormControlProps) {
  return (
    <div className={cn('relative', className)} {...props} />
  );
}

// Form message (for validation errors or hints)
interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  type?: 'error' | 'info';
}

export function FormMessage({ className, type = 'error', children, ...props }: FormMessageProps) {
  return (
    <p
      className={cn(
        'text-xs font-medium',
        type === 'error' && 'text-red-500 dark:text-red-400',
        type === 'info' && 'text-gray-500 dark:text-gray-400',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

// Form description
interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export function FormDescription({ className, ...props }: FormDescriptionProps) {
  return (
    <p
      className={cn('text-xs text-gray-500 dark:text-gray-400', className)}
      {...props}
    />
  );
}

// Form field - integrates with external form libraries (React Hook Form)
interface FormFieldProps {
  name: string;
  render: (props: { id: string; name: string }) => React.ReactNode;
}

export function FormField({ name, render }: FormFieldProps) {
  const formContext = useContext(FormContext);
  if (!formContext) {
    throw new Error('FormField must be used within a Form');
  }

  const id = `${formContext.id}-${name}`;
  
  return render({ id, name });
} 