// app/components/ImageUploadModal.tsx
'use client';

import { useState } from 'react';
import axios from 'axios';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  carId: number;
  onSuccess: () => void;
}

export default function ImageUploadModal({ isOpen, onClose, carId, onSuccess }: ImageUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
    }
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) {
      setUploadError('กรุณาเลือกรูปภาพ');
      return;
    }

    try {
      setUploadingImages(true);
      setUploadError('');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // สร้าง FormData
      const formData = new FormData();
      
      // ตรวจสอบขนาดไฟล์ก่อนอัปโหลด
      for (const file of selectedFiles) {
        if (file.size > 5 * 1024 * 1024) { // 5MB
          throw new Error('ไฟล์บางไฟล์มีขนาดใหญ่เกิน 5MB');
        }
        formData.append('car_images', file);
      }
      
      // กำหนดให้รูปแรกเป็นรูปหลัก
      formData.append('is_primary', 'true');

      // ตรวจสอบ API URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

      // เพิ่ม timeout ให้กับ request
      await axios.post(
        `${apiUrl}/cars/${carId}/images`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000 // 30 วินาที
        }
      );

      setUploadSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Upload images error:', err);
      if (err.message === 'ไฟล์บางไฟล์มีขนาดใหญ่เกิน 5MB') {
        setUploadError(err.message);
      } else if (err.response?.status === 413) {
        setUploadError('ไฟล์มีขนาดใหญ่เกินไป กรุณาลดขนาดไฟล์หรือแบ่งอัปโหลดหลายครั้ง');
      } else if (err.response?.status === 401) {
        setUploadError('Session หมดอายุ โปรดเข้าสู่ระบบอีกครั้ง');
      } else if (err.code === 'ECONNABORTED') {
        setUploadError('การอัปโหลดใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้งหรือลดขนาดไฟล์');
      } else {
        setUploadError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setUploadingImages(false);
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
          <div className="bg-gray-100 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="w-full">
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-black">อัปโหลดรูปภาพรถยนต์</h3>
                  <div className="mt-4">
                    {uploadSuccess && (
                      <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        อัปโหลดรูปภาพสำเร็จ!
                      </div>
                    )}

                    {uploadError && (
                      <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {uploadError}
                      </div>
                    )}

                    <div>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md bg-white">
                        <div className="space-y-1 text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="flex text-sm text-black justify-center">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                            >
                              <span>อัปโหลดรูปภาพ</span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                multiple
                                className="sr-only"
                                onChange={handleFileChange}
                                accept="image/*"
                                disabled={uploadingImages || uploadSuccess}
                              />
                            </label>
                            <p className="pl-1 text-black">หรือลากและวาง</p>
                          </div>
                          <p className="text-xs text-black">PNG, JPG, GIF สูงสุด 5MB</p>
                        </div>
                      </div>

                      {selectedFiles.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-black">เลือกแล้ว {selectedFiles.length} ไฟล์:</p>
                          <ul className="mt-2 text-sm text-black list-disc list-inside max-h-32 overflow-y-auto">
                            {selectedFiles.map((file, index) => (
                              <li key={index}>{file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={uploadImages}
              disabled={selectedFiles.length === 0 || uploadingImages || uploadSuccess}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {uploadingImages ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพ'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-black hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {uploadSuccess ? 'ปิด' : 'ยกเลิก'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}