import React from 'react';

const SKELETON_VARIANTS = {
  text: 'h-4',
  title: 'h-6',
  avatar: 'rounded-full',
  rect: 'rounded-lg',
  circle: 'rounded-full aspect-square',
};

const joinClassNames = (...classes) => classes.filter(Boolean).join(' ');

const Skeleton = ({ variant = 'rect', width, height, className, ...props }) => {
  const variantClass = SKELETON_VARIANTS[variant] || SKELETON_VARIANTS.rect;

  const style = {
    ...(width && { width }),
    ...(height && { height }),
  };

  return (
    <div
      className={joinClassNames(
        'bg-white/5 animate-pulse',
        variantClass,
        className
      )}
      style={style}
      aria-busy="true"
      aria-label="Loading"
      {...props}
    />
  );
};

export default Skeleton;
