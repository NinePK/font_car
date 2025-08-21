// app/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation'; // เพิ่มการนำเข้า useRouter
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'customer' | 'shop';
  phone?: string;
  address?: string;
  profile_image?: string;
  status: 'active' | 'inactive';
  shop_name?: string;
  shop_description?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  isShop: () => boolean;
  isCustomer: () => boolean;
  redirectToDashboard: () => void; // เพิ่มฟังก์ชันสำหรับเปลี่ยนเส้นทางไปยัง dashboard ที่เหมาะสม
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: 'customer' | 'shop';
  phone?: string;
  address?: string;
  shop_name?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // เพิ่ม router

  // แก้ไขในไฟล์ app/contexts/AuthContext.tsx
  useEffect(() => {
    // เพิ่ม state เพื่อติดตามว่าตรวจสอบแล้วหรือยัง
    const checkAuthOnce = async () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            await fetchUserData(token);
          } catch (error) {
            console.error("Error fetching user data:", error);
            localStorage.removeItem('token');
            setUser(null);
          }
        }
        // ไม่ว่าผลลัพธ์จะเป็นอย่างไร ให้ตั้งค่า loading เป็น false
        setLoading(false);
      }
    };
    
    checkAuthOnce();
  }, []);

  const fetchUserData = async (token: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUser(response.data.user);
      setError(null);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to fetch user data');
      // ถ้า token ไม่ถูกต้องหรือหมดอายุ ให้ logout
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/login`, {
        username,
        password
      });
      
      const { token } = response.data;
      localStorage.setItem('token', token);
      
      // เรียก fetchUserData เพื่อดึงข้อมูลผู้ใช้ล่าสุด
      await fetchUserData(token);
      
      return true;
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // เพิ่มฟังก์ชัน redirectToDashboard สำหรับเปลี่ยนเส้นทางตามบทบาท
  const redirectToDashboard = () => {
    if (user) {
      if (user.role === 'customer') {
        router.push('/customer/dashboard');
      } else if (user.role === 'shop') {
        router.push('/shop/dashboard');
      } else {
        router.push('/');
      }
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setLoading(true);
      console.log("Registering with API URL:", API_URL);
      console.log("Registration data:", userData);
      
      // ตรวจสอบค่า role ก่อนส่งไปยัง API
      if (userData.role !== 'customer' && userData.role !== 'shop') {
        console.error('Invalid role value:', userData.role);
        console.log('Forcing role to be shop since shop_name is provided:', !!userData.shop_name);
        
        // ถ้ามี shop_name ให้ตั้งค่า role เป็น shop
        if (userData.shop_name) {
          userData.role = 'shop';
        }
      }
      
      const response = await axios.post(`${API_URL}/register`, userData, {
        timeout: 10000, // เพิ่ม timeout 10 วินาที
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Registration response:", response.data);
      setError(null);
      return true;
    } catch (err: any) {
      console.error('Registration error details:', err);
      if (err.response) {
        // มีการตอบกลับจาก server แต่ status code ไม่ใช่ 2xx
        console.error('Server responded with:', err.response.status, err.response.data);
        
        // จัดการกับข้อผิดพลาด 409 (Conflict) โดยเฉพาะ
        if (err.response.status === 409) {
          setError('ชื่อผู้ใช้หรืออีเมลนี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่อผู้ใช้หรืออีเมลอื่น');
        } else {
          setError(err.response?.data?.message || 'การลงทะเบียนล้มเหลว โปรดลองอีกครั้ง');
        }
      } else if (err.request) {
        // ส่งคำขอไปแล้วแต่ไม่ได้รับการตอบกลับ
        console.error('No response received:', err.request);
        setError('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
      } else {
        // เกิดข้อผิดพลาดระหว่างการตั้งค่าคำขอ
        setError('เกิดข้อผิดพลาดในการลงทะเบียน: ' + err.message);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        return false;
      }

      const response = await axios.put(`${API_URL}/profile`, userData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setUser({...user, ...response.data.user} as User);
      setError(null);
      return true;
    } catch (err: any) {
      console.error('Update profile error:', err);
      setError(err.response?.data?.message || 'Update profile failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login'); // เปลี่ยนเส้นทางกลับไปยังหน้าเข้าสู่ระบบหลังออกจากระบบ
  };

  const isShop = () => {
    return user?.role === 'shop';
  };

  const isCustomer = () => {
    return user?.role === 'customer';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        isShop,
        isCustomer,
        redirectToDashboard // เพิ่มฟังก์ชันนี้ในค่าของ Provider
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};