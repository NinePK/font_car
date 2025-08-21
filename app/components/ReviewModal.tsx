// app/components/ReviewModal.tsx
'use client';

import { useState } from 'react';
import axios from 'axios';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: {
    rental_id: number;
    car_name: string;
    shop_name: string;
    start_date: string;
    end_date: string;
  };
  onSuccess: () => void;
}

export default function ReviewModal({ isOpen, onClose, rental, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating < 1 || rating > 5) {
      setError('กรุณาเลือกคะแนน 1-5 ดาว');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

      await axios.post(
        `${apiUrl}/reviews`,
        {
          rental_id: rental.rental_id,
          rating: rating,
          comment: comment.trim() || null
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      onSuccess();
      onClose();
      
      // Reset form
      setRating(5);
      setComment('');
      
    } catch (err: any) {
      console.error('Review submission error:', err);
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการส่งรีวิว');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setRating(5);
      setComment('');
      setError('');
      onClose();
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
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      เขียนรีวิว
                    </h3>
                    
                    {/* Car and rental info */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">{rental.car_name}</h4>
                      <p className="text-sm text-gray-600">ร้าน: {rental.shop_name}</p>
                      <p className="text-sm text-gray-600">
                        วันที่เช่า: {new Date(rental.start_date).toLocaleDateString('th-TH')} - {new Date(rental.end_date).toLocaleDateString('th-TH')}
                      </p>
                    </div>

                    {error && (
                      <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                      </div>
                    )}

                    {/* Rating */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        คะแนน
                      </label>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`text-2xl ${
                              star <= rating ? 'text-yellow-400' : 'text-gray-300'
                            } hover:text-yellow-400 transition-colors`}
                            disabled={submitting}
                          >
                            ★
                          </button>
                        ))}
                        <span className="ml-2 text-sm text-gray-600">
                          ({rating} ดาว)
                        </span>
                      </div>
                    </div>

                    {/* Comment */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ความคิดเห็น (ไม่บังคับ)
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="แบ่งปันประสบการณ์การใช้รถคันนี้..."
                        disabled={submitting}
                        maxLength={1000}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {comment.length}/1000 ตัวอักษร
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'กำลังส่ง...' : 'ส่งรีวิว'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}