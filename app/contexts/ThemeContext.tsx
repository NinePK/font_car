'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark-classic';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // ตรวจสอบ theme ที่บันทึกไว้ใน localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setThemeState(savedTheme);
    } else {
      // ถ้าไม่มี theme ที่บันทึกไว้ ให้ใช้ตาม system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark-classic' : 'light';
      setThemeState(systemTheme);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // อัปเดต CSS variables เมื่อ theme เปลี่ยน
    const root = document.documentElement;
    
    // ลบ class เก่าทั้งหมด
    root.classList.remove('light', 'dark-classic');
    
    if (theme === 'light') {
      // Light theme - ใช้ CSS variables เริ่มต้น
      root.style.removeProperty('--background');
      root.style.removeProperty('--foreground');
      root.style.removeProperty('--card');
      root.style.removeProperty('--card-foreground');
      root.style.removeProperty('--popover');
      root.style.removeProperty('--popover-foreground');
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
      root.style.removeProperty('--secondary');
      root.style.removeProperty('--secondary-foreground');
      root.style.removeProperty('--muted');
      root.style.removeProperty('--muted-foreground');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-foreground');
      root.style.removeProperty('--destructive');
      root.style.removeProperty('--destructive-foreground');
      root.style.removeProperty('--border');
      root.style.removeProperty('--input');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--success');
      root.style.removeProperty('--success-foreground');
      root.style.removeProperty('--warning');
      root.style.removeProperty('--warning-foreground');
    } else {
      // Dark classic theme - เพิ่ม class เพื่อใช้ CSS variables จาก globals.css
      root.classList.add(theme);
    }
    
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark-classic' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
