// app/shop/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Link from 'next/link';
import axios from 'axios';
import { Car, User, LogOut, Moon, Sun, Save, Edit, Mail, Phone, MapPin, CreditCard, ArrowLeft } from 'lucide-react';
import React from 'react';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  shop_name: string;
  phone?: string;
  address?: string;
  promptpay_id?: string;
  profile_image?: string;
  role: string;
  created_at: string;
}

export default function ShopProfilePage() {
  const router = useRouter();
  const { user, loading, isShop, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    shop_name: '',
    phone: '',
    address: '',
    promptpay_id: ''
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user && !loading) {
      fetchProfile();
    }
  }, [user, loading]);

  const fetchProfile = async () => {
    try {
      setDataLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get(`${apiUrl}/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const profileData = response.data.user;
      setProfile(profileData);
      setFormData({
        username: profileData.username || '',
        email: profileData.email || '',
        shop_name: profileData.shop_name || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        promptpay_id: profileData.promptpay_id || ''
      });
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
    } finally {
      setDataLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      await axios.put(`${apiUrl}/profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSuccessMessage('อัพเดทข้อมูลโปรไฟล์สำเร็จ');
      setIsEditing(false);
      await fetchProfile(); // Reload data
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isMounted) {
    return <div className="min-h-screen flex justify-center items-center">กำลังโหลด...</div>;
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2"
               style={{ borderTopColor: 'var(--primary)', borderBottomColor: 'var(--primary)' }}></div>
          <p className="mt-2 transition-colors duration-300"
             style={{ color: 'var(--muted-foreground)' }}>
            กำลังโหลด...
          </p>
        </div>
      </div>
    );
  }

  if (!isShop) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <p className="text-lg text-red-600">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300"
         style={{ backgroundColor: 'var(--background)' }}>
      
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 shadow-lg border-b transition-all duration-300 backdrop-blur-sm"
           style={{
             backgroundColor: 'var(--card)',
             borderColor: 'var(--border)'
           }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300"
                     style={{ backgroundColor: 'var(--primary)' }}>
                  <Car className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold transition-colors duration-300"
                    style={{ color: 'var(--foreground)' }}>
                  ระบบจัดการเช่ารถ
                </h1>
              </div>
              
              {/* Navigation Links */}
              <div className="hidden md:flex space-x-6">
                <Link
                  href="/shop/dashboard"
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    color: 'var(--muted-foreground)',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  แดชบอร์ด
                </Link>
                <Link
                  href="/shop/notifications"
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    color: 'var(--muted-foreground)',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  การแจ้งเตือน
                </Link>
                <div
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    color: 'var(--primary)',
                    backgroundColor: 'var(--primary-foreground)'
                  }}
                >
                  <User className="w-4 h-4 inline mr-2" />
                  โปรไฟล์
                </div>
              </div>
            </div>
            
            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                  style={{ 
                    backgroundColor: 'var(--muted)',
                    color: 'var(--muted-foreground)'
                  }}
                >
                  {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300"
                     style={{ backgroundColor: 'var(--primary)' }}>
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium transition-colors duration-300"
                     style={{ color: 'var(--foreground)' }}>
                    {user?.username || 'ผู้ใช้'}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                  style={{ 
                    backgroundColor: 'var(--destructive)',
                    color: 'white'
                  }}
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
              style={{
                color: 'var(--primary)',
                backgroundColor: 'var(--muted)'
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              ย้อนกลับ
            </button>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300"
                   style={{ backgroundColor: 'var(--primary)' }}>
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold leading-tight transition-colors duration-300"
                    style={{ color: 'var(--foreground)' }}>
                  โปรไฟล์ร้านค้า
                </h1>
                <p className="text-sm transition-colors duration-300"
                   style={{ color: 'var(--muted-foreground)' }}>
                  จัดการข้อมูลส่วนตัวและร้านค้าของคุณ
                </p>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'white'
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                แก้ไขข้อมูล
              </button>
            )}
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 rounded-xl border transition-colors duration-300 flex items-start space-x-3"
                 style={{
                   backgroundColor: 'var(--destructive)',
                   borderColor: 'var(--destructive)',
                   color: 'white'
                 }}>
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                {error}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-xl border transition-colors duration-300 flex items-start space-x-3"
                 style={{
                   backgroundColor: '#10b981',
                   borderColor: '#10b981',
                   color: 'white'
                 }}>
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                {successMessage}
              </div>
            </div>
          )}

          {dataLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
                   style={{ borderTopColor: 'var(--primary)', borderBottomColor: 'var(--primary)' }}></div>
              <p className="mt-4 text-lg transition-colors duration-300"
                 style={{ color: 'var(--muted-foreground)' }}>
                กำลังโหลดข้อมูลโปรไฟล์...
              </p>
            </div>
          ) : profile ? (
            <div className="shadow-lg rounded-xl border transition-all duration-300"
                 style={{
                   backgroundColor: 'var(--card)',
                   borderColor: 'var(--border)'
                 }}>
              
              {isEditing ? (
                // Edit Form
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 transition-colors duration-300"
                             style={{ color: 'var(--foreground)' }}>
                        <User className="w-4 h-4 inline mr-2" />
                        ชื่อผู้ใช้
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-offset-2"
                        style={{
                          backgroundColor: 'var(--background)',
                          borderColor: 'var(--border)',
                          color: 'var(--foreground)'
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 transition-colors duration-300"
                             style={{ color: 'var(--foreground)' }}>
                        <Mail className="w-4 h-4 inline mr-2" />
                        อีเมล
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-offset-2"
                        style={{
                          backgroundColor: 'var(--background)',
                          borderColor: 'var(--border)',
                          color: 'var(--foreground)'
                        }}
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2 transition-colors duration-300"
                             style={{ color: 'var(--foreground)' }}>
                        <Car className="w-4 h-4 inline mr-2" />
                        ชื่อร้านค้า
                      </label>
                      <input
                        type="text"
                        name="shop_name"
                        value={formData.shop_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-offset-2"
                        style={{
                          backgroundColor: 'var(--background)',
                          borderColor: 'var(--border)',
                          color: 'var(--foreground)'
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 transition-colors duration-300"
                             style={{ color: 'var(--foreground)' }}>
                        <Phone className="w-4 h-4 inline mr-2" />
                        เบอร์โทรศัพท์
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-offset-2"
                        style={{
                          backgroundColor: 'var(--background)',
                          borderColor: 'var(--border)',
                          color: 'var(--foreground)'
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 transition-colors duration-300"
                             style={{ color: 'var(--foreground)' }}>
                        <CreditCard className="w-4 h-4 inline mr-2" />
                        หมายเลข PromptPay
                      </label>
                      <input
                        type="text"
                        name="promptpay_id"
                        value={formData.promptpay_id}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-offset-2"
                        style={{
                          backgroundColor: 'var(--background)',
                          borderColor: 'var(--border)',
                          color: 'var(--foreground)'
                        }}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2 transition-colors duration-300"
                             style={{ color: 'var(--foreground)' }}>
                        <MapPin className="w-4 h-4 inline mr-2" />
                        ที่อยู่
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-offset-2 resize-none"
                        style={{
                          backgroundColor: 'var(--background)',
                          borderColor: 'var(--border)',
                          color: 'var(--foreground)'
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          username: profile.username || '',
                          email: profile.email || '',
                          shop_name: profile.shop_name || '',
                          phone: profile.phone || '',
                          address: profile.address || '',
                          promptpay_id: profile.promptpay_id || ''
                        });
                      }}
                      className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                      style={{
                        backgroundColor: 'var(--muted)',
                        color: 'var(--muted-foreground)'
                      }}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex items-center px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: 'var(--primary)',
                        color: 'white'
                      }}
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          กำลังบันทึก...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          บันทึกข้อมูล
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                // View Mode
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg transition-colors duration-300"
                           style={{ backgroundColor: 'var(--muted)' }}>
                        <div className="flex items-center space-x-3">
                          <User className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                          <div>
                            <p className="text-sm transition-colors duration-300"
                               style={{ color: 'var(--muted-foreground)' }}>
                              ชื่อผู้ใช้
                            </p>
                            <p className="font-medium transition-colors duration-300"
                               style={{ color: 'var(--foreground)' }}>
                              {profile.username}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg transition-colors duration-300"
                           style={{ backgroundColor: 'var(--muted)' }}>
                        <div className="flex items-center space-x-3">
                          <Mail className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                          <div>
                            <p className="text-sm transition-colors duration-300"
                               style={{ color: 'var(--muted-foreground)' }}>
                              อีเมล
                            </p>
                            <p className="font-medium transition-colors duration-300"
                               style={{ color: 'var(--foreground)' }}>
                              {profile.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg transition-colors duration-300"
                           style={{ backgroundColor: 'var(--muted)' }}>
                        <div className="flex items-center space-x-3">
                          <Phone className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                          <div>
                            <p className="text-sm transition-colors duration-300"
                               style={{ color: 'var(--muted-foreground)' }}>
                              เบอร์โทรศัพท์
                            </p>
                            <p className="font-medium transition-colors duration-300"
                               style={{ color: 'var(--foreground)' }}>
                              {profile.phone || 'ยังไม่ได้ระบุ'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 rounded-lg transition-colors duration-300"
                           style={{ backgroundColor: 'var(--muted)' }}>
                        <div className="flex items-center space-x-3">
                          <Car className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                          <div>
                            <p className="text-sm transition-colors duration-300"
                               style={{ color: 'var(--muted-foreground)' }}>
                              ชื่อร้านค้า
                            </p>
                            <p className="font-medium transition-colors duration-300"
                               style={{ color: 'var(--foreground)' }}>
                              {profile.shop_name}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg transition-colors duration-300"
                           style={{ backgroundColor: 'var(--muted)' }}>
                        <div className="flex items-center space-x-3">
                          <CreditCard className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                          <div>
                            <p className="text-sm transition-colors duration-300"
                               style={{ color: 'var(--muted-foreground)' }}>
                              หมายเลข PromptPay
                            </p>
                            <p className="font-medium transition-colors duration-300"
                               style={{ color: 'var(--foreground)' }}>
                              {profile.promptpay_id && profile.promptpay_id.trim() ? profile.promptpay_id : 'ยังไม่ได้ระบุ'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg transition-colors duration-300"
                           style={{ backgroundColor: 'var(--muted)' }}>
                        <div className="flex items-start space-x-3">
                          <MapPin className="w-5 h-5 mt-1" style={{ color: 'var(--primary)' }} />
                          <div className="flex-1">
                            <p className="text-sm transition-colors duration-300"
                               style={{ color: 'var(--muted-foreground)' }}>
                              ที่อยู่
                            </p>
                            <p className="font-medium transition-colors duration-300"
                               style={{ color: 'var(--foreground)' }}>
                              {profile.address || 'ยังไม่ได้ระบุ'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t transition-colors duration-300"
                       style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm transition-colors duration-300"
                           style={{ color: 'var(--muted-foreground)' }}>
                          สมัครสมาชิกเมื่อ
                        </p>
                        <p className="font-medium transition-colors duration-300"
                           style={{ color: 'var(--foreground)' }}>
                          {new Date(profile.created_at).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm transition-colors duration-300"
                           style={{ color: 'var(--muted-foreground)' }}>
                          บทบาท
                        </p>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                              style={{
                                backgroundColor: 'var(--primary)',
                                color: 'white'
                              }}>
                          ร้านค้า
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg transition-colors duration-300"
                 style={{ color: 'var(--muted-foreground)' }}>
                ไม่พบข้อมูลโปรไฟล์
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}