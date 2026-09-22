import React from 'react';

export const EmptyState = ({ title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center panel-card">
      <h4 className="type-title mb-1 text-[hsl(var(--foreground))]">{title}</h4>
      <p className="type-body max-w-sm">{description}</p>
    </div>
  );
};

export default EmptyState;