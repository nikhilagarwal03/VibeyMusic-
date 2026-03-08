import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

const ErrorState = ({
  title = 'Something went wrong',
  message = 'An error occurred while loading this content.',
  error,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="mb-4 text-red-400">
        <AlertTriangle className="w-16 h-16 mx-auto" strokeWidth={1.5} />
      </div>
      <h3 className="type-title mb-2 text-gray-300">{title}</h3>
      <p className="type-body text-gray-400 max-w-md mb-2">{message}</p>
      {error && (
        <p className="type-caption text-gray-500 font-mono mb-6 max-w-md break-all">
          {error.message || String(error)}
        </p>
      )}
      {onRetry && (
        <Button variant="panel" size="md" onClick={onRetry} className="gap-2 inline-flex items-center">
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
