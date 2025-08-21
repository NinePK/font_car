// app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  useEffect(() => {
    // ถ้าผู้ใช้ล็อกอินแล้ว ให้ redirect ไปหน้า dashboard ตามบทบาท
    if (!loading && user) {
      if (user.role === 'customer') {
        router.push('/customer/dashboard');
      } else if (user.role === 'shop') {
        router.push('/shop/dashboard');
      } else {
        router.push('/login'); // fallback ถ้าไม่มี role ที่รู้จัก
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6">
          ยินดีต้อนรับสู่ระบบล็อกอิน
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          เว็บแอปพลิเคชันที่สร้างด้วย NextJS, NodeJS และ MySQL
        </p>
        <div className="flex space-x-4 justify-center">
          <Link 
            href="/login" 
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            เข้าสู่ระบบ
          </Link>
          <Link 
            href="/register" 
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            ลงทะเบียน
          </Link>
        </div>
      </div>
    </div>
  );
}