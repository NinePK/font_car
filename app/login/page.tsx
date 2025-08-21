// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import axios from 'axios';

interface LoginFormInputs {
  username: string;
  password: string;
  remember?: boolean;
}

export default function Login() {
  const router = useRouter();
  const { login, error: authError, loading } = useAuth();
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormInputs>();
  
  // ตรวจสอบ query parameters และตั้งค่า success message
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    const registered = url.searchParams.get('registered');
    if (registered && !successMessage) {
      setSuccessMessage('ลงทะเบียนสำเร็จ กรุณาเข้าสู่ระบบ');
    }
  }
  
  const onSubmit = async (data: LoginFormInputs) => {
    setSubmitError('');
    try {
      const success = await login(data.username, data.password);
      
      if (success) {
        // ดึงข้อมูลผู้ใช้จาก localStorage โดยตรง
        const token = localStorage.getItem('token');
        if (token) {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
          const response = await axios.get(`${API_URL}/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          const userData = response.data.user;
          
          // นำทางตามบทบาทของผู้ใช้
          if (userData.role === 'customer') {
            router.push('/customer/dashboard');
          } else if (userData.role === 'shop') {
            router.push('/shop/dashboard');
          } else {
            router.push('/'); // redirect ไปหน้าแรกถ้าไม่มี role ที่รู้จัก
          }
        }
      } else {
        setSubmitError(authError || 'เข้าสู่ระบบล้มเหลว โปรดตรวจสอบชื่อผู้ใช้และรหัสผ่าน');
      }
    } catch (error: any) {
      console.error("Error during login:", error);
      setSubmitError(error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300"
         style={{ backgroundColor: 'var(--secondary)' }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold transition-colors duration-300"
             style={{ color: 'var(--foreground)' }}>
          เข้าสู่ระบบ
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent className="pt-6">
            {successMessage && (
              <div className="mb-4 border px-4 py-3 rounded transition-colors duration-300"
                   style={{
                     backgroundColor: 'var(--success)',
                     borderColor: 'var(--success)',
                     color: 'var(--success-foreground)'
                   }}>
                {successMessage}
              </div>
            )}
            
            {submitError && (
              <div className="mb-4 border px-4 py-3 rounded transition-colors duration-300"
                   style={{
                     backgroundColor: 'var(--destructive)',
                     borderColor: 'var(--destructive)',
                     color: 'var(--destructive-foreground)'
                   }}>
                {submitError}
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <Input
                label="ชื่อผู้ใช้"
                type="text"
                autoComplete="username"
                error={errors.username?.message}
                {...register('username', {
                  required: 'กรุณากรอกชื่อผู้ใช้'
                })}
              />

              <Input
                label="รหัสผ่าน"
                type="password"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register('password', {
                  required: 'กรุณากรอกรหัสผ่าน'
                })}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    type="checkbox"
                    className="h-4 w-4 focus:ring-2 border rounded transition-colors duration-300"
                    style={{
                      borderColor: 'var(--border)',
                      backgroundColor: 'var(--card)'
                    }}
                    {...register('remember')}
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm transition-colors duration-300"
                         style={{ color: 'var(--foreground)' }}>
                    จดจำฉัน
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium hover:opacity-80 transition-colors duration-300"
                     style={{ color: 'var(--primary)' }}>
                    ลืมรหัสผ่าน?
                  </a>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'กำลังดำเนินการ...' : 'เข้าสู่ระบบ'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="text-center">
                <p className="text-sm transition-colors duration-300"
                   style={{ color: 'var(--muted-foreground)' }}>
                  ยังไม่มีบัญชีผู้ใช้?{' '}
                  <Link href="/register" className="font-medium hover:opacity-80 transition-colors duration-300"
                        style={{ color: 'var(--primary)' }}>
                    ลงทะเบียน
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}