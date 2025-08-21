// app/shop/notifications/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Link from 'next/link';
import axios from 'axios';
import { Car, Bell, User, LogOut, Moon, Sun, Check, X, Eye, ArrowLeft, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface BookingNotification {
  id: number;
  rental_id?: number;
  car_id: number;
  customer_id: number;
  start_date: string;
  end_date: string;
  rental_status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  // ข้อมูลเพิ่มเติมจาก join
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  image_url?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  // ข้อมูลการชำระเงิน
  payment_id?: number;
  payment_method?: string;
  payment_date?: string;
  proof_image?: string;
  amount?: number;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading, isShop, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<BookingNotification | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'returns' | 'completed'>('all');
  const [returnRequests, setReturnRequests] = useState<any[]>([]);
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000';

  const fetchNotifications = async () => {
    try {
      setDataLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // ดึงข้อมูลการจองและการชำระเงินที่รอการยืนยัน
      console.log('Fetching notifications data...');
      
      // ใช้ endpoint ที่มีอยู่แล้วในระบบ - เปลี่ยนเป็น bookings/pending
      console.log('Fetching pending bookings from:', `${apiUrl}/shop/bookings/pending`);
      const rentalsResponse = await axios.get(`${apiUrl}/shop/bookings/pending`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Fetching pending payments from:', `${apiUrl}/shop/pending-payments`);
      const paymentsResponse = await axios.get(`${apiUrl}/shop/pending-payments`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // ดึงข้อมูลคำขอคืนรถ
      console.log('Fetching return requests from:', `${apiUrl}/shop/returns`);
      const returnsResponse = await axios.get(`${apiUrl}/shop/returns`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // รวมข้อมูลการจองและการชำระเงิน
      const pendingRentals = rentalsResponse.data.bookings || [];
      const pendingPayments = paymentsResponse.data.payments || [];
      const returns = returnsResponse.data.returnRequests || [];
      
      console.log(`Found ${pendingRentals.length} pending rentals, ${pendingPayments.length} pending payments, and ${returns.length} return requests`);
      
      setReturnRequests(returns);
      
      // แปลงข้อมูลการจองให้เข้ากับรูปแบบ BookingNotification
      const rentalNotifications = pendingRentals.map((rental: {
        id: number;
        car_id: number;
        customer_id: number;
        start_date: string;
        end_date: string;
        rental_status: string;
        payment_status: string;
        total_amount: number;
        created_at: string;
        brand: string;
        model: string;
        year: number;
        license_plate: string;
        image_url?: string;
        customer_name: string;
        customer_email: string;
        customer_phone?: string;
        [key: string]: any; // สำหรับฟิลด์อื่นๆ ที่อาจมี
      }) => ({
        ...rental,
        rental_id: rental.id,
        payment_method: null,
        payment_date: null,
        proof_image: null
      }));
      
      // แปลงข้อมูลการชำระเงินให้เข้ากับรูปแบบ BookingNotification
      const paymentNotifications = pendingPayments.map((payment: any) => ({
        ...payment,
        payment_id: payment.id,
        id: payment.rental_id, // ใช้ rental_id เป็น id หลัก
        payment_method: payment.payment_method,
        payment_date: payment.payment_date,
        proof_image: payment.proof_image
      }));
      
      // รวมข้อมูลทั้งหมด และกำจัดรายการซ้ำ (โดยใช้ id/rental_id เป็นตัวเปรียบเทียบ)
      let allNotifications = [...rentalNotifications];
      
      // เพิ่มข้อมูลการชำระเงินเข้าไปในรายการที่มีอยู่แล้ว หรือเพิ่มรายการใหม่
      paymentNotifications.forEach((payment: {
        id: number;
        payment_id: number;
        payment_method?: string;
        payment_date?: string;
        proof_image?: string;
        payment_status: string;
        [key: string]: any;
      }) => {
        const existingIndex = allNotifications.findIndex(notification => notification.id === payment.id);
        
        if (existingIndex !== -1) {
          // อัปเดตข้อมูลการชำระเงินในรายการที่มีอยู่แล้ว
          allNotifications[existingIndex] = {
            ...allNotifications[existingIndex],
            payment_id: payment.payment_id,
            payment_method: payment.payment_method,
            payment_date: payment.payment_date,
            proof_image: payment.proof_image,
            payment_status: payment.payment_status
          };
        } else {
          // เพิ่มรายการใหม่
          allNotifications.push(payment);
        }
      });
      
      // จัดเรียงตามวันที่สร้างล่าสุด
      allNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setNotifications(allNotifications);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.message || 'Failed to fetch notifications');
    } finally {
      setDataLoading(false);
    }
  };

  const handleApproveBooking = async (approve: boolean) => {
    if (!selectedNotification) return;
    
    try {
      setIsProcessing(true);
      setError(null); // Clear any previous errors
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      let approveEndpoint;
      
      if (activeTab === 'returns') {
        // สำหรับการคืนรถ
        approveEndpoint = `${apiUrl}/shop/rentals/${selectedNotification.id}/approve-return`;
      } else {
        // ใช้ endpoint ที่มีอยู่แล้วแทน
        approveEndpoint = selectedNotification.payment_status === 'pending_verification'
          ? `${apiUrl}/shop/payments/${selectedNotification.id}/verify` // สำหรับยืนยันการชำระเงิน
          : `${apiUrl}/shop/rentals/${selectedNotification.id}/approve`; // สำหรับอนุมัติการจอง
      }
      
      console.log(`Approving notification using endpoint: ${approveEndpoint}`);
      
      await axios.post(
        approveEndpoint,
        { approve },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // อัปเดตรายการการแจ้งเตือน
      if (activeTab === 'returns') {
        const updatedReturns = returnRequests.filter(request => request.id !== selectedNotification.id);
        setReturnRequests(updatedReturns);
      } else {
        const updatedNotifications = notifications.filter(notification => notification.id !== selectedNotification.id);
        setNotifications(updatedNotifications);
      }
      
      const action = activeTab === 'returns' ? 'คืนรถ' : 'จอง';
      setSuccessMessage(approve ? `การ${action}ได้รับการอนุมัติเรียบร้อยแล้ว!` : `การ${action}ถูกปฏิเสธเรียบร้อยแล้ว!`);
      setShowDetailModal(false);
      
      // ซ่อนข้อความแจ้งเตือนหลังจาก 3 วินาที
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err: any) {
      console.error('Error processing notification:', err);
      setError(err.response?.data?.message || 'Failed to process notification');
      
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setIsProcessing(false);
      // Always reset selectedNotification to avoid stuck modal
      setSelectedNotification(null);
    }
  };

  const openImagePreview = (imageUrl: string) => {
    setPreviewImage(`${baseUrl}${imageUrl}`);
    setShowPreviewModal(true);
  };

  // ฟิลเตอร์การแจ้งเตือนตามแท็บที่เลือก
  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'pending':
        return notifications.filter(notification => 
          notification.rental_status === 'pending' || 
          notification.payment_status === 'pending_verification'
        );
      case 'returns':
        return returnRequests;
      case 'completed':
        return notifications.filter(notification => 
          notification.rental_status === 'confirmed' || 
          notification.rental_status === 'ongoing' ||
          notification.rental_status === 'completed'
        );
      default:
        return [...notifications, ...returnRequests];
    }
  };

  // แปลงสถานะเป็นภาษาไทย
  const getRentalStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'รออนุมัติ';
      case 'confirmed': return 'อนุมัติแล้ว';
      case 'ongoing': return 'กำลังเช่า';
      case 'completed': return 'เสร็จสิ้น';
      case 'cancelled': return 'ยกเลิก';
      default: return status;
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'รอชำระเงิน';
      case 'pending_verification': return 'รอยืนยันการชำระเงิน';
      case 'paid': return 'ชำระเงินแล้ว';
      case 'rejected': return 'การชำระเงินถูกปฏิเสธ';
      case 'refunded': return 'คืนเงินแล้ว';
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
      case 'pending_verification':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'ongoing':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'paid':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'border border-gray-200';
    }
  };

  // ฟอร์แมตวันที่
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ป้องกันปัญหา Hydration Error
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ตรวจสอบการเข้าสู่ระบบและบทบาท
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (!isShop()) {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, isShop, router]);

  // โหลดข้อมูลการแจ้งเตือน
  useEffect(() => {
    if (user && isShop() && isMounted) {
      fetchNotifications();
      
      // ตั้ง interval เพื่อดึงข้อมูลทุก 30 วินาที (สำหรับการแจ้งเตือนแบบ real-time)
      const interval = setInterval(fetchNotifications, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user, isMounted]);

  // Handle Escape key to close modals
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showPreviewModal) {
          setShowPreviewModal(false);
        } else if (showDetailModal) {
          setShowDetailModal(false);
        }
      }
    };

    if (showDetailModal || showPreviewModal) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }
  }, [showDetailModal, showPreviewModal]);

  // ถ้ายังไม่ mount ให้แสดงหน้าว่างไว้ก่อน เพื่อป้องกัน hydration error
  if (!isMounted) {
    return <div className="min-h-screen flex justify-center items-center">กำลังโหลด...</div>;
  }

  // แสดงหน้าโหลดขณะกำลังตรวจสอบสถานะการล็อกอิน
  if (loading || !user) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <p className="text-lg">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  const filteredNotifications = getFilteredNotifications();
  const pendingCount = notifications.filter(notification => 
    notification.rental_status === 'pending' || 
    notification.payment_status === 'pending_verification'
  ).length;

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
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--muted)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  แดชบอร์ด
                </Link>
                <Link
                  href="/shop/dashboard"
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    color: 'var(--muted-foreground)',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--muted)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  จัดการรถยนต์
                </Link>
                <Link
                  href="/shop/notifications"
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative"
                  style={{
                    color: 'var(--primary)',
                    backgroundColor: 'var(--primary-foreground)'
                  }}
                >
                  <Bell className="w-4 h-4 inline mr-2" />
                  การแจ้งเตือน
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold">
                      {pendingCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/shop/profile"
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    color: 'var(--muted-foreground)',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--muted)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <User className="w-4 h-4 inline mr-2" />
                  โปรไฟล์
                </Link>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold leading-tight transition-colors duration-300"
                style={{ color: 'var(--foreground)' }}>
              การแจ้งเตือน
            </h1>
            <div className="flex items-center space-x-2">
              <Bell className="w-6 h-6" style={{ color: 'var(--primary)' }} />
              <span className="text-sm font-medium transition-colors duration-300"
                    style={{ color: 'var(--muted-foreground)' }}>
                {notifications.length} รายการ
              </span>
            </div>
          </div>
          
          {/* แสดงข้อความแจ้งเตือน */}
          {error && (
            <div className="mb-6 p-4 rounded-xl border transition-colors duration-300 flex items-center space-x-3"
                 style={{
                   backgroundColor: 'var(--destructive)',
                   borderColor: 'var(--destructive)',
                   color: 'white'
                 }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {/* แสดงข้อความสำเร็จ */}
          {successMessage && (
            <div className="mb-6 p-4 rounded-xl border transition-colors duration-300 flex items-center space-x-3"
                 style={{
                   backgroundColor: 'rgba(34, 197, 94, 0.1)',
                   borderColor: 'rgba(34, 197, 94, 0.3)',
                   color: 'rgb(22, 163, 74)'
                 }}>
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
          
          {/* แท็บสำหรับเลือกดูประเภทการแจ้งเตือน */}
          <div className="mb-6 transition-colors duration-300" 
               style={{ borderBottom: `1px solid var(--border)` }}>
            <nav className="-mb-px flex space-x-6">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === 'all'
                    ? 'border-b-2 text-white shadow-lg transform scale-105'
                    : 'border-b-2 border-transparent hover:scale-105'
                }`}
                style={{
                  backgroundColor: activeTab === 'all' ? 'var(--primary)' : 'transparent',
                  borderBottomColor: activeTab === 'all' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'all' ? 'white' : 'var(--muted-foreground)'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'all') {
                    e.target.style.color = 'var(--foreground)';
                    e.target.style.backgroundColor = 'var(--muted)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'all') {
                    e.target.style.color = 'var(--muted-foreground)';
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
                title="แสดงการแจ้งเตือนทั้งหมด"
                aria-label="แสดงการแจ้งเตือนทั้งหมด"
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-3 rounded-lg font-medium transition-all duration-300 flex items-center ${
                  activeTab === 'pending'
                    ? 'border-b-2 text-white shadow-lg transform scale-105'
                    : 'border-b-2 border-transparent hover:scale-105'
                }`}
                style={{
                  backgroundColor: activeTab === 'pending' ? 'var(--primary)' : 'transparent',
                  borderBottomColor: activeTab === 'pending' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'pending' ? 'white' : 'var(--muted-foreground)'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'pending') {
                    e.target.style.color = 'var(--foreground)';
                    e.target.style.backgroundColor = 'var(--muted)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'pending') {
                    e.target.style.color = 'var(--muted-foreground)';
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
                title="แสดงเฉพาะรายการที่รออนุมัติหรือรอการยืนยัน"
                aria-label="แสดงเฉพาะรายการที่รออนุมัติหรือรอการยืนยัน"
              >
                รออนุมัติ
                {pendingCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-lg">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('returns')}
                className={`py-4 px-3 rounded-lg font-medium transition-all duration-300 flex items-center ${
                  activeTab === 'returns'
                    ? 'border-b-2 text-white shadow-lg transform scale-105'
                    : 'border-b-2 border-transparent hover:scale-105'
                }`}
                style={{
                  backgroundColor: activeTab === 'returns' ? 'var(--primary)' : 'transparent',
                  borderBottomColor: activeTab === 'returns' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'returns' ? 'white' : 'var(--muted-foreground)'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'returns') {
                    e.target.style.color = 'var(--foreground)';
                    e.target.style.backgroundColor = 'var(--muted)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'returns') {
                    e.target.style.color = 'var(--muted-foreground)';
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
                title="แสดงคำขอคืนรถ"
                aria-label="แสดงคำขอคืนรถ"
              >
                คำขอคืนรถ
                {returnRequests.length > 0 && (
                  <span className="ml-2 bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-lg">
                    {returnRequests.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`py-4 px-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === 'completed'
                    ? 'border-b-2 text-white shadow-lg transform scale-105'
                    : 'border-b-2 border-transparent hover:scale-105'
                }`}
                style={{
                  backgroundColor: activeTab === 'completed' ? 'var(--primary)' : 'transparent',
                  borderBottomColor: activeTab === 'completed' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'completed' ? 'white' : 'var(--muted-foreground)'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'completed') {
                    e.target.style.color = 'var(--foreground)';
                    e.target.style.backgroundColor = 'var(--muted)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'completed') {
                    e.target.style.color = 'var(--muted-foreground)';
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
                title="แสดงเฉพาะรายการที่ดำเนินการเสร็จสิ้นแล้ว"
                aria-label="แสดงเฉพาะรายการที่ดำเนินการเสร็จสิ้นแล้ว"
              >
                ดำเนินการแล้ว
              </button>
            </nav>
          </div>
          
          {dataLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-transparent border-t-current transition-colors duration-300"
                   style={{ color: 'var(--primary)' }}>
              </div>
              <p className="mt-4 text-lg font-medium transition-colors duration-300"
                 style={{ color: 'var(--muted-foreground)' }}>
                กำลังโหลดข้อมูล...
              </p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="rounded-xl shadow-lg overflow-hidden transition-colors duration-300"
                 style={{
                   backgroundColor: 'var(--card)',
                   borderColor: 'var(--border)'
                 }}>
              <ul className="divide-y transition-colors duration-300"
                  style={{ borderColor: 'var(--border)' }}>
                {filteredNotifications.map((notification) => (
                  <li key={`${activeTab === 'returns' ? 'return' : 'booking'}-${notification.id}`} 
                      className="px-6 py-6 transition-colors duration-300 hover:bg-opacity-50"
                      style={{ backgroundColor: 'transparent' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--muted)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 h-20 w-20 rounded-xl overflow-hidden shadow-md transition-colors duration-300"
                             style={{ backgroundColor: 'var(--muted)' }}>
                          {notification.image_url ? (
                            <img
                              src={`${baseUrl}${notification.image_url}`}
                              alt={`${notification.brand} ${notification.model}`}
                              className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center transition-colors duration-300"
                                 style={{ color: 'var(--muted-foreground)' }}>
                              <Car className="h-10 w-10" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-lg font-bold transition-colors duration-300"
                               style={{ color: 'var(--foreground)' }}>
                            {notification.brand} {notification.model} ({notification.year})
                          </div>
                          <div className="text-sm font-medium transition-colors duration-300"
                               style={{ color: 'var(--muted-foreground)' }}>
                            ทะเบียน: {notification.license_plate}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {activeTab === 'returns' ? (
                            <span className="px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm transition-colors duration-300"
                                  style={{
                                    backgroundColor: 'rgba(251, 146, 60, 0.1)',
                                    color: 'rgb(234, 88, 12)',
                                    border: '1px solid rgba(251, 146, 60, 0.3)'
                                  }}>
                              <Clock className="w-4 h-4 inline mr-1" />
                              ขอคืนรถ
                            </span>
                          ) : (
                            <>
                              <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm transition-colors duration-300 ${getStatusClass(notification.rental_status)}`}>
                                {getRentalStatusText(notification.rental_status)}
                              </span>
                              <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm transition-colors duration-300 ${getStatusClass(notification.payment_status)}`}>
                                {getPaymentStatusText(notification.payment_status)}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium transition-colors duration-300"
                               style={{ color: 'var(--foreground)' }}>
                            <User className="w-4 h-4 inline mr-2" style={{ color: 'var(--primary)' }} />
                            ลูกค้า: {notification.customer_name}
                          </div>
                          <div className="text-sm transition-colors duration-300"
                               style={{ color: 'var(--muted-foreground)' }}>
                            <Clock className="w-4 h-4 inline mr-2" style={{ color: 'var(--primary)' }} />
                            ระยะเวลาเช่า: {new Date(notification.start_date).toLocaleDateString('th-TH')} - {new Date(notification.end_date).toLocaleDateString('th-TH')}
                          </div>
                          {notification.payment_date && (
                            <div className="text-sm transition-colors duration-300"
                                 style={{ color: 'var(--muted-foreground)' }}>
                              <CheckCircle className="w-4 h-4 inline mr-2" style={{ color: 'var(--primary)' }} />
                              วันที่ชำระเงิน: {formatDate(notification.payment_date)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                          {notification.proof_image && (
                            <button
                              onClick={() => openImagePreview(notification.proof_image!)}
                              className="px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                              style={{
                                backgroundColor: 'var(--card)',
                                color: 'var(--foreground)',
                                border: `1px solid var(--border)`
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = 'var(--muted)';
                                e.target.style.transform = 'scale(1.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'var(--card)';
                                e.target.style.transform = 'scale(1)';
                              }}
                              title="ดูหลักฐานการชำระเงิน"
                              aria-label="ดูหลักฐานการชำระเงิน"
                            >
                              <Eye className="w-4 h-4" />
                              <span>ดูหลักฐาน</span>
                            </button>
                          )}
                          <div className="text-xl font-bold"
                               style={{ color: 'rgb(34, 197, 94)' }}>
                            ฿{notification.total_amount.toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedNotification(notification);
                            setShowDetailModal(true);
                          }}
                          className="px-6 py-3 rounded-lg text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                          style={{
                            backgroundColor: activeTab === 'returns' ? 'rgb(251, 146, 60)' : 'var(--primary)'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = activeTab === 'returns' ? 'rgb(234, 88, 12)' : 'var(--primary)';
                            e.target.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = activeTab === 'returns' ? 'rgb(251, 146, 60)' : 'var(--primary)';
                            e.target.style.transform = 'scale(1)';
                          }}
                          title={activeTab === 'returns' ? 'อนุมัติการคืนรถ' : 'ตรวจสอบและอนุมัติการจอง'}
                          aria-label={activeTab === 'returns' ? 'อนุมัติการคืนรถ' : 'ตรวจสอบและอนุมัติการจอง'}
                        >
                          {activeTab === 'returns' ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>อนุมัติคืนรถ</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              <span>ตรวจสอบ</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-xl shadow-lg p-8 text-center transition-colors duration-300"
                 style={{ backgroundColor: 'var(--card)' }}>
              <div className="mx-auto h-20 w-20 rounded-full flex items-center justify-center transition-colors duration-300"
                   style={{ backgroundColor: 'var(--muted)' }}>
                <Bell className="h-10 w-10" style={{ color: 'var(--muted-foreground)' }} />
              </div>
              <h3 className="mt-4 text-xl font-bold transition-colors duration-300"
                  style={{ color: 'var(--foreground)' }}>
                ไม่มีการแจ้งเตือน
              </h3>
              <p className="mt-2 text-base transition-colors duration-300"
                 style={{ color: 'var(--muted-foreground)' }}>
                ขณะนี้ไม่มีการแจ้งเตือนใดๆ
              </p>
            </div>
          )}
          
          {/* Modal แสดงรายละเอียดและอนุมัติการจอง */}
          {showDetailModal && selectedNotification && (
            <div className="fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm" aria-labelledby="modal-title" role="dialog" aria-modal="true">
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div 
                  className="fixed inset-0 transition-opacity" 
                  aria-hidden="true"
                  onClick={() => setShowDetailModal(false)}
                >
                  <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                </div>
                
                {/* This element is to trick the browser into centering the modal contents. */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                
                {/* Modal panel, show/hide based on modal state. */}
                <div 
                  className="inline-block align-bottom rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-10"
                  style={{ backgroundColor: 'var(--card)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-6 pt-6 pb-4 sm:p-8 sm:pb-6" style={{ backgroundColor: 'var(--card)' }}>
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-xl sm:mx-0 sm:h-12 sm:w-12 transition-colors duration-300"
                           style={{ backgroundColor: 'var(--primary)' }}>
                        <CheckCircle className="h-7 w-7 text-white" />
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-xl leading-6 font-bold transition-colors duration-300" 
                            style={{ color: 'var(--foreground)' }}
                            id="modal-title">
                          {activeTab === 'returns' ? 'อนุมัติการคืนรถ' : 'ตรวจสอบและอนุมัติการจอง'}
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm transition-colors duration-300"
                             style={{ color: 'var(--muted-foreground)' }}>
                            {activeTab === 'returns' 
                              ? 'ตรวจสอบคำขอคืนรถจากลูกค้า' 
                              : 'ตรวจสอบรายละเอียดการจองและรายละเอียดการชำระเงิน'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* ข้อมูลการจอง */}
                    <div className="mt-6">
                      <h4 className="text-lg font-bold mb-3 transition-colors duration-300"
                          style={{ color: 'var(--foreground)' }}>
                        ข้อมูลการจอง
                      </h4>
                      <div className="rounded-xl p-4 mb-4 transition-colors duration-300"
                           style={{ backgroundColor: 'var(--muted)' }}>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium transition-colors duration-300"
                                  style={{ color: 'var(--muted-foreground)' }}>
                              ลูกค้า:
                            </span>
                            <span className="font-semibold transition-colors duration-300"
                                  style={{ color: 'var(--foreground)' }}>
                              {selectedNotification.customer_name}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium transition-colors duration-300"
                                  style={{ color: 'var(--muted-foreground)' }}>
                              อีเมล:
                            </span>
                            <span className="font-semibold transition-colors duration-300"
                                  style={{ color: 'var(--foreground)' }}>
                              {selectedNotification.customer_email}
                            </span>
                          </div>
                          {selectedNotification.customer_phone && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium transition-colors duration-300"
                                    style={{ color: 'var(--muted-foreground)' }}>
                                เบอร์โทรศัพท์:
                              </span>
                              <span className="font-semibold transition-colors duration-300"
                                    style={{ color: 'var(--foreground)' }}>
                                {selectedNotification.customer_phone}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium transition-colors duration-300"
                                  style={{ color: 'var(--muted-foreground)' }}>
                              รถยนต์:
                            </span>
                            <span className="font-semibold transition-colors duration-300"
                                  style={{ color: 'var(--foreground)' }}>
                              {selectedNotification.brand} {selectedNotification.model} ({selectedNotification.year})
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium transition-colors duration-300"
                                  style={{ color: 'var(--muted-foreground)' }}>
                              ทะเบียน:
                            </span>
                            <span className="font-semibold transition-colors duration-300"
                                  style={{ color: 'var(--foreground)' }}>
                              {selectedNotification.license_plate}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium transition-colors duration-300"
                                  style={{ color: 'var(--muted-foreground)' }}>
                              วันที่เริ่มต้น:
                            </span>
                            <span className="font-semibold transition-colors duration-300"
                                  style={{ color: 'var(--foreground)' }}>
                              {new Date(selectedNotification.start_date).toLocaleDateString('th-TH')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium transition-colors duration-300"
                                  style={{ color: 'var(--muted-foreground)' }}>
                              วันที่สิ้นสุด:
                            </span>
                            <span className="font-semibold transition-colors duration-300"
                                  style={{ color: 'var(--foreground)' }}>
                              {new Date(selectedNotification.end_date).toLocaleDateString('th-TH')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t"
                               style={{ borderColor: 'var(--border)' }}>
                            <span className="text-sm font-medium transition-colors duration-300"
                                  style={{ color: 'var(--muted-foreground)' }}>
                              ราคารวม:
                            </span>
                            <span className="text-xl font-bold text-green-600">
                              ฿{selectedNotification.total_amount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* ข้อมูลการชำระเงิน */}
                      {(selectedNotification.payment_status === 'pending_verification' || selectedNotification.payment_status === 'paid') && (
                        <>
                          <h4 className="text-lg font-bold mb-3 transition-colors duration-300"
                              style={{ color: 'var(--foreground)' }}>
                            ข้อมูลการชำระเงิน
                          </h4>
                          <div className="rounded-xl p-4 mb-4 transition-colors duration-300"
                               style={{ backgroundColor: 'var(--muted)' }}>
                            <div className="space-y-3">
                              {selectedNotification.payment_date && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium transition-colors duration-300"
                                        style={{ color: 'var(--muted-foreground)' }}>
                                    วันที่ชำระเงิน:
                                  </span>
                                  <span className="font-semibold transition-colors duration-300"
                                        style={{ color: 'var(--foreground)' }}>
                                    {formatDate(selectedNotification.payment_date)}
                                  </span>
                                </div>
                              )}
                              {selectedNotification.payment_method && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium transition-colors duration-300"
                                        style={{ color: 'var(--muted-foreground)' }}>
                                    วิธีการชำระเงิน:
                                  </span>
                                  <span className="font-semibold transition-colors duration-300"
                                        style={{ color: 'var(--foreground)' }}>
                                    {selectedNotification.payment_method === 'promptpay' ? 'พร้อมเพย์' : 
                                     selectedNotification.payment_method === 'bank_transfer' ? 'โอนเงินผ่านธนาคาร' : 
                                     selectedNotification.payment_method}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium transition-colors duration-300"
                                      style={{ color: 'var(--muted-foreground)' }}>
                                  จำนวนเงิน:
                                </span>
                                <span className="text-lg font-bold text-green-600">
                                  ฿{(selectedNotification.amount || selectedNotification.total_amount).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium transition-colors duration-300"
                                      style={{ color: 'var(--muted-foreground)' }}>
                                  สถานะการชำระเงิน:
                                </span>
                                <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${getStatusClass(selectedNotification.payment_status)}`}>
                                  {getPaymentStatusText(selectedNotification.payment_status)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      
                      {/* หลักฐานการชำระเงิน */}
                      {selectedNotification.proof_image && (
                        <div className="mb-6">
                          <h4 className="text-lg font-bold mb-3 transition-colors duration-300"
                              style={{ color: 'var(--foreground)' }}>
                            หลักฐานการชำระเงิน
                          </h4>
                          <div className="rounded-xl overflow-hidden shadow-md transition-colors duration-300"
                               style={{ borderColor: 'var(--border)' }}>
                            <img
                              src={`${baseUrl}${selectedNotification.proof_image}`}
                              alt="หลักฐานการชำระเงิน"
                              className="w-full h-auto object-contain transition-transform duration-300 hover:scale-105"
                              style={{ maxHeight: '250px' }}
                            />
                          </div>
                          <button
                            className="mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                            style={{
                              color: 'var(--primary)',
                              backgroundColor: 'var(--muted)'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = 'var(--primary)';
                              e.target.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'var(--muted)';
                              e.target.style.color = 'var(--primary)';
                            }}
                            onClick={() => openImagePreview(selectedNotification.proof_image!)}
                            title="ดูภาพขนาดใหญ่"
                            aria-label="ดูหลักฐานการชำระเงินในขนาดใหญ่"
                          >
                            <Eye className="w-4 h-4" />
                            <span>ดูภาพขนาดใหญ่</span>
                          </button>
                        </div>
                      )}
                      
                      <div className="mt-6 p-4 rounded-xl transition-colors duration-300"
                           style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm font-medium transition-colors duration-300"
                             style={{ color: 'var(--foreground)' }}>
                            {activeTab === 'returns' 
                              ? 'หากอนุมัติการคืนรถ รถจะกลับไปเป็นสถานะพร้อมเช่า หากปฏิเสธ รถยังคงเป็นสถานะกำลังเช่า' 
                              : selectedNotification.rental_status === 'pending' 
                                ? 'หากอนุมัติการจอง ลูกค้าจะสามารถเช่ารถได้ตามกำหนดการที่ระบุ หากปฏิเสธ ลูกค้าจะได้รับการแจ้งว่าการจองถูกปฏิเสธ' 
                                : ''
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4 sm:px-8 sm:flex sm:flex-row-reverse space-y-3 sm:space-y-0 sm:space-x-3 sm:space-x-reverse transition-colors duration-300"
                       style={{ backgroundColor: 'var(--muted)' }}>
                    {(activeTab === 'returns' || selectedNotification.rental_status === 'pending' || selectedNotification.payment_status === 'pending_verification') && (
                      <>
                        <button
                          type="button"
                          className="w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
                          style={{ backgroundColor: 'rgb(34, 197, 94)' }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgb(22, 163, 74)';
                            e.target.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'rgb(34, 197, 94)';
                            e.target.style.transform = 'scale(1)';
                          }}
                          onClick={() => handleApproveBooking(true)}
                          disabled={isProcessing}
                          title={activeTab === 'returns' ? 'อนุมัติการคืนรถ' : 'อนุมัติการจองและการชำระเงิน'}
                          aria-label={activeTab === 'returns' ? 'อนุมัติการคืนรถ' : 'อนุมัติการจองและการชำระเงิน'}
                        >
                          {isProcessing ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                              <span>กำลังดำเนินการ...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-5 h-5" />
                              <span>อนุมัติ</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
                          style={{ backgroundColor: 'var(--destructive)' }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgb(185, 28, 28)';
                            e.target.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'var(--destructive)';
                            e.target.style.transform = 'scale(1)';
                          }}
                          onClick={() => handleApproveBooking(false)}
                          disabled={isProcessing}
                          title={activeTab === 'returns' ? 'ปฏิเสธการคืนรถ' : 'ปฏิเสธการจองและการชำระเงิน'}
                          aria-label={activeTab === 'returns' ? 'ปฏิเสธการคืนรถ' : 'ปฏิเสธการจองและการชำระเงิน'}
                        >
                          <X className="w-5 h-5" />
                          <span>ปฏิเสธ</span>
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="w-full sm:w-auto px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
                      style={{
                        backgroundColor: 'var(--card)',
                        color: 'var(--foreground)',
                        border: `1px solid var(--border)`
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'var(--muted)';
                        e.target.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'var(--card)';
                        e.target.style.transform = 'scale(1)';
                      }}
                      onClick={() => setShowDetailModal(false)}
                      disabled={isProcessing}
                      title="ปิด"
                      aria-label="ปิดหน้าต่างนี้"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span>{activeTab === 'returns' || selectedNotification.rental_status === 'pending' || selectedNotification.payment_status === 'pending_verification' ? 'ยกเลิก' : 'ปิด'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Modal แสดงรูปภาพขนาดใหญ่ */}
          {showPreviewModal && previewImage && (
            <div className="fixed inset-0 z-60 overflow-y-auto backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="แสดงรูปภาพขนาดใหญ่">
              <div className="flex items-center justify-center min-h-screen p-4">
                {/* Background overlay */}
                <div 
                  className="fixed inset-0 transition-opacity"
                  aria-hidden="true"
                  onClick={() => setShowPreviewModal(false)}
                >
                  <div className="absolute inset-0 bg-black bg-opacity-75"></div>
                </div>
                
                {/* Modal panel */}
                <div 
                  className="relative rounded-2xl overflow-hidden max-w-4xl max-h-[95vh] z-10 shadow-2xl transition-colors duration-300"
                  style={{ backgroundColor: 'var(--card)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="absolute top-4 right-4 z-20">
                    <button
                      onClick={() => setShowPreviewModal(false)}
                      className="p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
                      style={{
                        backgroundColor: 'var(--card)',
                        color: 'var(--foreground)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'var(--destructive)';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'var(--card)';
                        e.target.style.color = 'var(--foreground)';
                      }}
                      title="ปิด"
                      aria-label="ปิดหน้าต่างแสดงรูปภาพ"
                    >
                      <X className="h-6 w-6" />
                      <span className="sr-only">ปิด</span>
                    </button>
                  </div>
                  <div className="p-2">
                    <img
                      src={previewImage}
                      alt="หลักฐานการชำระเงิน"
                      className="max-w-full max-h-[90vh] object-contain rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}