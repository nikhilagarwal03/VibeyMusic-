import React from 'react';

const joinClassNames = (...classes) => classes.filter(Boolean).join(' ');

const Card = ({
  as = 'div',
  interactive = false,
  className,
  onClick,
  onKeyDown,
  children,
  ...props
}) => {
  const interactiveProps = interactive
    ? {
        role: 'button',
        tabIndex: 0,
        onClick,
        onKeyDown: (event) => {
          if ((event.key === 'Enter' || event.key === ' ') && onClick) {
            event.preventDefault();
            onClick(event);
          }

          onKeyDown?.(event);
        }
      }
    : { onClick, onKeyDown };

  const elementType = as;

  return React.createElement(
    elementType,
    {
      className: joinClassNames(
        'panel-card motion-base',
        interactive && 'hover:panel-card-elevated cursor-pointer focus-within:ring-2 focus-within:ring-blue-500',
        className
      ),
      ...interactiveProps,
      ...props,
    },
    children,
  );
};

export default Card;
