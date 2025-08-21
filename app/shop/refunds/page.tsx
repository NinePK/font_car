// app/shop/refunds/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import axios from 'axios';
import { User } from 'lucide-react';

interface RefundRequest {
  id: number;
  payment_id: number;
  rental_id: number;
  amount: number;
  refund_amount: number;
  payment_status: string;
  refund_reason: string;
  transaction_id: string;
  receipt_url: string;
  created_at: string;
  // ข้อมูลลูกค้า
  customer_name: string;
  customer_email: string;
  // ข้อมูลรถ
  car_brand: string;
  car_model: string;
  car_year: number;
  // ข้อมูลการจอง
  start_date: string;
  end_date: string;
}

export default function ShopRefundsPage() {
  const router = useRouter();
  const { user, loading, isShop } = useAuth();
  
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const fetchRefundRequests = async () => {
    try {
      setDataLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // ดึงรายการธุรกรรมทั้งหมดของร้านเช่ารถ
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/shop/transactions`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // กรองเฉพาะรายการที่อยู่ในสถานะขอคืนเงิน
      const pendingRefunds = response.data.transactions.filter(
        (transaction: any) => transaction.payment_status === 'refund_pending'
      );
      
      setRefundRequests(pendingRefunds);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching refund requests:', err);
      setError(err.response?.data?.message || 'Failed to fetch refund requests');
    } finally {
      setDataLoading(false);
    }
  };
  
  const approveRefund = async () => {
    if (!selectedRefund) return;
    
    try {
      setIsProcessing(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/shop/payments/${selectedRefund.payment_id}/approve-refund`,
        { transaction_id: transactionId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // ลบรายการออกจาก state
      setRefundRequests(refundRequests.filter(req => req.payment_id !== selectedRefund.payment_id));
      
      setShowApproveModal(false);
      setSelectedRefund(null);
      setTransactionId('');
      setSuccessMessage('อนุมัติการคืนเงินเรียบร้อยแล้ว');
      
      // ซ่อนข้อความแจ้งเตือนหลังจาก 3 วินาที
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err: any) {
      console.error('Error approving refund:', err);
      setError(err.response?.data?.message || 'Failed to approve refund');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const rejectRefund = async () => {
    if (!selectedRefund || !rejectionReason.trim()) return;
    
    try {
      setIsProcessing(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/shop/payments/${selectedRefund.payment_id}/reject-refund`,
        { reason: rejectionReason },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // ลบรายการออกจาก state
      setRefundRequests(refundRequests.filter(req => req.payment_id !== selectedRefund.payment_id));
      
      setShowRejectModal(false);
      setSelectedRefund(null);
      setRejectionReason('');
      setSuccessMessage('ปฏิเสธการคืนเงินเรียบร้อยแล้ว');
      
      // ซ่อนข้อความแจ้งเตือนหลังจาก 3 วินาที
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err: any) {
      console.error('Error rejecting refund:', err);
      setError(err.response?.data?.message || 'Failed to reject refund');
    } finally {
      setIsProcessing(false);
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
      } else if (!isShop()) {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, isShop, router]);
  
  // โหลดรายการขอคืนเงิน
  useEffect(() => {
    if (user && isShop() && isMounted) {
      fetchRefundRequests();
    }
  }, [user, isMounted]);
  
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
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-red-600">ระบบจัดการเช่ารถ</h1>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                <Link
                  href="/shop/dashboard"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  แดชบอร์ด
                </Link>
                <Link
                  href="/shop/cars"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  จัดการรถยนต์
                </Link>
                <Link
                  href="/shop/bookings"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  จัดการการจอง
                </Link>
                <Link
                  href="/shop/refunds"
                  className="border-red-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  จัดการคืนเงิน
                </Link>
                <Link
                  href="/shop/notifications"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  การแจ้งเตือน
                </Link>
                <Link
                  href="/shop/profile"
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    color: 'var(--muted-foreground)',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.backgroundColor = 'var(--muted)';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.backgroundColor = 'transparent';
                  }}
                >
                  <User className="w-4 h-4 inline mr-2" />
                  โปรไฟล์
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <div className="ml-3 relative flex items-center">
                <span className="mr-4 text-gray-700">สวัสดี, {user.shop_name || user.username}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">จัดการคำขอคืนเงิน</h1>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          {/* ข้อความแจ้งเตือน */}
          {error && (
            <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm" role="alert">
              <p className="font-medium">เกิดข้อผิดพลาด</p>
              <p>{error}</p>
            </div>
          )}
          
          {successMessage && (
            <div className="mb-6 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-sm" role="alert">
              <p className="font-medium">{successMessage}</p>
            </div>
          )}
          
          {/* รายการคำขอคืนเงิน */}
          {dataLoading ? (
            <div className="text-center py-12">
              <svg className="animate-spin h-10 w-10 text-red-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          ) : refundRequests.length === 0 ? (
            <div className="bg-white shadow rounded-lg">
              <div className="p-6 text-center">
                <svg className="mx-auto h-14 w-14 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีคำขอคืนเงิน</h3>
                <p className="mt-1 text-sm text-gray-500">
                  ไม่มีคำขอคืนเงินที่รอการอนุมัติในขณะนี้
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => fetchRefundRequests()}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    รีเฟรช
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {refundRequests.map((request) => (
                  <li key={request.payment_id} className="px-4 py-5 sm:px-6">
                    <div className="flex flex-col md:flex-row md:justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          คำขอคืนเงิน #{request.payment_id} - {request.car_brand} {request.car_model}
                        </h3>
                        <div className="mt-2 text-sm text-gray-500">
                          <p>ลูกค้า: {request.customer_name}</p>
                          <p>จำนวนเงินที่จอง: ฿{request.amount.toLocaleString()}</p>
                          <p>จำนวนเงินที่ขอคืน: ฿{request.refund_amount.toLocaleString()}</p>
                          <p>วันที่เริ่มเช่า: {new Date(request.start_date).toLocaleDateString('th-TH')}</p>
                          <p>วันที่สิ้นสุด: {new Date(request.end_date).toLocaleDateString('th-TH')}</p>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-500">เหตุผลในการขอคืนเงิน:</p>
                          <p className="text-sm text-gray-800 mt-1 bg-gray-50 p-2 rounded">
                            {request.refund_reason || "ไม่ได้ระบุเหตุผล"}
                          </p>
                        </div>
                        <div className="mt-2">
                          {request.receipt_url && (
                            <a 
                              href={`${process.env.NEXT_PUBLIC_API_URL || ''}${request.receipt_url}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                              ดูหลักฐานการชำระเงิน
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 flex md:flex-col space-x-3 md:space-x-0 md:space-y-2">
                        <button
                          onClick={() => {
                            setSelectedRefund(request);
                            setShowApproveModal(true);
                          }}
                          className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          อนุมัติการคืนเงิน
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRefund(request);
                            setShowRejectModal(true);
                          }}
                          className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                        >
                          ปฏิเสธการคืนเงิน
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Modal อนุมัติการคืนเงิน */}
          {showApproveModal && selectedRefund && (
            <div className="fixed inset-0 z-10 overflow-y-auto">
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                        <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          อนุมัติการคืนเงิน
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            คุณกำลังจะอนุมัติการคืนเงินแก่ {selectedRefund.customer_name} เป็นจำนวน ฿{selectedRefund.refund_amount.toLocaleString()}
                          </p>
                          
                          <div className="mt-4">
                            <label htmlFor="transaction-id" className="block text-sm font-medium text-gray-700">
                              เลขที่ธุรกรรมการโอนเงินคืน (ถ้ามี)
                            </label>
                            <input
                              type="text"
                              id="transaction-id"
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value)}
                              placeholder="เลขที่ธุรกรรมจากธนาคารของคุณ"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      onClick={approveRefund}
                      disabled={isProcessing}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      {isProcessing ? 'กำลังดำเนินการ...' : 'ยืนยันการอนุมัติ'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowApproveModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Modal ปฏิเสธการคืนเงิน */}
          {showRejectModal && selectedRefund && (
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
                        <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          ปฏิเสธการคืนเงิน
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            คุณกำลังจะปฏิเสธการคืนเงินแก่ {selectedRefund.customer_name} เป็นจำนวน ฿{selectedRefund.refund_amount.toLocaleString()}
                          </p>
                          
                          <div className="mt-4">
                            <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700">
                              เหตุผลในการปฏิเสธ <span className="text-red-600">*</span>
                            </label>
                            <textarea
                              id="rejection-reason"
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              rows={3}
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="กรุณาระบุเหตุผลในการปฏิเสธการคืนเงิน"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      onClick={rejectRefund}
                      disabled={isProcessing || !rejectionReason.trim()}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      {isProcessing ? 'กำลังดำเนินการ...' : 'ยืนยันการปฏิเสธ'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRejectModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}