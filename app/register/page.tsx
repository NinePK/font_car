// app/register/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

interface RegisterFormInputs {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'customer' | 'shop';
}

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterFormInputs>();
  
  const password = watch('password');
  
  const onSubmit = async (data: RegisterFormInputs) => {
    setLoading(true);
    setError('');
    
    try {
      // จำลองการลงทะเบียน
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // นำทางไปหน้า login พร้อม success message
      router.push('/login?registered=true');
    } catch (error: any) {
      setError(error.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300"
         style={{ backgroundColor: 'var(--secondary)' }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold transition-colors duration-300"
             style={{ color: 'var(--foreground)' }}>
          ลงทะเบียน
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent className="pt-6">
            {error && (
              <div className="mb-4 border px-4 py-3 rounded transition-colors duration-300"
                   style={{
                     backgroundColor: 'var(--destructive)',
                     borderColor: 'var(--destructive)',
                     color: 'var(--destructive-foreground)'
                   }}>
                {error}
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <Input
                label="ชื่อผู้ใช้"
                type="text"
                autoComplete="username"
                error={errors.username?.message}
                {...register('username', {
                  required: 'กรุณากรอกชื่อผู้ใช้',
                  minLength: { value: 3, message: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร' }
                })}
              />

              <Input
                label="อีเมล"
                type="email"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email', {
                  required: 'กรุณากรอกอีเมล',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'กรุณากรอกอีเมลที่ถูกต้อง' }
                })}
              />

              <Input
                label="รหัสผ่าน"
                type="password"
                autoComplete="new-password"
                error={errors.password?.message}
                {...register('password', {
                  required: 'กรุณากรอกรหัสผ่าน',
                  minLength: { value: 6, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }
                })}
              />

              <Input
                label="ยืนยันรหัสผ่าน"
                type="password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'กรุณายืนยันรหัสผ่าน',
                  validate: value => value === password || 'รหัสผ่านไม่ตรงกัน'
                })}
              />

              <div>
                <label className="block text-sm font-medium transition-colors duration-300"
                       style={{ color: 'var(--foreground)' }}>
                  บทบาท
                </label>
                <select
                  className="mt-1 block w-full rounded-md border px-3 py-2 text-sm transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}
                  {...register('role', { required: 'กรุณาเลือกบทบาท' })}
                >
                  <option value="">เลือกบทบาท</option>
                  <option value="customer">ลูกค้า</option>
                  <option value="shop">ร้านค้า</option>
                </select>
                {errors.role && (
                  <p className="mt-2 text-sm transition-colors duration-300"
                     style={{ color: 'var(--destructive)' }}>
                    {errors.role.message}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'กำลังดำเนินการ...' : 'ลงทะเบียน'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="text-center">
                <p className="text-sm transition-colors duration-300"
                   style={{ color: 'var(--muted-foreground)' }}>
                  มีบัญชีผู้ใช้แล้ว?{' '}
                  <Link href="/login" className="font-medium hover:opacity-80 transition-colors duration-300"
                        style={{ color: 'var(--primary)' }}>
                    เข้าสู่ระบบ
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