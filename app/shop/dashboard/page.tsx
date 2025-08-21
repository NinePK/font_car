// app/shop/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Link from 'next/link';
import axios from 'axios';
import { Moon, Sun, Car, Bell, Plus, LogOut, User } from 'lucide-react';
import AddCarModal from '../../components/AddCarModal';
import ImageUploadModal from '../../components/ImageUploadModal';
import EditCarModal from '../../components/EditCarModal';
import CarStatusModal from '../../components/CarStatusModal';
import DeleteCarModal from '../../components/DeleteCarModal';

interface Car {
  id: number;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  car_type: string;
  transmission: string;
  fuel_type: string;
  seats: number;
  color: string;
  daily_rate: number;
  status: 'available' | 'rented' | 'maintenance' | 'deleted';
  description?: string;
  image_url?: string;
  images?: { id: number; image_url: string; is_primary: boolean }[];
}

export default function ShopDashboard() {
  const router = useRouter();
  const { user, loading, isShop, logout, isCustomer } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [cars, setCars] = useState<Car[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingNotificationsCount, setPendingNotificationsCount] = useState(0);
  
  // State สำหรับ Modal
  const [isAddCarModalOpen, setIsAddCarModalOpen] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [isEditCarModalOpen, setIsEditCarModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const fetchCars = async () => {
    try {
      setDataLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // กำหนด URL API ให้ถูกต้อง
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      // แก้ไข path ให้ถูกต้อง - ใช้ endpoint ที่จะดึงรถของร้านที่กำลังล็อกอิน
      const response = await axios.get(`${apiUrl}/cars/shop/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setCars(response.data.cars || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching cars:', err);
      setError(err.response?.data?.message || 'Failed to fetch cars');
    } finally {
      setDataLoading(false);
    }
  };

  // ดึงจำนวนการแจ้งเตือนที่รอดำเนินการ
  const fetchPendingNotificationsCount = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return;
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      // เรียกใช้ API endpoint ใหม่เพื่อดึงข้อมูลการแจ้งเตือน
      const response = await axios.get(`${apiUrl}/shop/bookings/pending`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // ตั้งค่าจำนวนการแจ้งเตือนที่รอดำเนินการ
      if (response.data.bookings) {
        setPendingNotificationsCount(response.data.bookings.length);
      }
      
    } catch (err) {
      console.error('Error fetching notifications count:', err);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // เรียกข้อมูลรถและจำนวนการแจ้งเตือนเมื่อ component ถูกโหลด
  useEffect(() => {
    if (user && isShop()) {
      fetchCars();
      fetchPendingNotificationsCount();
      
      // ตั้งเวลาดึงข้อมูลการแจ้งเตือนทุก 1 นาที
      const interval = setInterval(fetchPendingNotificationsCount, 60000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  // แก้ไขลอจิกการเปลี่ยนเส้นทางให้ถูกต้อง
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // ถ้ายังไม่ได้เข้าสู่ระบบ ให้ redirect ไปหน้า login
        router.replace('/login');
      } else if (!isShop()) {
        // ถ้าไม่ใช่ร้านเช่ารถ แต่เป็นลูกค้า ให้เปลี่ยนเส้นทางไปหน้า customer dashboard
        if (isCustomer()) {
          console.log("Redirecting to customer dashboard because user is a customer");
          router.replace('/customer/dashboard');
        } else {
          router.replace('/');
        }
      }
    }
  }, [user, loading, isShop, isCustomer, router]);

  // ถ้ายังไม่ mount ให้แสดงหน้าว่างไว้ก่อน เพื่อป้องกัน hydration error
  if (!isMounted) {
    return <div className="min-h-screen flex justify-center items-center">กำลังโหลด...</div>;
  }

  // จัดการ Modal
  const handleAddCar = () => {
    setIsAddCarModalOpen(true);
  };

  const handleAddCarSuccess = (carId: number) => {
    setIsAddCarModalOpen(false);
    setSelectedCarId(carId);
    setIsImageUploadModalOpen(true);
  };

  const handleImageUploadSuccess = () => {
    fetchCars(); // ดึงข้อมูลรถใหม่หลังจากอัปโหลดรูปภาพ
  };

  const handleEditCar = (car: Car) => {
    setSelectedCar(car);
    setIsEditCarModalOpen(true);
  };

  const handleEditCarSuccess = () => {
    fetchCars(); // ดึงข้อมูลรถใหม่หลังจากแก้ไข
  };

  const handleManageStatus = (car: Car) => {
    setSelectedCar(car);
    setIsStatusModalOpen(true);
  };

  const handleStatusSuccess = () => {
    fetchCars(); // ดึงข้อมูลรถใหม่หลังจากเปลี่ยนสถานะ
  };

  const handleDeleteCar = (car: Car) => {
    setSelectedCar(car);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSuccess = () => {
    fetchCars(); // ดึงข้อมูลรถใหม่หลังจากลบ
  };

  const getCarTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      'sedan': 'รถเก๋ง',
      'suv': 'รถ SUV',
      'hatchback': 'รถแฮทช์แบ็ค',
      'pickup': 'รถกระบะ',
      'van': 'รถตู้',
      'luxury': 'รถหรู'
    };
    return typeMap[type] || type;
  };

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

  // ถ้าไม่ใช่ร้านเช่ารถ แต่เป็นลูกค้า ให้ไม่แสดงเนื้อหาของร้าน
  if (!isShop()) {
    return null; // ไม่แสดงเนื้อหาเพื่อป้องกันการกระพริบระหว่างการเปลี่ยนเส้นทาง
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
                     style={{ color: 'var(--primary)' }}>ระบบจัดการเช่ารถ</h1>
              </div>
              
              {/* Navigation Links */}
              <div className="hidden md:flex space-x-6">
                <Link
                  href="/shop/dashboard"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)'
                  }}
                >
                  <Car className="w-4 h-4" />
                  <span>แดชบอร์ด</span>
                </Link>
                <Link
                  href="/shop/notifications"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 relative"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-foreground)'
                  }}
                >
                  <Bell className="w-4 h-4" />
                  <span>การแจ้งเตือน</span>
                  {pendingNotificationsCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300"
                          style={{
                            backgroundColor: 'var(--destructive)',
                            color: 'var(--destructive-foreground)'
                          }}>
                      {pendingNotificationsCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/shop/profile"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    color: 'var(--muted-foreground)',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--muted)'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
                >
                  <User className="w-4 h-4" />
                  <span>โปรไฟล์</span>
                </Link>
              </div>
            </div>

            {/* User Menu & Actions */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <span className="text-sm transition-colors duration-300"
                      style={{ color: 'var(--muted-foreground)' }}>
                  สวัสดี, <span className="font-medium transition-colors duration-300"
                               style={{ color: 'var(--primary)' }}>{user.shop_name || user.username}</span>
                </span>
              </div>
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-foreground)'
                }}
                aria-label={`เปลี่ยนธีม (ปัจจุบัน: ${theme === 'light' ? 'สว่าง' : 'มืด'})`}
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </button>
              
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{
                  backgroundColor: 'var(--destructive)',
                  color: 'var(--destructive-foreground)'
                }}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-6">
        <main>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Welcome Card */}
            <div className="bg-white overflow-hidden shadow-md rounded-lg mb-6">
              <div className="px-6 py-5 flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
                  <p className="text-gray-600 mt-1">ยินดีต้อนรับ, {user.shop_name || user.username}</p>
                </div>
                <button 
                  onClick={handleAddCar}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors shadow-sm flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  เพิ่มรถใหม่
                </button>
              </div>
            </div>

            {/* Notification Card - แสดงเมื่อมีการแจ้งเตือนที่รอดำเนินการ */}
            {pendingNotificationsCount > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-md shadow-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      คุณมี {pendingNotificationsCount} การแจ้งเตือนที่รอดำเนินการ
                      <Link 
                        href="/shop/notifications" 
                        className="font-medium text-yellow-700 underline ml-1 hover:text-yellow-600"
                      >
                        ดูเดี๋ยวนี้
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Car Grid Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">รถยนต์ของคุณ</h2>
              <div className="text-sm text-gray-500">
                {cars.length > 0 && `แสดง ${cars.length} รายการ`}
              </div>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm" role="alert">
                <p className="font-medium">เกิดข้อผิดพลาด</p>
                <p>{error}</p>
              </div>
            )}
            
            {/* Cars Grid */}
            {dataLoading ? (
              <div className="text-center py-12">
                <svg className="animate-spin h-10 w-10 text-red-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
              </div>
            ) : cars.length === 0 ? (
              <div className="bg-white overflow-hidden shadow-md rounded-lg py-8">
                <div className="text-center">
                  <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <p className="mt-4 text-gray-600">คุณยังไม่มีรถยนต์ในระบบ</p>
                  <button 
                    onClick={handleAddCar}
                    className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    เพิ่มรถคันแรก
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {cars.filter(car => car.status !== 'deleted').map((car) => (
                  <div key={car.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="h-48 bg-gray-200 relative">
                      {car.image_url ? (
                        <img 
                          src={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'}${car.image_url}`} 
                          alt={`${car.brand} ${car.model}`} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex justify-center items-center h-full bg-gray-200 text-gray-400">
                          <svg className="h-16 w-16 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className={`absolute top-2 right-2 px-3 py-1 text-xs font-semibold rounded-full ${
                        car.status === 'available' ? 'bg-green-500 text-white' :
                        car.status === 'rented' ? 'bg-blue-500 text-white' :
                        'bg-yellow-500 text-white'
                      }`}>
                        {car.status === 'available' ? 'ว่าง' :
                         car.status === 'rented' ? 'ถูกเช่า' : 
                         car.status === 'maintenance' ? 'ซ่อมบำรุง' : 'ไม่ทราบสถานะ'}
                      </div>
                      
                      {/* Price Tag */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <p className="text-white font-bold">฿{car.daily_rate.toLocaleString()}<span className="text-sm font-normal">/วัน</span></p>
                      </div>

                      {/* Delete Button - ปุ่มลบมุมซ้ายบน */}
                      <button
                        onClick={() => handleDeleteCar(car)}
                        className="absolute top-2 left-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-sm"
                        title="ลบรถยนต์"
                        aria-label="ลบรถยนต์นี้ออกจากระบบ"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="sr-only">ลบรถยนต์</span>
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{car.brand} {car.model}</h3>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">{getCarTypeDisplay(car.car_type)}</span>
                      </div>
                      <div className="mb-4">
                        <p className="text-gray-600 text-sm">ปี {car.year} • ทะเบียน {car.license_plate}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditCar(car)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-md transition-colors flex items-center justify-center"
                          title="แก้ไขข้อมูลรถยนต์"
                          aria-label="แก้ไขข้อมูลรถยนต์นี้"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          แก้ไข
                        </button>
                        {!car.image_url && (
                          <button 
                            onClick={() => {
                              setSelectedCarId(car.id);
                              setIsImageUploadModalOpen(true);
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded-md transition-colors flex items-center justify-center"
                            title="เพิ่มรูปภาพของรถยนต์"
                            aria-label="เพิ่มรูปภาพของรถยนต์นี้"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                            เพิ่มรูปภาพ
                          </button>
                        )}
                        <button
                          onClick={() => handleManageStatus(car)}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm py-2 px-3 rounded-md transition-colors flex items-center justify-center"
                          title="จัดการสถานะรถยนต์"
                          aria-label="จัดการสถานะของรถยนต์นี้"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                          </svg>
                          จัดการสถานะ
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <AddCarModal 
        isOpen={isAddCarModalOpen} 
        onClose={() => setIsAddCarModalOpen(false)} 
        onSuccess={handleAddCarSuccess} 
      />
      
      {selectedCarId && (
        <ImageUploadModal 
          isOpen={isImageUploadModalOpen} 
          onClose={() => setIsImageUploadModalOpen(false)} 
          carId={selectedCarId} 
          onSuccess={handleImageUploadSuccess} 
        />
      )}

      {/* Edit Car Modal */}
      {selectedCar && (
        <EditCarModal
          isOpen={isEditCarModalOpen}
          onClose={() => setIsEditCarModalOpen(false)}
          onSuccess={handleEditCarSuccess}
          car={selectedCar}
        />
      )}
      {selectedCar && (
        <CarStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          onSuccess={handleStatusSuccess}
          carId={selectedCar.id}
          currentStatus={selectedCar.status}
        />
      )}

      {/* Delete Car Modal */}
      {selectedCar && (
        <DeleteCarModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onSuccess={handleDeleteSuccess}
          carId={selectedCar.id}
          carName={`${selectedCar.brand} ${selectedCar.model}`}
        />
      )}
    </div>
  );
}