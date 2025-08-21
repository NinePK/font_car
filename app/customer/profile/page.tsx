// app/customer/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import axios from 'axios';
import { User, Car, Calendar, MapPin, Phone, Mail, Edit, Save, X, ArrowLeft, Shield, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  phone?: string;
  address?: string;
  profile_image?: string;
  created_at: string;
  role: string;
}

interface ProfileStats {
  total_bookings: number;
  active_bookings: number;
  completed_bookings: number;
  total_spent: number;
}

export default function CustomerProfilePage() {
  const router = useRouter();
  const { user, loading, isCustomer, logout } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    phone: '',
    address: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (!isCustomer()) {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, isCustomer, router]);

  useEffect(() => {
    if (user && isCustomer()) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/customer/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setProfile(response.data.profile);
      setEditForm({
        phone: response.data.profile.phone || '',
        address: response.data.profile.address || ''
      });
      setError(null);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || 'Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/customer/stats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setStats(response.data.stats);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/profile`,
        editForm,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setProfile(prev => prev ? { ...prev, ...editForm } : null);
      setIsEditing(false);
      setSuccess('อัปเดตโปรไฟล์เรียบร้อยแล้ว');
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      phone: profile?.phone || '',
      address: profile?.address || ''
    });
    setIsEditing(false);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <p className="text-lg">กำลังโหลด...</p>
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
                  <User className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold transition-colors duration-300"
                     style={{ color: 'var(--primary)' }}>ระบบเช่ารถ</h1>
              </div>
              
              {/* Navigation Links */}
              <div className="hidden md:flex space-x-6">
                <Link
                  href="/customer/dashboard"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-foreground)'
                  }}
                >
                  <span>หน้าแรก</span>
                </Link>
                <Link
                  href="/customer/bookings"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-foreground)'
                  }}
                >
                  <Calendar className="w-4 h-4" />
                  <span>การจองของฉัน</span>
                </Link>
                <Link
                  href="/customer/reviews"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-foreground)'
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>รีวิว</span>
                </Link>
                <Link
                  href="/customer/profile"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)'
                  }}
                >
                  <User className="w-4 h-4" />
                  <span>โปรไฟล์</span>
                </Link>
              </div>
            </div>

            {/* User Menu & Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/customer/dashboard')}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-foreground)'
                }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">กลับหน้าแรก</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300"
                 style={{ backgroundColor: 'var(--primary)' }}>
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold transition-colors duration-300"
                   style={{ color: 'var(--foreground)' }}>โปรไฟล์ของฉัน</h1>
              <p className="text-lg transition-colors duration-300"
                 style={{ color: 'var(--muted-foreground)' }}>จัดการข้อมูลส่วนตัวและดูสถิติการใช้งาน</p>
            </div>
          </div>
          
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 rounded-xl border transition-colors duration-300"
                 style={{
                   backgroundColor: 'var(--success)',
                   borderColor: 'var(--success)',
                   color: 'var(--success-foreground)'
                 }}>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>{success}</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 rounded-xl border transition-colors duration-300"
                 style={{
                   backgroundColor: 'var(--destructive)',
                   borderColor: 'var(--destructive)',
                   color: 'var(--destructive-foreground)'
                 }}>
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl"
                 style={{
                   backgroundColor: 'var(--card)',
                   borderColor: 'var(--border)'
                 }}>
              <div className="p-6 border-b transition-colors duration-300"
                   style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold transition-colors duration-300"
                       style={{ color: 'var(--foreground)' }}>ข้อมูลส่วนตัว</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                      style={{
                        backgroundColor: 'var(--primary)',
                        color: 'var(--primary-foreground)'
                      }}
                    >
                      <Edit className="w-4 h-4" />
                      <span>แก้ไข</span>
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCancel}
                        className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 border"
                        style={{
                          borderColor: 'var(--border)',
                          backgroundColor: 'var(--card)',
                          color: 'var(--foreground)'
                        }}
                      >
                        <X className="w-4 h-4" />
                        <span>ยกเลิก</span>
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50"
                        style={{
                          backgroundColor: 'var(--success)',
                          color: 'var(--success-foreground)'
                        }}
                      >
                        <Save className="w-4 h-4" />
                        <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึก'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto transition-colors duration-300"
                         style={{ borderColor: 'var(--primary)' }}></div>
                    <p className="mt-2 text-sm transition-colors duration-300"
                       style={{ color: 'var(--muted-foreground)' }}>กำลังโหลดข้อมูล...</p>
                  </div>
                ) : profile ? (
                  <div className="space-y-6">
                    {/* Profile Image & Basic Info */}
                    <div className="flex items-center space-x-6">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 transition-colors duration-300"
                           style={{ borderColor: 'var(--border)' }}>
                        {profile.profile_image ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'}${profile.profile_image}`}
                            alt={profile.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center transition-colors duration-300"
                               style={{ backgroundColor: 'var(--primary)' }}>
                            <User className="w-12 h-12 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold transition-colors duration-300"
                             style={{ color: 'var(--foreground)' }}>
                          {profile.username}
                        </h3>
                        <p className="text-sm transition-colors duration-300"
                           style={{ color: 'var(--muted-foreground)' }}>
                          สมาชิกตั้งแต่ {new Date(profile.created_at).toLocaleDateString('th-TH')}
                        </p>
                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300 mt-2"
                             style={{
                               backgroundColor: 'var(--accent)',
                               color: 'var(--accent-foreground)'
                             }}>
                          <Shield className="w-3 h-3" />
                          <span>ลูกค้า</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Mail className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                          <div>
                            <div className="text-sm transition-colors duration-300"
                                 style={{ color: 'var(--muted-foreground)' }}>
                              อีเมล
                            </div>
                            <div className="font-medium transition-colors duration-300"
                                 style={{ color: 'var(--foreground)' }}>
                              {profile.email}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Phone className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                          <div className="flex-1">
                            <div className="text-sm transition-colors duration-300"
                                 style={{ color: 'var(--muted-foreground)' }}>
                              เบอร์โทรศัพท์
                            </div>
                            {isEditing ? (
                              <input
                                type="tel"
                                value={editForm.phone}
                                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
                                style={{
                                  borderColor: 'var(--border)',
                                  backgroundColor: 'var(--card)',
                                  color: 'var(--foreground)'
                                }}
                                placeholder="กรอกเบอร์โทรศัพท์"
                              />
                            ) : (
                              <div className="font-medium transition-colors duration-300"
                                   style={{ color: 'var(--foreground)' }}>
                                {profile.phone || 'ยังไม่ได้ระบุ'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <MapPin className="w-5 h-5 mt-1" style={{ color: 'var(--primary)' }} />
                          <div className="flex-1">
                            <div className="text-sm transition-colors duration-300"
                                 style={{ color: 'var(--muted-foreground)' }}>
                              ที่อยู่
                            </div>
                            {isEditing ? (
                              <textarea
                                value={editForm.address}
                                onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                rows={3}
                                className="w-full px-3 py-2 rounded-lg border transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none"
                                style={{
                                  borderColor: 'var(--border)',
                                  backgroundColor: 'var(--card)',
                                  color: 'var(--foreground)'
                                }}
                                placeholder="กรอกที่อยู่"
                              />
                            ) : (
                              <div className="font-medium transition-colors duration-300"
                                   style={{ color: 'var(--foreground)' }}>
                                {profile.address || 'ยังไม่ได้ระบุ'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="mx-auto h-12 w-12 transition-colors duration-300 mb-4"
                         style={{ color: 'var(--muted-foreground)' }} />
                    <p className="text-sm transition-colors duration-300"
                       style={{ color: 'var(--muted-foreground)' }}>ไม่สามารถโหลดข้อมูลโปรไฟล์ได้</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl h-fit"
                 style={{
                   backgroundColor: 'var(--card)',
                   borderColor: 'var(--border)'
                 }}>
              <div className="p-6 border-b transition-colors duration-300"
                   style={{ borderColor: 'var(--border)' }}>
                <h2 className="text-xl font-semibold transition-colors duration-300"
                     style={{ color: 'var(--foreground)' }}>สถิติการใช้งาน</h2>
              </div>
              
              <div className="p-6">
                {stats ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold transition-colors duration-300"
                           style={{ color: 'var(--primary)' }}>
                        {stats.total_bookings}
                      </div>
                      <div className="text-sm transition-colors duration-300"
                           style={{ color: 'var(--muted-foreground)' }}>
                        การจองทั้งหมด
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 rounded-xl transition-colors duration-300"
                           style={{ backgroundColor: 'var(--accent)' }}>
                        <div className="text-2xl font-bold transition-colors duration-300"
                             style={{ color: 'var(--accent-foreground)' }}>
                          {stats.active_bookings}
                        </div>
                        <div className="text-xs transition-colors duration-300"
                             style={{ color: 'var(--accent-foreground)' }}>
                          กำลังใช้งาน
                        </div>
                      </div>
                      
                      <div className="text-center p-4 rounded-xl transition-colors duration-300"
                           style={{ backgroundColor: 'var(--success)' }}>
                        <div className="text-2xl font-bold transition-colors duration-300"
                             style={{ color: 'var(--success-foreground)' }}>
                          {stats.completed_bookings}
                        </div>
                        <div className="text-xs transition-colors duration-300"
                             style={{ color: 'var(--success-foreground)' }}>
                          เสร็จสิ้น
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center p-4 rounded-xl transition-colors duration-300"
                         style={{ backgroundColor: 'var(--primary)' }}>
                      <div className="text-2xl font-bold transition-colors duration-300"
                           style={{ color: 'var(--primary-foreground)' }}>
                        ฿{stats.total_spent?.toLocaleString() || '0'}
                      </div>
                      <div className="text-xs transition-colors duration-300"
                           style={{ color: 'var(--primary-foreground)' }}>
                        ยอดใช้จ่ายรวม
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto transition-colors duration-300"
                         style={{ borderColor: 'var(--primary)' }}></div>
                    <p className="mt-2 text-sm transition-colors duration-300"
                       style={{ color: 'var(--muted-foreground)' }}>กำลังโหลดสถิติ...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
