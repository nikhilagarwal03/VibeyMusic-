import React from 'react';
import { SearchX, LibraryBig, Music, FolderOpen } from 'lucide-react';

const EMPTY_STATE_ICONS = {
  search: SearchX,
  library: LibraryBig,
  music: Music,
  default: FolderOpen,
};

const EmptyState = ({
  icon: IconComponent,
  iconType = 'default',
  title,
  description,
  action,
  className = '',
}) => {
  const Icon = IconComponent || EMPTY_STATE_ICONS[iconType] || EMPTY_STATE_ICONS.default;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="mb-4 text-gray-400">
        <Icon className="w-16 h-16 mx-auto" strokeWidth={1.5} />
      </div>
      {title && <h3 className="type-title mb-2 text-gray-300">{title}</h3>}
      {description && <p className="type-body text-gray-400 max-w-md mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
