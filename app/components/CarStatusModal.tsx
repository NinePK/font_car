// app/components/CarStatusModal.tsx
'use client';

import { useState } from 'react';
import axios from 'axios';

interface CarStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  carId: number;
  currentStatus: 'available' | 'rented' | 'maintenance' | 'deleted';
}

export default function CarStatusModal({ isOpen, onClose, onSuccess, carId, currentStatus }: CarStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<'available' | 'rented' | 'maintenance'>(
    currentStatus === 'deleted' ? 'available' : currentStatus
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const statusOptions = [
    { value: 'available', label: 'ว่าง', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'rented', label: 'ไม่ว่าง (ถูกเช่า)', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'maintenance', label: 'ไม่พร้อมให้บริการ (ซ่อมบำรุง)', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
  ];

  const handleChangeStatus = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // กำหนด URL API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      // ส่งข้อมูลไปอัปเดตสถานะที่ API
      await axios.put(
        `${apiUrl}/cars/${carId}/status`,
        { status: selectedStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // เรียกใช้ callback เมื่อสำเร็จ
      onSuccess();
      
      // ปิด Modal
      onClose();
    } catch (err: any) {
      console.error('Update car status error:', err);
      if (err.response?.status === 403) {
        setError('คุณไม่มีสิทธิ์ในการเปลี่ยนสถานะรถยนต์นี้');
      } else if (err.response?.status === 401) {
        setError('Session หมดอายุ โปรดเข้าสู่ระบบอีกครั้ง');
      } else {
        setError(err.response?.data?.message || 'ไม่สามารถเปลี่ยนสถานะได้');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity cursor-pointer" 
          aria-hidden="true"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        {/* Modal content */}
        <div 
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="w-full">
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">จัดการสถานะรถยนต์</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">เลือกสถานะที่ต้องการเปลี่ยน</p>
                  </div>
                  
                  {error && (
                    <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}

                  <div className="mt-6 space-y-4">
                    {statusOptions.map((status) => (
                      <div key={status.value} className="relative">
                        <button
                          type="button"
                          onClick={() => setSelectedStatus(status.value as any)}
                          className={`w-full flex items-center justify-between px-4 py-3 border-2 rounded-lg transition-colors ${
                            selectedStatus === status.value 
                              ? `${status.color} border-2` 
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <span className="flex items-center">
                            <span className="ml-2 font-medium">{status.label}</span>
                          </span>
                          
                          {selectedStatus === status.value && (
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleChangeStatus}
              disabled={isSubmitting || selectedStatus === currentStatus}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'เปลี่ยนสถานะ'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}