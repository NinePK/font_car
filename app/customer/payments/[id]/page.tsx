// app/customer/payments/[id]/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';
import axios from 'axios';

interface PaymentInfo {
  rental: {
    id: number;
    car_id: number;
    start_date: string;
    end_date: string;
    total_amount: number;
    days: number;
    brand: string;
    model: string;
    year: number;
    image_url?: string;
  };
  shop_name: string;
  promptpay_id: string;
  total_amount: number;
}

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading, isCustomer } = useAuth();
  
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPaymentInfo = async () => {
    try {
      setDataLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const rentalId = params.id;
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/customer/payments/${rentalId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setPaymentInfo(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching payment info:', err);
      setError(err.response?.data?.message || 'Failed to fetch payment information');
    } finally {
      setDataLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // สร้าง URL สำหรับแสดงตัวอย่างรูปภาพ
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        if (e.target?.result) {
          setPreviewUrl(e.target.result as string);
        }
      };
      fileReader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setUploadError('กรุณาเลือกรูปภาพหลักฐานการชำระเงิน');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const rentalId = params.id;
      
      const formData = new FormData();
      formData.append('payment_proof', selectedFile);
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/payments/${rentalId}/proof`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      setUploadSuccess(true);
      
      // รอสักครู่แล้ว redirect
      setTimeout(() => {
        router.push(response.data.redirect_to || `/customer/bookings/${rentalId}`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err.response?.data?.message || 'Failed to upload payment proof');
    } finally {
      setIsUploading(false);
    }
  };

  const fetchQRCode = async () => {
    try {
      setQrLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const rentalId = params.id;
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/customer/payments/${rentalId}/qr`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setQrCodeData(response.data.qr_code);
    } catch (err: any) {
      console.error('Error fetching QR code:', err);
      // ไม่แสดง error ถ้าไม่สามารถสร้าง QR Code ได้ เพราะอาจจะไม่มี PromptPay ID
    } finally {
      setQrLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('คัดลอกไปยังคลิปบอร์ดแล้ว');
    }).catch(err => {
      console.error('Copy to clipboard failed:', err);
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
      } else if (!isCustomer()) {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, isCustomer, router]);

  // โหลดข้อมูลการชำระเงิน
  useEffect(() => {
    if (user && isCustomer() && isMounted) {
      fetchPaymentInfo();
      fetchQRCode(); // ดึง QR Code ด้วย
    }
  }, [user, params.id, isMounted]);

  // เมื่อมีการเลือกไฟล์ให้แสดงตัวอย่าง
  useEffect(() => {
    return () => {
      // ล้าง URL เมื่อ component ถูก unmount
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  aria-hidden="true"
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
          
          <h1 className="text-3xl font-bold leading-tight text-gray-900 mb-6">ชำระเงิน</h1>
          
          {/* แสดงข้อความแจ้งเตือน */}
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
              {error}
            </div>
          )}
          
          {/* แสดงข้อความอัปโหลดสำเร็จ */}
          {uploadSuccess && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded" role="alert">
              <p className="font-bold">อัปโหลดหลักฐานการชำระเงินสำเร็จ!</p>
              <p>ระบบกำลังนำคุณไปยังหน้าสรุปการจอง...</p>
            </div>
          )}
          
          {dataLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600" aria-hidden="true"></div>
              <p className="mt-2">กำลังโหลดข้อมูล...</p>
            </div>
          ) : paymentInfo ? (
            <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
              {/* ส่วนหัวการชำระเงิน */}
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900">การชำระเงินสำหรับการจองรถ</h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  กรุณาชำระเงินผ่านช่องทางที่ระบุด้านล่าง และอัปโหลดหลักฐานการชำระเงิน
                </p>
              </div>
              
              {/* ข้อมูลการจอง */}
              <div className="px-4 py-5 sm:p-6 space-y-4">
                {/* ข้อมูลรถ */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/3">
                    {paymentInfo.rental.image_url ? (
                      <div className="h-40 w-full bg-gray-200 rounded-lg overflow-hidden">
                        <img 
                          src={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'}${paymentInfo.rental.image_url}`}
                          alt={`${paymentInfo.rental.brand} ${paymentInfo.rental.model}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-40 w-full bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="w-full md:w-2/3">
                    <h3 className="text-lg font-medium text-gray-900">{paymentInfo.rental.brand} {paymentInfo.rental.model} {paymentInfo.rental.year}</h3>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">วันที่เริ่มต้น:</span>{' '}
                        {new Date(paymentInfo.rental.start_date).toLocaleDateString('th-TH')}
                      </div>
                      <div>
                        <span className="text-gray-500">วันที่สิ้นสุด:</span>{' '}
                        {new Date(paymentInfo.rental.end_date).toLocaleDateString('th-TH')}
                      </div>
                      <div>
                        <span className="text-gray-500">จำนวนวัน:</span>{' '}
                        {paymentInfo.rental.days} วัน
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* ข้อมูลการชำระเงิน */}
                <div className="mt-6">
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">ยอดเงินที่ต้องชำระ</h3>
                    <p className="text-3xl font-bold text-indigo-600">฿{paymentInfo.total_amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">ชำระเงินผ่านพร้อมเพย์</p>
                  </div>
                  
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    {/* QR Code Section */}
                    {qrCodeData && (
                      <div className="mb-6 text-center">
                        <h4 className="text-lg font-medium text-gray-900 mb-3">QR Code พร้อมเพย์</h4>
                        <div className="bg-white p-4 rounded-lg inline-block shadow-sm border-2 border-gray-200">
                          <img 
                            src={qrCodeData} 
                            alt="PromptPay QR Code" 
                            className="w-48 h-48 mx-auto"
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-2">สแกน QR Code เพื่อชำระเงินผ่านแอปธนาคาร</p>
                      </div>
                    )}
                    
                    {qrLoading && (
                      <div className="mb-6 text-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600" aria-hidden="true"></div>
                        <p className="text-sm text-gray-600 mt-2">กำลังสร้าง QR Code...</p>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mb-3">
                      <div className="font-medium">ร้าน {paymentInfo.shop_name}</div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentInfo.shop_name)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
                        aria-label="คัดลอกชื่อร้าน"
                        title="คัดลอกชื่อร้าน"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        คัดลอก
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <span className="text-gray-500">พร้อมเพย์:</span>{' '}
                        <span className="font-medium">{paymentInfo.promptpay_id}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentInfo.promptpay_id)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
                        aria-label="คัดลอกหมายเลขพร้อมเพย์"
                        title="คัดลอกหมายเลขพร้อมเพย์"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        คัดลอก
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-gray-500">จำนวนเงิน:</span>{' '}
                        <span className="font-medium">฿{paymentInfo.total_amount.toLocaleString()}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentInfo.total_amount.toString())}
                        className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
                        aria-label="คัดลอกจำนวนเงิน"
                        title="คัดลอกจำนวนเงิน"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        คัดลอก
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* อัปโหลดหลักฐานการชำระเงิน */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4" id="payment-proof-heading">อัปโหลดหลักฐานการชำระเงิน</h3>
                  
                  {uploadError && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
                      {uploadError}
                    </div>
                  )}
                  
                  <form onSubmit={handleUpload} className="space-y-4" aria-labelledby="payment-proof-heading">
                    <div className="flex flex-col items-center justify-center border-2 border-gray-300 border-dashed rounded-lg p-6 cursor-pointer hover:bg-gray-50" onClick={() => fileInputRef.current?.click()}>
                      {previewUrl ? (
                        <div className="w-full">
                          <img
                            src={previewUrl}
                            alt="หลักฐานการชำระเงิน"
                            className="max-h-64 mx-auto object-contain"
                          />
                          <p className="mt-2 text-sm text-gray-500 text-center">คลิกเพื่อเปลี่ยนรูปภาพ</p>
                        </div>
                      ) : (
                        <>
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div className="mt-2 text-sm text-gray-600">
                            <p className="font-medium">คลิกเพื่ออัปโหลดรูปภาพ</p>
                            <p className="text-xs text-gray-500">PNG, JPG หรือ JPEG (สูงสุด 5MB)</p>
                          </div>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        id="payment_proof"
                        name="payment_proof"
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isUploading || uploadSuccess}
                        aria-label="อัปโหลดรูปภาพหลักฐานการชำระเงิน"
                        title="เลือกรูปภาพ"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <Link href={`/customer/bookings/${paymentInfo.rental.id}`}>
                        <button
                          type="button"
                          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                          disabled={isUploading}
                          aria-label="ยกเลิกการอัปโหลด"
                          title="ยกเลิกการอัปโหลด"
                        >
                          ยกเลิก
                        </button>
                      </Link>
                      <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
                        disabled={!selectedFile || isUploading || uploadSuccess}
                        aria-label="ยืนยันการชำระเงิน"
                        title="ยืนยันการชำระเงิน"
                      >
                        {isUploading ? 'กำลังอัปโหลด...' : 'ยืนยันการชำระเงิน'}
                      </button>
                    </div>
                  </form>
                </div>
                
                {/* คำแนะนำ */}
                <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">คำแนะนำ</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>กรุณาโอนเงินไปยังหมายเลขพร้อมเพย์ตามที่ระบุให้ครบถ้วน</li>
                          <li>ถ่ายรูปหลักฐานการโอนเงินที่มีรายละเอียดครบถ้วน เช่น วันเวลา จำนวนเงิน และรหัสอ้างอิง</li>
                          <li>หลังจากอัพโหลดหลักฐานเรียบร้อย ร้านเช่ารถจะได้รับการแจ้งเตือนและตรวจสอบการชำระเงิน</li>
                          <li>เมื่อได้รับการยืนยันแล้ว คุณจะได้รับการแจ้งเตือนผ่านอีเมลและสามารถดูสถานะการจองได้ในหน้าการจองของฉัน</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden rounded-lg p-6 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">ไม่พบข้อมูลการจอง</h3>
              <p className="mt-1 text-sm text-gray-500">ไม่พบข้อมูลการจองหรือคุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้</p>
              <div className="mt-6">
                <Link href="/customer/dashboard">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    aria-label="กลับไปยังหน้าหลัก"
                    title="กลับไปยังหน้าหลัก"
                  >
                    กลับไปยังหน้าหลัก
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}