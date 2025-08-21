// app/customer/search/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Link from 'next/link';
import axios from 'axios';
import { Moon, Sun, Search, Car, User, Filter, ArrowLeft, LogOut } from 'lucide-react';

interface Shop {
  id: number;
  username: string;
  shop_name: string;
  address?: string;
  profile_image?: string;
  car_count: number;
}

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
  daily_rate: number;
  status: 'available' | 'rented' | 'maintenance';
  image_url?: string;
  shop_name: string;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, isCustomer, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [shops, setShops] = useState<Shop[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'car' | 'shop'>('car');
  const [isMounted, setIsMounted] = useState(false);
  
  // ตัวกรองสำหรับรถยนต์
  const [filters, setFilters] = useState({
    car_type: '',
    min_price: '',
    max_price: '',
    transmission: '',
    fuel_type: '',
    seats: ''
  });

  // ดึงข้อมูลจาก query parameters
  useEffect(() => {
    if (searchParams) {
      const query = searchParams.get('q') || '';
      const type = searchParams.get('type') as 'car' | 'shop' || 'car';
      
      setSearchQuery(query);
      setSearchType(type);
      
      // ดึงตัวกรองจาก URL ถ้ามี
      const car_type = searchParams.get('car_type') || '';
      const min_price = searchParams.get('min_price') || '';
      const max_price = searchParams.get('max_price') || '';
      const transmission = searchParams.get('transmission') || '';
      const fuel_type = searchParams.get('fuel_type') || '';
      const seats = searchParams.get('seats') || '';
      
      setFilters({
        car_type,
        min_price,
        max_price,
        transmission,
        fuel_type,
        seats
      });
    }
  }, [searchParams]);

  const fetchSearchResults = async () => {
    try {
      setDataLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      if (searchType === 'car') {
        // สร้าง URL สำหรับการค้นหารถยนต์
        let url = `${process.env.NEXT_PUBLIC_API_URL}/cars?`;
        
        // เพิ่มพารามิเตอร์การค้นหา
        if (searchQuery) url += `&brand=${encodeURIComponent(searchQuery)}`;
        if (filters.car_type) url += `&car_type=${encodeURIComponent(filters.car_type)}`;
        if (filters.min_price) url += `&min_price=${encodeURIComponent(filters.min_price)}`;
        if (filters.max_price) url += `&max_price=${encodeURIComponent(filters.max_price)}`;
        if (filters.transmission) url += `&transmission=${encodeURIComponent(filters.transmission)}`;
        if (filters.fuel_type) url += `&fuel_type=${encodeURIComponent(filters.fuel_type)}`;
        if (filters.seats) url += `&seats=${encodeURIComponent(filters.seats)}`;
        
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setCars(response.data.cars);
        setShops([]);
      } else {
        // ค้นหาร้านเช่ารถ
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/shops`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // กรองร้านเช่ารถตามคำค้นหา
        let filteredShops = response.data.shops;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredShops = filteredShops.filter((shop: Shop) => 
            (shop.shop_name && shop.shop_name.toLowerCase().includes(query)) ||
            (shop.username && shop.username.toLowerCase().includes(query))
          );
        }
        
        setShops(filteredShops);
        setCars([]);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.response?.data?.message || 'Failed to search');
    } finally {
      setDataLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // สร้าง query string สำหรับ URL
    let query = `?type=${searchType}`;
    if (searchQuery) query += `&q=${encodeURIComponent(searchQuery)}`;
    
    // เพิ่มตัวกรอง
    if (searchType === 'car') {
      if (filters.car_type) query += `&car_type=${encodeURIComponent(filters.car_type)}`;
      if (filters.min_price) query += `&min_price=${encodeURIComponent(filters.min_price)}`;
      if (filters.max_price) query += `&max_price=${encodeURIComponent(filters.max_price)}`;
      if (filters.transmission) query += `&transmission=${encodeURIComponent(filters.transmission)}`;
      if (filters.fuel_type) query += `&fuel_type=${encodeURIComponent(filters.fuel_type)}`;
      if (filters.seats) query += `&seats=${encodeURIComponent(filters.seats)}`;
    }
    
    // อัปเดต URL และทำการค้นหา
    router.push(`/customer/search${query}`);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
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

  // โหลดผลการค้นหาเมื่อพารามิเตอร์เปลี่ยนแปลง
  useEffect(() => {
    if (user && isCustomer() && isMounted) {
      fetchSearchResults();
    }
  }, [user, searchParams, isMounted]);

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
    <div className="min-h-screen transition-colors duration-300"
         style={{ backgroundColor: 'var(--background)' }}>
      
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 shadow-lg border-b transition-all duration-300 backdrop-blur-sm"
           style={{
             backgroundColor: 'var(--card)',
             borderColor: 'var(--border)'
           }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300"
                     style={{ backgroundColor: 'var(--primary)' }}>
                  <Car className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold transition-colors duration-300"
                     style={{ color: 'var(--primary)' }}>ระบบเช่ารถ</h1>
              </div>
              
              {/* Navigation Links */}
              <div className="hidden md:flex space-x-6">
                <Link
                  href="/customer/dashboard"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-foreground)'
                  }}
                >
                  <span>หน้าแรก</span>
                </Link>
                <Link
                  href="/customer/bookings"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-foreground)'
                  }}
                >
                  <span>การจองของฉัน</span>
                </Link>
                <Link
                  href="/customer/search"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)'
                  }}
                >
                  <Search className="w-4 h-4" />
                  <span>ค้นหา</span>
                </Link>
              </div>
            </div>

            {/* User Menu & Actions */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <span className="text-sm transition-colors duration-300"
                      style={{ color: 'var(--muted-foreground)' }}>
                  สวัสดี, <span className="font-medium transition-colors duration-300"
                               style={{ color: 'var(--primary)' }}>{user.username}</span>
                </span>
              </div>
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-foreground)'
                }}
                aria-label={`เปลี่ยนธีม (ปัจจุบัน: ${theme === 'light' ? 'สว่าง' : 'มืด'})`}
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </button>
              
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{
                  backgroundColor: 'var(--destructive)',
                  color: 'var(--destructive-foreground)'
                }}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              {searchType === 'car' ? 'ค้นหารถเช่า' : 'ค้นหาร้านเช่ารถ'}
            </h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            {/* ส่วนของการค้นหา */}
            <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
              <div className="px-4 py-5 sm:p-6">
                <form onSubmit={handleSearch}>
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                      <div className="flex-1">
                        <label htmlFor="search" className="sr-only">ค้นหา</label>
                        <input
                          type="text"
                          id="search"
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-3 px-4"
                          placeholder="ค้นหารถเช่าหรือร้านเช่ารถ..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="flex-none">
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              id="search-car"
                              name="searchType"
                              type="radio"
                              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                              checked={searchType === 'car'}
                              onChange={() => setSearchType('car')}
                            />
                            <label htmlFor="search-car" className="block text-sm font-medium text-gray-700">
                              รถเช่า
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              id="search-shop"
                              name="searchType"
                              type="radio"
                              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                              checked={searchType === 'shop'}
                              onChange={() => setSearchType('shop')}
                            />
                            <label htmlFor="search-shop" className="block text-sm font-medium text-gray-700">
                              ร้านเช่ารถ
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ตัวกรองสำหรับการค้นหารถยนต์ */}
                    {searchType === 'car' && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
                        <div>
                          <label htmlFor="car_type" className="block text-sm font-medium text-gray-700">ประเภทรถ</label>
                          <select
                            id="car_type"
                            name="car_type"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            value={filters.car_type}
                            onChange={handleFilterChange}
                          >
                            <option value="">ทั้งหมด</option>
                            <option value="sedan">รถเก๋ง</option>
                            <option value="suv">รถ SUV</option>
                            <option value="hatchback">รถแฮทช์แบ็ค</option>
                            <option value="pickup">รถกระบะ</option>
                            <option value="van">รถตู้</option>
                            <option value="luxury">รถหรู</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="min_price" className="block text-sm font-medium text-gray-700">ราคาต่ำสุด</label>
                          <input
                            type="number"
                            id="min_price"
                            name="min_price"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            value={filters.min_price}
                            onChange={handleFilterChange}
                            placeholder="฿"
                          />
                        </div>
                        <div>
                          <label htmlFor="max_price" className="block text-sm font-medium text-gray-700">ราคาสูงสุด</label>
                          <input
                            type="number"
                            id="max_price"
                            name="max_price"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            value={filters.max_price}
                            onChange={handleFilterChange}
                            placeholder="฿"
                          />
                        </div>
                        <div>
                          <label htmlFor="transmission" className="block text-sm font-medium text-gray-700">เกียร์</label>
                          <select
                            id="transmission"
                            name="transmission"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            value={filters.transmission}
                            onChange={handleFilterChange}
                          >
                            <option value="">ทั้งหมด</option>
                            <option value="auto">อัตโนมัติ</option>
                            <option value="manual">ธรรมดา</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="fuel_type" className="block text-sm font-medium text-gray-700">เชื้อเพลิง</label>
                          <select
                            id="fuel_type"
                            name="fuel_type"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            value={filters.fuel_type}
                            onChange={handleFilterChange}
                          >
                            <option value="">ทั้งหมด</option>
                            <option value="gasoline">น้ำมันเบนซิน</option>
                            <option value="diesel">น้ำมันดีเซล</option>
                            <option value="hybrid">ไฮบริด</option>
                            <option value="electric">ไฟฟ้า</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="seats" className="block text-sm font-medium text-gray-700">จำนวนที่นั่ง</label>
                          <select
                            id="seats"
                            name="seats"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            value={filters.seats}
                            onChange={handleFilterChange}
                          >
                            <option value="">ทั้งหมด</option>
                            <option value="2">2 ที่นั่ง</option>
                            <option value="4">4 ที่นั่ง</option>
                            <option value="5">5 ที่นั่ง</option>
                            <option value="7">7 ที่นั่ง</option>
                            <option value="9">9+ ที่นั่ง</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end mt-4">
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        ค้นหา
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* แสดงข้อผิดพลาด */}
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* แสดงผลการค้นหา */}
            <div>
              <h2 className="text-2xl font-bold mb-5">
                ผลการค้นหา {searchQuery && `"${searchQuery}"`}
              </h2>

              {dataLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                  <p className="mt-2">กำลังโหลดข้อมูล...</p>
                </div>
              ) : searchType === 'car' ? (
                // แสดงผลการค้นหารถยนต์
                cars.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <p>ไม่พบรถยนต์ที่ตรงกับเงื่อนไขการค้นหา</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {cars.map((car) => (
                      <div key={car.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-300">
                        <div className="h-48 bg-gray-200 relative">
                          {car.image_url ? (
                            <img 
                              src={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'}${car.image_url}`} 
                              alt={`${car.brand} ${car.model}`} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex justify-center items-center h-full bg-gray-200 text-gray-400">
                              ไม่มีรูปภาพ
                            </div>
                          )}
                          <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded ${
                            car.status === 'available' ? 'bg-green-500 text-white' :
                            car.status === 'rented' ? 'bg-red-500 text-white' :
                            car.status === 'maintenance' ? 'bg-yellow-500 text-white' :
                            'bg-gray-500 text-white'
                          }`}>
                            {car.status === 'available' ? 'พร้อมเช่า' :
                             car.status === 'rented' ? 'ถูกจองแล้ว' :
                             car.status === 'maintenance' ? 'ซ่อมบำรุง' :
                             'ไม่พร้อมให้บริการ'}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold">{car.brand} {car.model}</h3>
                          <p className="text-gray-600">ปี {car.year} • ประเภท: {car.car_type}</p>
                          <p className="text-gray-600">ร้าน: {car.shop_name}</p>
                          <p className="text-gray-600">
                            {car.seats} ที่นั่ง • {car.transmission === 'auto' ? 'เกียร์อัตโนมัติ' : 'เกียร์ธรรมดา'} • 
                            {car.fuel_type === 'gasoline' ? ' เบนซิน' : 
                             car.fuel_type === 'diesel' ? ' ดีเซล' : 
                             car.fuel_type === 'hybrid' ? ' ไฮบริด' : ' ไฟฟ้า'}
                          </p>
                          <p className="text-green-600 font-semibold mt-2">฿{car.daily_rate.toLocaleString()}/วัน</p>
                          <div className="mt-4">
                            {car.status === 'available' ? (
                              <Link href={`/customer/cars/${car.id}`}>
                                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded">
                                  ดูรายละเอียด
                                </button>
                              </Link>
                            ) : (
                              <button 
                                disabled 
                                className="w-full bg-gray-400 text-white text-sm py-2 px-4 rounded cursor-not-allowed"
                              >
                                ถูกจองแล้ว
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                // แสดงผลการค้นหาร้านเช่ารถ
                shops.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <p>ไม่พบร้านเช่ารถที่ตรงกับเงื่อนไขการค้นหา</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {shops.map((shop) => (
                      <div key={shop.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-300">
                        <div className="p-6">
                          <div className="flex items-center">
                            <div className="h-14 w-14 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center">
                              {shop.profile_image ? (
                                <img 
                                  src={shop.profile_image} 
                                  alt={shop.shop_name} 
                                  className="h-14 w-14 rounded-full object-cover"
                                />
                              ) : (
                                <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="ml-4">
                              <h3 className="text-lg font-semibold">{shop.shop_name || shop.username}</h3>
                              <p className="text-gray-500 text-sm">{shop.car_count} รถให้เช่า</p>
                              {shop.address && (
                                <p className="text-gray-600 text-sm mt-1 truncate max-w-xs">{shop.address}</p>
                              )}
                            </div>
                          </div>
                          <div className="mt-4">
                            <Link href={`/customer/shops/${shop.id}`}>
                              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2 px-4 rounded">
                                ดูร้านเช่ารถ
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}