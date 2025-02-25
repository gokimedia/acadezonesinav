'use client';

import React, { useState, ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
}

export const Tooltip = ({ 
  content, 
  children, 
  position = 'top', 
  delay = 300 
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  // Tooltip pozisyonu için stil ve sınıf belirleme
  const getPositionClass = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 mb-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 translate-x-2 ml-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 translate-y-2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 -translate-x-2 mr-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 mb-2';
    }
  };

  // Tooltip ok (arrow) pozisyonu için sınıf belirleme
  const getArrowClass = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-800 border-r-transparent border-b-transparent border-l-transparent';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-r-gray-800 border-b-transparent border-l-transparent';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-t-transparent border-r-transparent border-b-gray-800 border-l-transparent';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-r-transparent border-b-transparent border-l-gray-800';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-800 border-r-transparent border-b-transparent border-l-transparent';
    }
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      
      {isVisible && (
        <div className={`absolute z-10 whitespace-nowrap ${getPositionClass()}`}>
          <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg">
            {content}
          </div>
          <div className={`absolute w-0 h-0 border-4 ${getArrowClass()}`}></div>
        </div>
      )}
    </div>
  );
};