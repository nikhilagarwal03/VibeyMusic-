import React from 'react';

const BUTTON_VARIANTS = {
  panel: 'panel-card hover:panel-card-elevated text-white',
  elevated: 'panel-card-elevated text-white',
  overlay: 'bg-black/40 hover:bg-black/55 text-gray-100',
  ghost: 'bg-transparent hover:bg-white/10 text-white'
};

const BUTTON_SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2 text-sm'
};

const joinClassNames = (...classes) => classes.filter(Boolean).join(' ');

const Button = React.forwardRef(function Button(
  {
    type = 'button',
    variant = 'panel',
    size = 'md',
    loading = false,
    className,
    disabled,
    children,
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={joinClassNames(
        'rounded-full font-medium motion-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#050505] disabled:opacity-60 disabled:cursor-not-allowed',
        BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.panel,
        BUTTON_SIZES[size] || BUTTON_SIZES.md,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
