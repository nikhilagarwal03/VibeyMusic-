import React from 'react';

const SectionHeader = ({ title, subtitle, action, className = '' }) => (
  <div className={`mb-5 flex items-center justify-between gap-3 ${className}`.trim()}>
    <div>
      <h3 className="type-title">{title}</h3>
      {subtitle ? <p className="type-caption text-gray-400 mt-1">{subtitle}</p> : null}
    </div>
    {action}
  </div>
);

export default SectionHeader;
