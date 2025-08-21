'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ 
  label, 
  error, 
  className = '', 
  ...props 
}: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium transition-colors duration-300"
               style={{ color: 'var(--foreground)' }}>
          {label}
        </label>
      )}
      <input
        className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-colors duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        style={{
          backgroundColor: 'var(--card)',
          borderColor: 'var(--border)',
          color: 'var(--foreground)'
        }}
        {...props}
      />
      {error && (
        <p className="text-sm transition-colors duration-300"
           style={{ color: 'var(--destructive)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
