// app/customer/cars/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import Link from 'next/link';
import axios from 'axios';
import ReviewsSection from '../../../components/ReviewsSection';
import { Car, Calendar, MapPin, User, LogOut, Bell, MessageSquare, Moon, Sun, ArrowLeft } from 'lucide-react';

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
  insurance_rate: number; // เพิ่มฟิลด์ราคาประกัน
  description?: string;
  status: 'available' | 'rented' | 'maintenance';
  image_url?: string;
  shop_id: number;
  shop_name: string;
  shop_address?: string;
  shop_phone?: string;
  promptpay_id?: string; // เพิ่มฟิลด์ promptpay_id
  images?: { id: number; image_url: string; is_primary: boolean }[];
}

interface BookingForm {
  start_date: string;
  end_date: string;
  pickup_location: string;
  return_location: string;
}

export default function CarDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading, isCustomer, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [car, setCar] = useState<Car | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    start_date: '',
    end_date: '',
    pickup_location: '',
    return_location: ''
  });
  const [days, setDays] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // คำนวณจำนวนวันและราคารวม (แก้ไขแล้ว)
  useEffect(() => {
    if (bookingForm.start_date && bookingForm.end_date && car) {
      const start = new Date(bookingForm.start_date);
      const end = new Date(bookingForm.end_date);
      
      // คำนวณจำนวนวัน (มิลลิวินาที -> วัน)
      const timeDiff = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      // ถ้าวันที่จองถูกต้อง (จำนวนวันเป็นบวก)
      if (diffDays > 0) {
        setDays(diffDays);
        
        // Make sure daily_rate and insurance_rate are valid numbers
        const dailyRate = typeof car.daily_rate === 'number' ? car.daily_rate : parseFloat(car.daily_rate) || 0;
        const insuranceRate = typeof car.insurance_rate === 'number' ? car.insurance_rate : parseFloat(car.insurance_rate) || 0;
        
        // Calculate total with proper number handling
        const total = diffDays * (dailyRate + insuranceRate);
        
        // Ensure the total is a valid number
        setTotalPrice(isNaN(total) ? 0 : total);
        
        console.log('Price calculation:', { 
          days: diffDays, 
          dailyRate, 
          insuranceRate, 
          total 
        });
      } else {
        setDays(0);
        setTotalPrice(0);
      }
    }
  }, [bookingForm.start_date, bookingForm.end_date, car]);

  const fetchCarDetail = async () => {
    try {
      setDataLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const carId = params.id;
      // แก้ไข URL ให้ตรงกับที่กำหนดในไฟล์ car.routes.js (/:carId/customer)
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/cars/${carId}/customer`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setCar(response.data.car);
      
      // ตั้งค่ารูปภาพหลัก
      if (response.data.car.image_url) {
        setActiveImage(response.data.car.image_url);
      } else if (response.data.car.images && response.data.car.images.length > 0) {
        // ใช้รูปแรกถ้าไม่มีรูปหลัก
        setActiveImage(response.data.car.images[0].image_url);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching car details:', err);
      setError('ไม่สามารถดึงข้อมูลรถยนต์ได้ โปรดลองใหม่อีกครั้ง');
    } finally {
      setDataLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookingForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // ฟังก์ชั่นการจองรถ (แก้ไขแล้ว)
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookingForm.start_date || !bookingForm.end_date) {
      setBookingError('กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด');
      return;
    }
    
    // ตรวจสอบความถูกต้องของวันที่
    const start = new Date(bookingForm.start_date);
    const end = new Date(bookingForm.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // ตั้งเวลาเป็น 00:00:00
    
    if (start < today) {
      setBookingError('วันที่เริ่มต้นต้องไม่เป็นวันที่ผ่านมาแล้ว');
      return;
    }
    
    if (end <= start) {
      setBookingError('วันที่สิ้นสุดต้องเป็นวันหลังจากวันที่เริ่มต้น');
      return;
    }
    
    // Validate totalPrice is calculated correctly
    if (isNaN(totalPrice) || totalPrice <= 0) {
      setBookingError('ไม่สามารถคำนวณราคารวมได้ โปรดตรวจสอบวันที่อีกครั้ง');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setBookingError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const carId = params.id;
      
      // เพิ่ม car_id และ total_amount เข้าไปในข้อมูลที่ส่งไป
      const bookingData = {
        car_id: carId,
        start_date: bookingForm.start_date,
        end_date: bookingForm.end_date,
        pickup_location: bookingForm.pickup_location || null,
        return_location: bookingForm.return_location || null,
        total_amount: totalPrice // Explicitly include the calculated total price
      };
      
      console.log('Sending booking data:', bookingData);
      
      // Make the request with the properly structured data
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/cars/${carId}/book`,
        bookingData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    
      setBookingSuccess(true);
      
      // รีเซ็ตฟอร์ม
      setBookingForm({
        start_date: '',
        end_date: '',
        pickup_location: '',
        return_location: ''
      });
      
      // อัพเดต: หลังจองสำเร็จให้นำไปยังหน้าชำระเงินทันที
      if (response.data.redirect_to_payment && response.data.payment_url) {
        // รอสักครู่แล้ว redirect ไปหน้าชำระเงิน
        setTimeout(() => {
          router.push(response.data.payment_url);
        }, 1000);
      } else {
        // ถ้าไม่มี URL ชำระเงิน ให้ไปที่หน้ารายการจอง
        setTimeout(() => {
          router.push('/customer/bookings');
        }, 1000);
      }
      
    } catch (err: any) {
      console.error('Booking error:', err);
      setBookingError(err.response?.data?.message || 'Failed to book the car');
    } finally {
      setIsSubmitting(false);
    }
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
      } else if (!isCustomer()) {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, isCustomer, router]);

  // โหลดข้อมูลรถยนต์
  useEffect(() => {
    if (user && isCustomer() && isMounted) {
      fetchCarDetail();
    }
  }, [user, params.id, isMounted]);

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
                  ระบบเช่ารถ
                </h1>
              </div>
              
              {/* Navigation Links */}
              <div className="hidden md:flex space-x-6">
                <Link
                  href="/customer/dashboard"
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    color: 'var(--muted-foreground)',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--muted)'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
                >
                  หน้าแรก
                </Link>
                <Link
                  href="/customer/bookings"
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    color: 'var(--muted-foreground)',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--muted)'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
                >
                  การจองของฉัน
                </Link>
                <Link
                  href="/customer/profile"
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    color: 'var(--muted-foreground)',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--muted)'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'transparent'}
                >
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
          {/* ลิงก์ย้อนกลับ */}
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

          {/* แสดงข้อผิดพลาด */}
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {dataLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2"
                   style={{ borderTopColor: 'var(--primary)', borderBottomColor: 'var(--primary)' }}></div>
              <p className="mt-2 transition-colors duration-300"
                 style={{ color: 'var(--muted-foreground)' }}>
                กำลังโหลดข้อมูล...
              </p>
            </div>
          ) : car ? (
            <div className="shadow-lg overflow-hidden rounded-xl border transition-all duration-300"
                 style={{
                   backgroundColor: 'var(--card)',
                   borderColor: 'var(--border)'
                 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                {/* ส่วนแสดงรูปภาพ */}
                <div>
                  <div className="h-64 md:h-80 bg-gray-200 rounded-lg overflow-hidden mb-4">
                    {activeImage ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'}${activeImage}`}
                        alt={`${car.brand} ${car.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex justify-center items-center h-full bg-gray-200 text-gray-400">
                        ไม่มีรูปภาพ
                      </div>
                    )}
                  </div>
                  
                  {/* รูปภาพขนาดเล็ก */}
                  {car.images && car.images.length > 0 && (
                    <div className="grid grid-cols-5 gap-2">
                      {car.images.map((image) => (
                        <div
                          key={image.id}
                          className={`h-16 bg-gray-200 rounded cursor-pointer overflow-hidden ${
                            activeImage === image.image_url ? 'ring-2 ring-indigo-500' : ''
                          }`}
                          onClick={() => setActiveImage(image.image_url)}
                        >
                          <img
                            src={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'}${image.image_url}`}
                            alt={`${car.brand} ${car.model}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ส่วนแสดงข้อมูลรถยนต์ */}
                <div>
                  <h1 className="text-2xl font-bold mb-2">{car.brand} {car.model}</h1>
                  <div className="bg-green-100 text-green-800 inline-block px-2 py-1 rounded text-sm mb-4">
                    พร้อมให้เช่า
                  </div>
                  
                  <div className="text-3xl font-bold text-green-600 mb-4">
                    ฿{car.daily_rate.toLocaleString()}<span className="text-lg font-normal text-gray-500">/วัน</span>
                  </div>

                  {/* เพิ่มส่วนแสดงราคาประกัน - ตรวจสอบค่าก่อนแสดง */}
                  {car.insurance_rate > 0 && (
                    <div className="text-lg font-medium text-blue-600 mb-4">
                      ค่าประกัน: ฿{car.insurance_rate.toLocaleString()}<span className="text-sm font-normal text-gray-500">/วัน</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-y-3 text-sm mb-6">
                    <div>
                      <span className="text-gray-500">ปี:</span> {car.year}
                    </div>
                    <div>
                      <span className="text-gray-500">สี:</span> {car.color}
                    </div>
                    <div>
                      <span className="text-gray-500">ประเภท:</span> {car.car_type}
                    </div>
                    <div>
                      <span className="text-gray-500">ที่นั่ง:</span> {car.seats} ที่นั่ง
                    </div>
                    <div>
                      <span className="text-gray-500">เกียร์:</span>{' '}
                      {car.transmission === 'auto' ? 'อัตโนมัติ' : 'ธรรมดา'}
                    </div>
                    <div>
                      <span className="text-gray-500">เชื้อเพลิง:</span>{' '}
                      {car.fuel_type === 'gasoline'
                        ? 'น้ำมันเบนซิน'
                        : car.fuel_type === 'diesel'
                        ? 'น้ำมันดีเซล'
                        : car.fuel_type === 'hybrid'
                        ? 'ไฮบริด'
                        : 'ไฟฟ้า'}
                    </div>
                  </div>
                  
                  {car.description && (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-2">รายละเอียด</h3>
                      <p className="text-gray-600">{car.description}</p>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-medium mb-2">ข้อมูลร้านเช่ารถ</h3>
                    <p className="text-gray-600 font-medium">{car.shop_name}</p>
                    {car.shop_phone && (
                      <p className="text-gray-600">
                        <span className="text-gray-500">เบอร์โทร:</span> {car.shop_phone}
                      </p>
                    )}
                    {car.shop_address && (
                      <p className="text-gray-600">
                        <span className="text-gray-500">ที่อยู่:</span> {car.shop_address}
                      </p>
                    )}
                    {/* แสดงพร้อมเพย์ถ้ามี */}
                    {car.promptpay_id && (
                      <p className="text-gray-600">
                        <span className="text-gray-500">พร้อมเพย์:</span> {car.promptpay_id}
                      </p>
                    )}
                    <div className="mt-2">
                      <Link href={`/customer/shops/${car.shop_id}`}>
                        <span className="text-indigo-600 hover:text-indigo-800 text-sm">
                          ดูรถอื่นๆ จากร้านนี้
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* ส่วนจองรถยนต์ */}
              <div className="border-t border-gray-200 px-6 py-8">
                <h2 className="text-xl font-bold mb-6">จองรถคันนี้</h2>
                
                {bookingSuccess ? (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    <p className="font-bold">จองรถสำเร็จ!</p>
                    <p>กำลังนำคุณไปยังหน้าชำระเงิน...</p>
                  </div>
                ) : car?.status !== 'available' ? (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p className="font-bold">
                      {car?.status === 'rented' ? 'รถคันนี้ถูกจองแล้ว' :
                       car?.status === 'maintenance' ? 'รถคันนี้อยู่ระหว่างซ่อมบำรุง' :
                       'รถคันนี้ไม่พร้อมให้บริการ'}
                    </p>
                    <p>กรุณาเลือกรถคันอื่นหรือลองใหม่ในภายหลัง</p>
                  </div>
                ) : (
                  <form onSubmit={handleBooking}>
                    {bookingError && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {bookingError}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                          วันที่เริ่มต้น <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="start_date"
                          name="start_date"
                          type="date"
                          required
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={bookingForm.start_date}
                          onChange={handleInputChange}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                          วันที่สิ้นสุด <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="end_date"
                          name="end_date"
                          type="date"
                          required
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={bookingForm.end_date}
                          onChange={handleInputChange}
                          min={bookingForm.start_date || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <label htmlFor="pickup_location" className="block text-sm font-medium text-gray-700 mb-1">
                          สถานที่รับรถ
                        </label>
                        <input
                          id="pickup_location"
                          name="pickup_location"
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="ระบุสถานที่รับรถ"
                          value={bookingForm.pickup_location}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="return_location" className="block text-sm font-medium text-gray-700 mb-1">
                          สถานที่คืนรถ
                        </label>
                        <input
                          id="return_location"
                          name="return_location"
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="ระบุสถานที่คืนรถ"
                          value={bookingForm.return_location}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    
                    {days > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600">
                            ราคาเช่า {car.daily_rate.toLocaleString()} บาท × {days} วัน
                          </span>
                          <span>{(car.daily_rate * days).toLocaleString()} บาท</span>
                        </div>
                        
                        {/* แสดงค่าประกัน (ถ้ามี) */}
                        {car.insurance_rate > 0 && (
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">
                              ค่าประกัน {car.insurance_rate.toLocaleString()} บาท × {days} วัน
                            </span>
                            <span>{(car.insurance_rate * days).toLocaleString()} บาท</span>
                          </div>
                        )}
                        
                        <div className="border-t border-gray-200 pt-2 flex justify-between items-center font-bold">
                          <span>ราคารวมทั้งสิ้น</span>
                          <span className="text-xl text-green-600">
                            {totalPrice.toLocaleString()} บาท
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting || days <= 0}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {isSubmitting ? 'กำลังดำเนินการ...' : 'จองรถคันนี้'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p>ไม่พบข้อมูลรถยนต์ หรือรถคันนี้อาจไม่พร้อมให้เช่า</p>
            </div>
          )}

          {/* ส่วนรีวิว - แสดงเฉพาะเมื่อมีข้อมูลรถ */}
          {car && (
            <div className="mt-8">
              <ReviewsSection carId={car.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}