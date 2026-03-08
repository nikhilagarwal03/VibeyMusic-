import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState = ({ message = 'Loading...', size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} text-blue-400 animate-spin mb-4`} strokeWidth={2} />
      {message && <p className="type-body text-gray-400">{message}</p>}
    </div>
  );
};

export default LoadingState;
