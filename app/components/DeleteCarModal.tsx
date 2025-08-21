// app/components/DeleteCarModal.tsx
'use client';

import { useState } from 'react';
import axios from 'axios';

interface DeleteCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  carId: number;
  carName: string; // ยี่ห้อและรุ่นรถ สำหรับแสดงในข้อความยืนยัน
}

export default function DeleteCarModal({ isOpen, onClose, onSuccess, carId, carName }: DeleteCarModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // กำหนด URL API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      // ส่งคำขอลบรถยนต์ไปที่ API
      await axios.delete(`${apiUrl}/cars/${carId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // เรียกใช้ callback เมื่อลบสำเร็จ
      onSuccess();
      
      // ปิด Modal
      onClose();
    } catch (err: any) {
      console.error('Delete car error:', err);
      if (err.response?.status === 403) {
        setError('คุณไม่มีสิทธิ์ในการลบรถยนต์นี้');
      } else if (err.response?.status === 401) {
        setError('Session หมดอายุ โปรดเข้าสู่ระบบอีกครั้ง');
      } else if (err.response?.status === 409) {
        setError('ไม่สามารถลบรถยนต์นี้ได้ เนื่องจากมีการเช่าที่เกี่ยวข้อง');
      } else {
        setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบรถยนต์');
      }
    } finally {
      setIsDeleting(false);
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
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">ยืนยันการลบรถยนต์</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    คุณแน่ใจหรือไม่ที่ต้องการลบรถ <span className="font-medium text-gray-700">{carName}</span>? <br />
                    การดำเนินการนี้ไม่สามารถเรียกคืนได้และจะลบข้อมูลรถยนต์ทั้งหมดออกจากระบบ
                  </p>
                </div>
                
                {error && (
                  <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {isDeleting ? 'กำลังลบ...' : 'ลบรถยนต์'}
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