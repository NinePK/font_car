// app/customer/bookings/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';
import axios from 'axios';

interface Booking {
  id: number;
  car_id: number;
  shop_id: number;
  start_date: string;
  end_date: string;
  pickup_location: string;
  return_location: string;
  rental_status: 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  total_amount: number;
  created_at: string;
  // ข้อมูลเพิ่มเติมจาก join
  brand: string;
  model: string;
  year: number;
  car_type: string;
  transmission: string;
  fuel_type: string;
  seats: number;
  color: string;
  license_plate: string;
  image_url?: string;
  shop_name: string;
  shop_address?: string;
  shop_phone?: string;
  // ข้อมูลรูปภาพ
  images?: { id: number; image_url: string; is_primary: boolean }[];
  // คำนวณเอง
  can_cancel: boolean;
  hours_since_creation: number;
  days: number;
}

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading, isCustomer } = useAuth();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const fetchBookingDetail = async () => {
    try {
      setDataLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const bookingId = params.id;
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/customer/rentals/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // คำนวณข้อมูลเพิ่มเติม
      const bookingData = response.data.rental;
      const createdAt = new Date(bookingData.created_at);
      const now = new Date();
      const hoursDiff = Math.abs(now.getTime() - createdAt.getTime()) / 36e5; // ชั่วโมง
      
      // คำนวณจำนวนวัน
      const startDate = new Date(bookingData.start_date);
      const endDate = new Date(bookingData.end_date);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      setBooking({
        ...bookingData,
        can_cancel: (bookingData.rental_status === 'pending' && hoursDiff <= 2),
        hours_since_creation: Math.floor(hoursDiff),
        days
      });
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching booking details:', err);
      setError(err.response?.data?.message || 'Failed to fetch booking details');
    } finally {
      setDataLoading(false);
    }
  };

  const cancelBooking = async () => {
    try {
      setIsCancelling(true);
      const token = localStorage.getItem('token');
      
      if (!token || !booking) {
        throw new Error('Not authenticated or booking not found');
      }
      
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/rentals/${booking.id}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // อัปเดตข้อมูลการจอง
      setBooking({
        ...booking,
        rental_status: 'cancelled',
        can_cancel: false
      });
      
      setShowCancelConfirm(false);
      setCancelSuccess(true);
      
      // กลับไปหน้ารายการจองหลังจาก 3 วินาที
      setTimeout(() => {
        router.push('/customer/bookings');
      }, 3000);
      
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      setError(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'รออนุมัติ';
      case 'confirmed':
        return 'อนุมัติแล้ว';
      case 'ongoing':
        return 'กำลังเช่า';
      case 'completed':
        return 'เสร็จสิ้น';
      case 'cancelled':
        return 'ยกเลิก';
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-indigo-100 text-indigo-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'รอชำระเงิน';
      case 'paid':
        return 'ชำระเงินแล้ว';
      case 'refunded':
        return 'คืนเงินแล้ว';
      case 'failed':
        return 'การชำระเงินล้มเหลว';
      default:
        return status;
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

  // โหลดข้อมูลการจอง
  useEffect(() => {
    if (user && isCustomer() && isMounted) {
      fetchBookingDetail();
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
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">ระบบเช่ารถ</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/customer/dashboard"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  หน้าแรก
                </Link>
                <Link
                  href="/customer/bookings"
                  className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  การจองของฉัน
                </Link>
                <Link
                  href="/customer/profile"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  โปรไฟล์
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ลิงก์ย้อนกลับ */}
          <div className="mb-4">
            <Link href="/customer/bookings">
              <span className="flex items-center text-indigo-600 hover:text-indigo-800">
                <svg
                  className="w-5 h-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  ></path>
                </svg>
                กลับไปหน้ารายการจอง
              </span>
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold leading-tight text-gray-900 mb-6">รายละเอียดการจอง</h1>
          
          {/* แสดงข้อความแจ้งเตือน */}
          {cancelSuccess && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <p className="font-bold">ยกเลิกการจองเรียบร้อยแล้ว!</p>
              <p>ระบบกำลังนำคุณกลับไปยังหน้ารายการจอง...</p>
            </div>
          )}
          
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {dataLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
              <p className="mt-2">กำลังโหลดข้อมูล...</p>
            </div>
          ) : booking ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              {/* ส่วนหัวข้อ */}
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg leading-6 font-medium text-gray-900">
                      การจองรถ #{booking.id}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      วันที่จอง: {new Date(booking.created_at).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(booking.rental_status)}`}>
                    {getStatusText(booking.rental_status)}
                    {booking.can_cancel && (
                      <span className="ml-1 text-xs">
                        (สามารถยกเลิกได้ภายใน {2 - booking.hours_since_creation} ชั่วโมง)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* ข้อมูลรถยนต์ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border-b border-gray-200">
                <div className="md:col-span-1">
                  <div className="h-48 md:h-64 bg-gray-200 rounded-lg overflow-hidden">
                    {booking.image_url ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'}${booking.image_url}`}
                        alt={`${booking.brand} ${booking.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex justify-center items-center h-full bg-gray-200 text-gray-400">
                        ไม่มีรูปภาพ
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <h3 className="text-xl font-medium text-gray-900">
                    {booking.brand} {booking.model} ปี {booking.year}
                  </h3>
                  <p className="text-gray-500">ทะเบียน: {booking.license_plate}</p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">ประเภท:</span> {booking.car_type}
                    </div>
                    <div>
                      <span className="text-gray-500">สี:</span> {booking.color}
                    </div>
                    <div>
                      <span className="text-gray-500">ที่นั่ง:</span> {booking.seats} ที่นั่ง
                    </div>
                    <div>
                      <span className="text-gray-500">เกียร์:</span>{' '}
                      {booking.transmission === 'auto' ? 'อัตโนมัติ' : 'ธรรมดา'}
                    </div>
                    <div>
                      <span className="text-gray-500">เชื้อเพลิง:</span>{' '}
                      {booking.fuel_type === 'gasoline'
                        ? 'น้ำมันเบนซิน'
                        : booking.fuel_type === 'diesel'
                        ? 'น้ำมันดีเซล'
                        : booking.fuel_type === 'hybrid'
                        ? 'ไฮบริด'
                        : 'ไฟฟ้า'}
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Link href={`/customer/cars/${booking.car_id}`}>
                      <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        ดูรายละเอียดรถ
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* ข้อมูลการจอง */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">รายละเอียดการจอง</h3>
                  
                  <div className="space-y-2">
                    <div className="flex">
                      <div className="text-gray-500 w-32">วันที่เริ่มเช่า:</div>
                      <div>{new Date(booking.start_date).toLocaleDateString('th-TH')}</div>
                    </div>
                    <div className="flex">
                      <div className="text-gray-500 w-32">วันที่สิ้นสุด:</div>
                      <div>{new Date(booking.end_date).toLocaleDateString('th-TH')}</div>
                    </div>
                    <div className="flex">
                      <div className="text-gray-500 w-32">จำนวนวัน:</div>
                      <div>{booking.days} วัน</div>
                    </div>
                    {booking.pickup_location && (
                      <div className="flex">
                        <div className="text-gray-500 w-32">สถานที่รับรถ:</div>
                        <div>{booking.pickup_location}</div>
                      </div>
                    )}
                    {booking.return_location && (
                      <div className="flex">
                        <div className="text-gray-500 w-32">สถานที่คืนรถ:</div>
                        <div>{booking.return_location}</div>
                      </div>
                    )}
                    <div className="flex">
                      <div className="text-gray-500 w-32">สถานะการชำระ:</div>
                      <div>{getPaymentStatusText(booking.payment_status)}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">ข้อมูลร้านเช่ารถ</h3>
                  
                  <div className="space-y-2">
                    <div className="flex">
                      <div className="text-gray-500 w-32">ชื่อร้าน:</div>
                      <div>{booking.shop_name}</div>
                    </div>
                    {booking.shop_phone && (
                      <div className="flex">
                        <div className="text-gray-500 w-32">เบอร์โทร:</div>
                        <div>{booking.shop_phone}</div>
                      </div>
                    )}
                    {booking.shop_address && (
                      <div className="flex">
                        <div className="text-gray-500 w-32">ที่อยู่:</div>
                        <div>{booking.shop_address}</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <Link href={`/customer/shops/${booking.shop_id}`}>
                      <span className="text-indigo-600 hover:text-indigo-800 text-sm">
                        ดูรถอื่นๆ จากร้านนี้
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* สรุปค่าใช้จ่าย */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-3">สรุปค่าใช้จ่าย</h3>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">
                      ค่าเช่ารถ {Math.round(booking.total_amount / booking.days).toLocaleString()} บาท × {booking.days} วัน
                    </span>
                    <span>{booking.total_amount.toLocaleString()} บาท</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between items-center font-bold">
                    <span>ราคารวมทั้งสิ้น</span>
                    <span className="text-xl text-green-600">{booking.total_amount.toLocaleString()} บาท</span>
                  </div>
                </div>
              </div>
              
              {/* ปุ่มดำเนินการ */}
              <div className="px-6 py-4 flex justify-end space-x-3">
                <Link href="/customer/bookings">
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    กลับไปหน้ารายการจอง
                  </button>
                </Link>
                
                {booking.can_cancel && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    ยกเลิกการจอง
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p>ไม่พบข้อมูลการจอง</p>
              <Link href="/customer/bookings">
                <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                  กลับไปหน้ารายการจอง
                </button>
              </Link>
            </div>
          )}
          
          {/* Modal ยืนยันการยกเลิก */}
          {showCancelConfirm && (
            <div className="fixed inset-0 z-10 overflow-y-auto">
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          ยืนยันการยกเลิกการจอง
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            คุณแน่ใจหรือไม่ที่ต้องการยกเลิกการจองนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      onClick={cancelBooking}
                      disabled={isCancelling}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      {isCancelling ? 'กำลังยกเลิก...' : 'ยืนยันการยกเลิก'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      ยกเลิก
                    </button>
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