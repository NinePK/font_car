'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '', 
  ...props 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-12 px-8 text-lg'
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--primary)',
      color: 'var(--primary-foreground)',
      borderColor: 'transparent'
    },
    secondary: {
      backgroundColor: 'var(--secondary)',
      color: 'var(--secondary-foreground)',
      borderColor: 'var(--border)'
    },
    destructive: {
      backgroundColor: 'var(--destructive)',
      color: 'var(--destructive-foreground)',
      borderColor: 'transparent'
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--foreground)',
      borderColor: 'var(--border)'
    }
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${className}`}
      style={{
        ...variantStyles[variant],
        borderWidth: '1px'
      }}
      {...props}
    >
      {children}
    </button>
  );
}
