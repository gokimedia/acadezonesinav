'use client';

import React from 'react';

interface ClientButtonProps {
  href?: string;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

export default function ClientButton({ href, onClick, className, children }: ClientButtonProps) {
  const handleClick = () => {
    if (href) {
      window.location.href = href;
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <button 
      onClick={handleClick} 
      className={className}
    >
      {children}
    </button>
  );
}