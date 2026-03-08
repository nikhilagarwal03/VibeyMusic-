import React from 'react';
import Button from './Button';

const ICON_BUTTON_SIZES = {
  sm: 'p-2',
  md: 'p-2.5',
  lg: 'p-3'
};

const joinClassNames = (...classes) => classes.filter(Boolean).join(' ');

const IconButton = ({ size = 'md', className, ...props }) => (
  <Button
    size="sm"
    className={joinClassNames('inline-flex items-center justify-center rounded-lg', ICON_BUTTON_SIZES[size], className)}
    {...props}
  />
);

export default IconButton;
