import React from 'react';

const BADGE_VARIANTS = {
  default: 'bg-white/10 text-gray-300',
  primary: 'bg-blue-500/20 text-blue-300',
  success: 'bg-green-500/20 text-green-300',
  warning: 'bg-yellow-500/20 text-yellow-300',
  error: 'bg-red-500/20 text-red-300',
  info: 'bg-cyan-500/20 text-cyan-300',
};

const BADGE_SIZES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

const joinClassNames = (...classes) => classes.filter(Boolean).join(' ');

const Badge = ({ variant = 'default', size = 'sm', children, className, ...props }) => {
  return (
    <span
      className={joinClassNames(
        'inline-flex items-center rounded-full font-medium',
        BADGE_VARIANTS[variant] || BADGE_VARIANTS.default,
        BADGE_SIZES[size] || BADGE_SIZES.sm,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
