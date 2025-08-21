// app/shop/cars/add/page.tsx
'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';
import axios from 'axios';
import { User } from 'lucide-react';

interface AddCarFormInputs {
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
  insurance_rate?: number;
  description?: string;
}

export default function AddCar() {
  const router = useRouter();
  const { user, loading, isShop } = useAuth();
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carId, setCarId] = useState<number | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AddCarFormInputs>({
    defaultValues: {
      year: new Date().getFullYear(),
      seats: 5,
      car_type: 'sedan',
      transmission: 'auto',
      fuel_type: 'gasoline'
    }
  });

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

  const onSubmit: SubmitHandler<AddCarFormInputs> = async (data) => {
    try {
      setIsSubmitting(true);
      setSubmitError('');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }


      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/cars`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setCarId(response.data.carId);
      setShowImageUpload(true);
    } catch (err: any) {
      console.error('Add car error:', err);
      setSubmitError(err.response?.data?.message || 'Failed to add car');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
    }
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0 || !carId) {
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

      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('car_images', file);
      });
      formData.append('is_primary', 'true'); // กำหนดให้รูปแรกเป็นรูปหลัก

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/cars/${carId}/images`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setUploadSuccess(true);
      setTimeout(() => {
        router.push('/shop/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Upload images error:', err);
      setUploadError(err.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  // ตรวจสอบว่าเป็นร้านเช่ารถหรือไม่
  if (!loading && user && !isShop()) {
    router.push('/');
    return null;
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
                <h1 className="text-xl font-bold">ระบบจัดการเช่ารถ</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/shop/dashboard"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  แดชบอร์ด
                </Link>
                <Link
                  href="/shop/cars"
                  className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
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
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
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
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--muted)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <User className="w-4 h-4 inline mr-2" />
                  โปรไฟล์
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">เพิ่มรถยนต์ใหม่</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
              {submitError && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {submitError}
                </div>
              )}

              {!showImageUpload ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                        ยี่ห้อรถ <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="brand"
                        type="text"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        {...register('brand', { required: 'กรุณากรอกยี่ห้อรถ' })}
                      />
                      {errors.brand && (
                        <p className="mt-2 text-sm text-red-600">{errors.brand.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                        รุ่นรถ <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="model"
                        type="text"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        {...register('model', { required: 'กรุณากรอกรุ่นรถ' })}
                      />
                      {errors.model && (
                        <p className="mt-2 text-sm text-red-600">{errors.model.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                        ปีรถ <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="year"
                        type="number"
                        min="1990"
                        max={new Date().getFullYear() + 1}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                        ทะเบียนรถ <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="license_plate"
                        type="text"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        {...register('license_plate', { required: 'กรุณากรอกทะเบียนรถ' })}
                      />
                      {errors.license_plate && (
                        <p className="mt-2 text-sm text-red-600">{errors.license_plate.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="car_type" className="block text-sm font-medium text-gray-700">
                        ประเภทรถ <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="car_type"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                        ระบบเกียร์ <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="transmission"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                        ประเภทเชื้อเพลิง <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="fuel_type"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                        จำนวนที่นั่ง <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="seats"
                        type="number"
                        min="2"
                        max="15"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                        สีรถ <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="color"
                        type="text"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        {...register('color', { required: 'กรุณากรอกสีรถ' })}
                      />
                      {errors.color && (
                        <p className="mt-2 text-sm text-red-600">{errors.color.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="daily_rate" className="block text-sm font-medium text-gray-700">
                        ราคาเช่าต่อวัน (บาท) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="daily_rate"
                        type="number"
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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

                  </div>

                  <div>
                    <label htmlFor="insurance_rate" className="block text-sm font-medium text-gray-700">
                      ค่าประกันต่อวัน (บาท)
                    </label>
                    <input
                      id="insurance_rate"
                      type="number"
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      {...register('insurance_rate', {
                        min: {
                          value: 0,
                          message: 'ค่าประกันต้องไม่ต่ำกว่า 0 บาท'
                        }
                      })}
                      placeholder="0 (ไม่บังคับ)"
                    />
                    {errors.insurance_rate && (
                      <p className="mt-2 text-sm text-red-600">{errors.insurance_rate.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      กรอกค่าประกันรถต่อวัน (หากไม่มีให้เว้นว่าง)
                    </p>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      รายละเอียดเพิ่มเติม
                    </label>
                    <textarea
                      id="description"
                      rows={4}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      {...register('description')}
                    ></textarea>
                  </div>

                  <div className="flex justify-end">
                    <Link href="/shop/dashboard">
                      <button
                        type="button"
                        className="bg-gray-200 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                      >
                        ยกเลิก
                      </button>
                    </Link>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลรถยนต์'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="bg-green-50 border-l-4 border-green-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700">
                          บันทึกข้อมูลรถยนต์สำเร็จ! กรุณาอัปโหลดรูปภาพรถยนต์
                        </p>
                      </div>
                    </div>
                  </div>

                  {uploadError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                      {uploadError}
                    </div>
                  )}

                  {uploadSuccess && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                      อัปโหลดรูปภาพสำเร็จ! กำลังนำคุณไปยังหน้าแดชบอร์ด...
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">รูปภาพรถยนต์</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
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
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="car-images"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                          >
                            <span>อัปโหลดรูปภาพ</span>
                            <input
                              id="car-images"
                              name="car-images"
                              type="file"
                              multiple
                              className="sr-only"
                              accept="image/*"
                              onChange={handleFileChange}
                              disabled={uploadingImages || uploadSuccess}
                            />
                          </label>
                          <p className="pl-1">หรือลากและวาง</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF สูงสุด 5MB</p>
                      </div>
                    </div>
                    {selectedFiles.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500">เลือกแล้ว {selectedFiles.length} ไฟล์:</p>
                        <ul className="mt-2 text-sm text-gray-500 list-disc list-inside">
                          {selectedFiles.map((file, index) => (
                            <li key={index}>{file.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => router.push('/shop/dashboard')}
                      className="bg-gray-200 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                    >
                      ข้ามการอัปโหลดรูปภาพ
                    </button>
                    <button
                      type="button"
                      onClick={uploadImages}
                      disabled={selectedFiles.length === 0 || uploadingImages || uploadSuccess}
                      className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {uploadingImages ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพ'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}