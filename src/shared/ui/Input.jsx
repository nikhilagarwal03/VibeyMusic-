import React from 'react';

const INPUT_VARIANTS = {
  default: 'panel-card bg-white/5',
  filled: 'bg-white/10',
  outlined: 'border-2 border-white/20 bg-transparent',
};

const INPUT_SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-3 text-lg',
};

const joinClassNames = (...classes) => classes.filter(Boolean).join(' ');

const Input = React.forwardRef(function Input(
  {
    type = 'text',
    variant = 'default',
    size = 'md',
    error,
    helperText,
    label,
    className,
    disabled,
    ...props
  },
  ref
) {
  const generatedId = React.useId();
  const inputId = props.id || generatedId;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium mb-2 text-gray-300"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        disabled={disabled}
        className={joinClassNames(
          'w-full rounded-lg font-medium motion-base',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#050a1a]',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          'placeholder:text-gray-500',
          error ? 'border-2 border-red-500' : '',
          INPUT_VARIANTS[variant] || INPUT_VARIANTS.default,
          INPUT_SIZES[size] || INPUT_SIZES.md,
          className
        )}
        {...props}
      />
      {(error || helperText) && (
        <p
          className={joinClassNames(
            'mt-1.5 text-sm',
            error ? 'text-red-400' : 'text-gray-400'
          )}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
});

export default Input;
