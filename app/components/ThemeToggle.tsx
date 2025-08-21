'use client';

import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  const handleToggle = () => {
    console.log('Current theme:', theme);
    toggleTheme();
    console.log('Theme toggled to:', theme === 'light' ? 'dark-classic' : 'light');
  };

  // ไม่แสดงอะไรจนกว่า component จะ mounted
  if (!mounted) {
    return (
      <button
        className="fixed top-4 right-4 z-50 p-3 rounded-full bg-gray-200 shadow-lg transition-all duration-200 border border-gray-300"
        disabled
      >
        <div className="w-5 h-5 bg-gray-400 rounded animate-pulse" />
      </button>
    );
  }

  const getThemeIcon = () => {
    return theme === 'light' ? (
      <Moon className="w-5 h-5 text-gray-700" />
    ) : (
      <Sun className="w-5 h-5 text-yellow-400" />
    );
  };

  const getThemeName = () => {
    return theme === 'light' ? 'สว่าง' : 'มืด';
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={handleToggle}
        className="p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border"
        aria-label={`เปลี่ยนธีม (ปัจจุบัน: ${getThemeName()})`}
        style={{
          backgroundColor: 'var(--card)',
          borderColor: 'var(--border)'
        }}
      >
        {getThemeIcon()}
      </button>
      <div className="mt-2 text-xs text-center transition-colors duration-300"
           style={{ color: 'var(--muted-foreground)' }}>
        {getThemeName()}
      </div>
    </div>
  );
}
