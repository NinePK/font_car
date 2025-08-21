// app/components/AddCarModal.tsx
'use client';

import { useState } from 'react';
import axios from 'axios';

interface AddCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (carId: number) => void;
}

export default function AddCarModal({ isOpen, onClose, onSuccess }: AddCarModalProps) {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    car_type: 'sedan',
    transmission: 'auto',
    fuel_type: 'gasoline',
    seats: 4,
    color: '',
    daily_rate: '',
    insurance_rate: '', // เพิ่มฟิลด์ค่าประกัน
    description: ''
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // ฟังก์ชันตรวจสอบความถูกต้องของเบอร์พร้อมเพย์
  const validatePromptPay = (value: string): boolean => {
    // เบอร์โทรศัพท์ (10 หลัก) หรือเลขประจำตัวประชาชน (13 หลัก)
    if (!value) return false; // ไม่อนุญาตให้เป็นค่าว่าง

    const digitsOnly = value.replace(/\D/g, '');

    if (digitsOnly.length === 10) {
      // ตรวจสอบว่าเป็นรูปแบบเบอร์โทรศัพท์
      return /^0[1-9]\d{8}$/.test(digitsOnly);
    } else if (digitsOnly.length === 13) {
      // ตรวจสอบเลขประจำตัวประชาชน (แบบง่าย)
      return /^\d{13}$/.test(digitsOnly);
    }

    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);


    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      // ส่งข้อมูลไปยัง API
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/cars`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // เรียกใช้งาน callback หลังจากเพิ่มรถสำเร็จ
      onSuccess(response.data.carId);
      
      // รีเซ็ตฟอร์ม
      setFormData({
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        license_plate: '',
        car_type: 'sedan',
        transmission: 'auto',
        fuel_type: 'gasoline',
        seats: 4,
        color: '',
        daily_rate: '',
        insurance_rate: '',
        description: ''
      });
      
    } catch (err: any) {
      console.error('Add car error:', err);
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด โปรดลองอีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  if (!isOpen) return null;

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity cursor-pointer" 
          aria-hidden="true"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal content */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div 
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  เพิ่มรถใหม่
                </h3>
                
                {error && (
                  <div className="mt-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                        ยี่ห้อ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="brand"
                        name="brand"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.brand}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                        รุ่น <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="model"
                        name="model"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.model}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                        ปี <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="year"
                        name="year"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.year}
                        onChange={handleInputChange}
                        required
                      >
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="license_plate" className="block text-sm font-medium text-gray-700 mb-1">
                        ทะเบียนรถ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="license_plate"
                        name="license_plate"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.license_plate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="car_type" className="block text-sm font-medium text-gray-700 mb-1">
                        ประเภทรถ <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="car_type"
                        name="car_type"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.car_type}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="sedan">รถเก๋ง</option>
                        <option value="suv">รถ SUV</option>
                        <option value="hatchback">รถแฮทช์แบ็ค</option>
                        <option value="pickup">รถกระบะ</option>
                        <option value="van">รถตู้</option>
                        <option value="luxury">รถหรู</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="transmission" className="block text-sm font-medium text-gray-700 mb-1">
                        เกียร์ <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="transmission"
                        name="transmission"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.transmission}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="auto">อัตโนมัติ</option>
                        <option value="manual">ธรรมดา</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="fuel_type" className="block text-sm font-medium text-gray-700 mb-1">
                        เชื้อเพลิง <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="fuel_type"
                        name="fuel_type"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.fuel_type}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="gasoline">น้ำมันเบนซิน</option>
                        <option value="diesel">น้ำมันดีเซล</option>
                        <option value="hybrid">ไฮบริด</option>
                        <option value="electric">ไฟฟ้า</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="seats" className="block text-sm font-medium text-gray-700 mb-1">
                        จำนวนที่นั่ง <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="seats"
                        name="seats"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.seats}
                        onChange={handleInputChange}
                        required
                      >
                        {[2, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((seat) => (
                          <option key={seat} value={seat}>{seat} ที่นั่ง</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                        สี <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="color"
                        name="color"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.color}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="daily_rate" className="block text-sm font-medium text-gray-700 mb-1">
                        ราคาเช่าต่อวัน (บาท) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="daily_rate"
                        name="daily_rate"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.daily_rate}
                        onChange={handleInputChange}
                        required
                        min="0"
                      />
                    </div>

                    {/* เพิ่มฟิลด์ค่าประกันต่อวัน */}
                    <div>
                      <label htmlFor="insurance_rate" className="block text-sm font-medium text-gray-700 mb-1">
                        ค่าประกันต่อวัน (บาท)
                      </label>
                      <input
                        type="number"
                        id="insurance_rate"
                        name="insurance_rate"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={formData.insurance_rate}
                        onChange={handleInputChange}
                        min="0"
                        placeholder="0 (ไม่บังคับ)"
                      />
                    </div>

                  </div>
                  
                  <div className="mt-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      รายละเอียดเพิ่มเติม
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'กำลังบันทึก...' : 'เพิ่มรถยนต์'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}