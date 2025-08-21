// app/components/EditCarModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import axios from 'axios';

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
  description?: string;
  status: 'available' | 'rented' | 'maintenance' | 'deleted';
}

interface EditCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  car: Car | null;
}

interface EditCarFormInputs {
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  car_type: 'sedan' | 'suv' | 'hatchback' | 'pickup' | 'van' | 'luxury';
  transmission: 'auto' | 'manual';
  fuel_type: 'gasoline' | 'diesel' | 'hybrid' | 'electric';
  seats: number;
  color: string;
  daily_rate: number;
  description?: string;
  status: 'available' | 'rented' | 'maintenance' | 'deleted';
}

export default function EditCarModal({ isOpen, onClose, onSuccess, car }: EditCarModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue
  } = useForm<EditCarFormInputs>();

  // เรียกใช้ useEffect เพื่อรีเซ็ตฟอร์มเมื่อ car เปลี่ยนแปลง
  useEffect(() => {
    if (car) {
      setValue('brand', car.brand);
      setValue('model', car.model);
      setValue('year', car.year);
      setValue('license_plate', car.license_plate);
      setValue('car_type', car.car_type as any);
      setValue('transmission', car.transmission as any);
      setValue('fuel_type', car.fuel_type as any);
      setValue('seats', car.seats);
      setValue('color', car.color);
      setValue('daily_rate', car.daily_rate);
      setValue('description', car.description || '');
      setValue('status', car.status);
    }
  }, [car, setValue]);

  const carTypes = [
    { value: 'sedan', label: 'รถเก๋ง' },
    { value: 'suv', label: 'รถ SUV' },
    { value: 'hatchback', label: 'รถแฮทช์แบ็ค' },
    { value: 'pickup', label: 'รถกระบะ' },
    { value: 'van', label: 'รถตู้' },
    { value: 'luxury', label: 'รถหรู' }
  ];

  const transmissionTypes = [
    { value: 'auto', label: 'อัตโนมัติ' },
    { value: 'manual', label: 'ธรรมดา' }
  ];

  const fuelTypes = [
    { value: 'gasoline', label: 'น้ำมันเบนซิน' },
    { value: 'diesel', label: 'น้ำมันดีเซล' },
    { value: 'hybrid', label: 'ไฮบริด' },
    { value: 'electric', label: 'ไฟฟ้า' }
  ];

  const statusTypes = [
    { value: 'available', label: 'ว่าง' },
    { value: 'rented', label: 'ถูกเช่า' },
    { value: 'maintenance', label: 'อยู่ระหว่างซ่อมบำรุง' }
  ];

  const onSubmit: SubmitHandler<EditCarFormInputs> = async (data) => {
    if (!car) return;
    
    try {
      setIsSubmitting(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // กำหนด URL API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      // ส่งข้อมูลไปอัปเดตที่ API
      await axios.put(
        `${apiUrl}/cars/${car.id}`,
        data,
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
      console.error('Update car error:', err);
      if (err.response?.status === 403) {
        setError('คุณไม่มีสิทธิ์ในการแก้ไขรถยนต์นี้');
      } else if (err.response?.status === 401) {
        setError('Session หมดอายุ โปรดเข้าสู่ระบบอีกครั้ง');
      } else {
        setError(err.response?.data?.message || 'Failed to update car');
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
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full relative z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="w-full">
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">แก้ไขข้อมูลรถยนต์</h3>
                  <div className="mt-4">
                    {error && (
                      <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                            ยี่ห้อรถ
                          </label>
                          <input
                            id="brand"
                            type="text"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                            {...register('brand', { required: 'กรุณากรอกยี่ห้อรถ' })}
                          />
                          {errors.brand && (
                            <p className="mt-2 text-sm text-red-600">{errors.brand.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                            รุ่นรถ
                          </label>
                          <input
                            id="model"
                            type="text"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                            {...register('model', { required: 'กรุณากรอกรุ่นรถ' })}
                          />
                          {errors.model && (
                            <p className="mt-2 text-sm text-red-600">{errors.model.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                            ปีรถ
                          </label>
                          <input
                            id="year"
                            type="number"
                            min="1990"
                            max={new Date().getFullYear() + 1}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                            {...register('year', {
                              required: 'กรุณากรอกปีรถ',
                              min: {
                                value: 1990,
                                message: 'ปีรถต้องตั้งแต่ 1990 เป็นต้นไป'
                              },
                              max: {
                                value: new Date().getFullYear() + 1,
                                message: `ปีรถต้องไม่เกิน ${new Date().getFullYear() + 1}`
                              }
                            })}
                          />
                          {errors.year && (
                            <p className="mt-2 text-sm text-red-600">{errors.year.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="license_plate" className="block text-sm font-medium text-gray-700">
                            ทะเบียนรถ
                          </label>
                          <input
                            id="license_plate"
                            type="text"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                            {...register('license_plate', { required: 'กรุณากรอกทะเบียนรถ' })}
                          />
                          {errors.license_plate && (
                            <p className="mt-2 text-sm text-red-600">{errors.license_plate.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="car_type" className="block text-sm font-medium text-gray-700">
                            ประเภทรถ
                          </label>
                          <select
                            id="car_type"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                            {...register('car_type', { required: 'กรุณาเลือกประเภทรถ' })}
                          >
                            {carTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                          {errors.car_type && (
                            <p className="mt-2 text-sm text-red-600">{errors.car_type.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="transmission" className="block text-sm font-medium text-gray-700">
                            ระบบเกียร์
                          </label>
                          <select
                            id="transmission"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                            {...register('transmission', { required: 'กรุณาเลือกระบบเกียร์' })}
                          >
                            {transmissionTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                          {errors.transmission && (
                            <p className="mt-2 text-sm text-red-600">{errors.transmission.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="fuel_type" className="block text-sm font-medium text-gray-700">
                            ประเภทเชื้อเพลิง
                          </label>
                          <select
                            id="fuel_type"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                            {...register('fuel_type', { required: 'กรุณาเลือกประเภทเชื้อเพลิง' })}
                          >
                            {fuelTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                          {errors.fuel_type && (
                            <p className="mt-2 text-sm text-red-600">{errors.fuel_type.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="seats" className="block text-sm font-medium text-gray-700">
                            จำนวนที่นั่ง
                          </label>
                          <input
                            id="seats"
                            type="number"
                            min="2"
                            max="15"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                            {...register('seats', {
                              required: 'กรุณากรอกจำนวนที่นั่ง',
                              min: {
                                value: 2,
                                message: 'จำนวนที่นั่งต้องมีอย่างน้อย 2 ที่นั่ง'
                              },
                              max: {
                                value: 15,
                                message: 'จำนวนที่นั่งต้องไม่เกิน 15 ที่นั่ง'
                              }
                            })}
                          />
                          {errors.seats && (
                            <p className="mt-2 text-sm text-red-600">{errors.seats.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                            สีรถ
                          </label>
                          <input
                            id="color"
                            type="text"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                            {...register('color', { required: 'กรุณากรอกสีรถ' })}
                          />
                          {errors.color && (
                            <p className="mt-2 text-sm text-red-600">{errors.color.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="daily_rate" className="block text-sm font-medium text-gray-700">
                            ราคาเช่าต่อวัน (บาท)
                          </label>
                          <input
                            id="daily_rate"
                            type="number"
                            min="0"
                            step="0.01"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                            {...register('daily_rate', {
                              required: 'กรุณากรอกราคาเช่าต่อวัน',
                              min: {
                                value: 0,
                                message: 'ราคาเช่าต้องไม่ต่ำกว่า 0 บาท'
                              }
                            })}
                          />
                          {errors.daily_rate && (
                            <p className="mt-2 text-sm text-red-600">{errors.daily_rate.message}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                            สถานะรถ
                          </label>
                          <select
                            id="status"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                            {...register('status', { required: 'กรุณาเลือกสถานะรถ' })}
                          >
                            {statusTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                          {errors.status && (
                            <p className="mt-2 text-sm text-red-600">{errors.status.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                          รายละเอียดเพิ่มเติม
                        </label>
                        <textarea
                          id="description"
                          rows={3}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                          {...register('description')}
                        ></textarea>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
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