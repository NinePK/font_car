'use client';

import { useTheme } from '../contexts/ThemeContext';

interface ThemeWrapperProps {
  children: React.ReactNode;
}

export default function ThemeWrapper({ children }: ThemeWrapperProps) {
  const { theme, mounted } = useTheme();

  // ไม่แสดงอะไรจนกว่า component จะ mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="text-gray-600">Loading theme...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)'
      }}
    >
      {children}
    </div>
  );
}
