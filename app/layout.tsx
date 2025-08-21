// app/layout.tsx
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ThemeWrapper from './components/ThemeWrapper';
import ThemeToggle from './components/ThemeToggle';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ระบบล็อกอิน - NextJS และ NodeJS',
  description: 'ระบบล็อกอินที่สร้างด้วย NextJS, NodeJS และ MySQL',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <ThemeWrapper>
              <ThemeToggle />
              {children}
            </ThemeWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}