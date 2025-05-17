import React from 'react';
import { cn } from '../../lib/utils';
import { Input } from '../common/Input';
import { Label } from '../common/Label';

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  className?: string;
  children: React.ReactNode;
}

export const Form: React.FC<FormProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <form
      className={cn('space-y-4', className)}
      {...props}
    >
      {children}
    </form>
  );
};

interface FormGroupProps {
  className?: string;
  children: React.ReactNode;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  className,
  children
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {children}
    </div>
  );
};

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  className?: string;
  children: React.ReactNode;
}

export const FormLabel: React.FC<FormLabelProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <Label className={className} {...props}>
      {children}
    </Label>
  );
};

interface FormControlProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const FormControl: React.FC<FormControlProps> = ({
  className,
  ...props
}) => {
  return (
    <Input className={className} {...props} />
  );
};

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  children: React.ReactNode;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <select
      className={cn(
        'flex h-10 w-full rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm ring-offset-[var(--background)] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
};

interface FormCheckProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  label?: React.ReactNode;
  type?: 'checkbox' | 'radio';
}

export const FormCheck: React.FC<FormCheckProps> = ({
  className,
  label,
  type = 'checkbox',
  ...props
}) => {
  return (
    <div className="flex items-center space-x-2">
      <input
        type={type}
        className={cn(
          'h-4 w-4 rounded border border-[var(--input)] bg-[var(--background)] text-[var(--primary)] focus:ring-[var(--ring)] focus:ring-offset-[var(--background)]',
          type === 'radio' && 'rounded-full',
          className
        )}
        {...props}
      />
      {label && (
        <label
          htmlFor={props.id}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default {
  Form,
  FormGroup,
  FormLabel,
  FormControl,
  FormSelect,
  FormCheck
};
