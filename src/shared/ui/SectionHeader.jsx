import React from 'react';

const SectionHeader = ({ title, actionText, onAction, action }) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="type-title text-[hsl(var(--foreground))]">{title}</h3>
      {action || (actionText && (
        <button 
          onClick={onAction}
          className="text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
        >
          {actionText}
        </button>
      ))}
    </div>
  );
};

export { SectionHeader };
export default SectionHeader;