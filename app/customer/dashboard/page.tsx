// app/customer/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Link from 'next/link';
import axios from 'axios';
import { Search, Car, Calendar, Star, MapPin, User, LogOut, Bell, MessageSquare, Moon, Sun } from 'lucide-react';

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
  daily_rate: number;
  status: 'available' | 'rented' | 'maintenance';
  image_url?: string;
  shop_name: string;
  shop_id: number;
}

interface RentalNotification {
  id: number;
  car_id: number;
  start_date: string;
  end_date: string;
  rental_status: string;
  payment_status: string;
  total_amount: number;
  brand: string;
  model: string;
  year: number;
  image_url?: string;
  shop_name: string;
  shop_username: string;
}

interface ReviewableRental {
  rental_id: number;
  start_date: string;
  end_date: string;
  car_name: string;
  car_id: number;
  shop_name: string;
  shop_id: number;
}

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [availableCars, setAvailableCars] = useState<Car[]>([]);
  const [notifications, setNotifications] = useState<RentalNotification[]>([]);
  const [reviewableRentals, setReviewableRentals] = useState<ReviewableRental[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'customer') {
      router.push('/login');
      return;
    }

    fetchShops();
    fetchAvailableCars();
    fetchNotifications();
    fetchReviewableRentals();
  }, [user, router]);

  // Auto search with debounce - เอา state updates ออก
  useEffect(() => {
    if (!searchTerm.trim()) {
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
  }, [searchTerm]);

  const fetchShops = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await axios.get(`${apiUrl}/shops`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setShops(response.data.shops);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching shops:', err);
      setError(err.response?.data?.message || 'Failed to fetch shops');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCars = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await axios.get(`${apiUrl}/cars`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // เรียงรถตามร้านเช่ารถและเอาเฉพาะรถที่พร้อมจอง
      const cars = response.data.cars || [];
      const availableCarsOnly = cars
        .filter((car: Car) => car.status === 'available')
        .sort((a: Car, b: Car) => {
          // เรียงตามชื่อร้านก่อน แล้วตามชื่อรถ
          if (a.shop_name !== b.shop_name) {
            return a.shop_name.localeCompare(b.shop_name);
          }
          return `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
        });
      
      setAvailableCars(availableCarsOnly);
    } catch (err: any) {
      console.error('Error fetching available cars:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await axios.get(`${apiUrl}/customer/rentals`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setNotifications(response.data.rentals || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const fetchReviewableRentals = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await axios.get(`${apiUrl}/reviews/reviewable-rentals`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setReviewableRentals(response.data.rentals || []);
    } catch (err) {
      console.error('Error fetching reviewable rentals:', err);
    }
  };

  // คำนวณผลการค้นหาด้วย useMemo เพื่อป้องกัน re-render
  const searchResults = useMemo(() => {
    if (!searchTerm.trim() || !availableCars.length) {
      return [];
    }

    const searchQuery = searchTerm.toLowerCase().trim();
    
    return availableCars.filter((car: Car) => {
      return (
        car.brand?.toLowerCase().includes(searchQuery) ||
        car.model?.toLowerCase().includes(searchQuery) ||
        car.shop_name?.toLowerCase().includes(searchQuery) ||
        car.car_type?.toLowerCase().includes(searchQuery) ||
        car.license_plate?.toLowerCase().includes(searchQuery) ||
        `${car.brand} ${car.model}`.toLowerCase().includes(searchQuery)
      );
    });
  }, [searchTerm, availableCars]);

  const handleSearch = useCallback(() => {
    // ไม่ต้องทำอะไร เพราะ useMemo จะจัดการให้
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setHasSearched(false);
    setError(null);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // จัดกลุ่มรถตามร้าน
  const groupCarsByShop = (cars: Car[] = availableCars) => {
    const grouped = cars.reduce((acc: { [key: string]: Car[] }, car) => {
      if (!acc[car.shop_name]) {
        acc[car.shop_name] = [];
      }
      acc[car.shop_name].push(car);
      return acc;
    }, {});
    
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  };

  if (!user) {
    return null;
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
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)'
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
                  <Calendar className="w-4 h-4" />
                  <span>การจองของฉัน</span>
                </Link>
                <Link
                  href="/customer/reviews"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 relative"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-foreground)'
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>รีวิว</span>
                  {reviewableRentals.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300"
                          style={{
                            backgroundColor: 'var(--warning)',
                            color: 'var(--warning-foreground)'
                          }}>
                      {reviewableRentals.length}
                    </span>
                  )}
                </Link>
                <Link
                  href="/customer/profile"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-foreground)'
                  }}
                >
                  <User className="w-4 h-4" />
                  <span>โปรไฟล์</span>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Hero Search Section */}
        <div className="relative mb-12">
          <div className="absolute inset-0 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 transition-colors duration-300"
                 style={{
                   background: 'linear-gradient(135deg, var(--primary) 0%, var(--ring) 100%)'
                 }}></div>
            <div className="absolute inset-0 opacity-10"
                 style={{
                   backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)'
                 }}></div>
          </div>
          
          <div className="relative px-8 py-16 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              ค้นหารถเช่าที่ใช่สำหรับคุณ
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              ค้นหารถยนต์ที่ต้องการจากร้านค้าต่าง ๆ พร้อมบริการเช่าที่ดีที่สุด
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="ค้นหารถยนต์, ยี่ห้อ, หรือร้านค้า..."
                    value={searchTerm}
                    onChange={handleInputChange}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-12 pr-12 py-4 text-lg border-0 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-white/20 transition-all duration-300"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      color: 'var(--foreground)'
                    }}
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-300"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  disabled={!searchTerm.trim()}
                  className="px-8 py-4 bg-white text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg"
                  style={{ color: 'var(--primary)' }}
                >
                  ค้นหา
                </button>
              </div>
              
              {/* Search Results Info */}
              {hasSearched && (
                <div className="mt-4 text-center text-white/80">
                  {searchResults.length > 0 ? (
                    <p>พบรถยนต์ {searchResults.length} คัน สำหรับ "{searchTerm}"</p>
                  ) : (
                    <p>ไม่พบรถยนต์สำหรับ "{searchTerm}"</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats - Reviewable Rentals Only */}
        {reviewableRentals.length > 0 && (
          <div className="mb-12">
            <div className="max-w-md mx-auto">
              <div className="rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl"
                   style={{
                     backgroundColor: 'var(--card)',
                     borderColor: 'var(--border)'
                   }}>
                <div className="p-6 border-b transition-colors duration-300"
                     style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300"
                         style={{ backgroundColor: 'var(--warning)' }}>
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold transition-colors duration-300"
                         style={{ color: 'var(--foreground)' }}>รอรีวิว</h2>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold transition-colors duration-300"
                         style={{ color: 'var(--warning)' }}>
                      {reviewableRentals.length}
                    </div>
                    <p className="text-sm transition-colors duration-300"
                       style={{ color: 'var(--muted-foreground)' }}>
                      การเช่าที่รอรีวิว
                    </p>
                  </div>
                  
                  <Link
                    href="/customer/reviews"
                    className="w-full inline-flex justify-center items-center space-x-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                    style={{
                      backgroundColor: 'var(--warning)',
                      color: 'var(--warning-foreground)'
                    }}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>เขียนรีวิว</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Available Cars by Shop Section or Search Results */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300"
                   style={{ backgroundColor: 'var(--primary)' }}>
                <Car className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold transition-colors duration-300"
                   style={{ color: 'var(--foreground)' }}>
                {hasSearched ? `ผลการค้นหา "${searchTerm}"` : 'รถยนต์พร้อมจอง'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              {hasSearched && (
                <button
                  onClick={clearSearch}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-foreground)'
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>ล้างการค้นหา</span>
                </button>
              )}
              <Link href="/customer/search" 
                    className="text-sm font-medium transition-all duration-300 hover:scale-105"
                    style={{ color: 'var(--primary)' }}>
                ค้นหาขั้นสูง →
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 rounded-2xl shadow-lg border transition-colors duration-300"
                 style={{
                   backgroundColor: 'var(--card)',
                   borderColor: 'var(--border)'
                 }}>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto transition-colors duration-300"
                   style={{ borderColor: 'var(--primary)' }}></div>
              <p className="mt-4 text-lg transition-colors duration-300"
                 style={{ color: 'var(--muted-foreground)' }}>กำลังโหลดรถยนต์...</p>
            </div>
          ) : hasSearched ? (
            // แสดงผลการค้นหา
            searchResults.length > 0 ? (
              <div className="space-y-8">
                {groupCarsByShop(searchResults).map(([shopName, cars]) => (
                  <div key={shopName} 
                       className="rounded-2xl shadow-lg border transition-all duration-300"
                       style={{
                         backgroundColor: 'var(--card)',
                         borderColor: 'var(--border)'
                       }}>
                    {/* Shop Header */}
                    <div className="p-6 border-b transition-colors duration-300"
                         style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300"
                             style={{ backgroundColor: 'var(--accent)' }}>
                          <User className="w-4 h-4" style={{ color: 'var(--accent-foreground)' }} />
                        </div>
                        <h3 className="text-lg font-semibold transition-colors duration-300"
                             style={{ color: 'var(--foreground)' }}>
                          {shopName}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-300"
                              style={{
                                backgroundColor: 'var(--primary)',
                                color: 'var(--primary-foreground)'
                              }}>
                          {cars.length} คันพบ
                        </span>
                      </div>
                    </div>
                    
                    {/* Cars Grid */}
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cars.map((car) => (
                          <div key={car.id} 
                               className="group rounded-xl shadow-md overflow-hidden hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 border"
                               style={{
                                 backgroundColor: 'var(--card)',
                                 borderColor: 'var(--border)'
                               }}>
                            {/* Car Image */}
                            <div className="relative overflow-hidden">
                              {car.image_url ? (
                                <img
                                  src={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'}${car.image_url}`}
                                  alt={`${car.brand} ${car.model}`}
                                  className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-40 flex items-center justify-center transition-colors duration-300"
                                     style={{ backgroundColor: 'var(--muted)' }}>
                                  <Car className="w-12 h-12" style={{ color: 'var(--muted-foreground)' }} />
                                </div>
                              )}
                              
                              {/* Status Badge */}
                              <div className="absolute top-2 right-2">
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors duration-300"
                                      style={{
                                        backgroundColor: 'var(--success)',
                                        color: 'var(--success-foreground)'
                                      }}>
                                  พร้อมจอง
                                </span>
                              </div>
                            </div>

                            {/* Car Details */}
                            <div className="p-4">
                              <div className="mb-3">
                                <h4 className="text-lg font-bold mb-1 transition-colors duration-300"
                                     style={{ color: 'var(--foreground)' }}>
                                  {car.brand} {car.model}
                                </h4>
                                <p className="text-sm transition-colors duration-300"
                                   style={{ color: 'var(--muted-foreground)' }}>
                                  ปี {car.year} • {car.car_type}
                                </p>
                              </div>

                              {/* Price & Action */}
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-lg font-bold transition-colors duration-300"
                                        style={{ color: 'var(--primary)' }}>
                                    ฿{car.daily_rate?.toLocaleString()}
                                  </span>
                                  <span className="text-xs transition-colors duration-300 ml-1"
                                        style={{ color: 'var(--muted-foreground)' }}>/วัน</span>
                                </div>
                                
                                <Link
                                  href={`/customer/cars/${car.id}`}
                                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                                  style={{
                                    backgroundColor: 'var(--primary)',
                                    color: 'var(--primary-foreground)'
                                  }}
                                >
                                  ดูรายละเอียด
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // ไม่พบผลการค้นหา
              <div className="text-center py-16 rounded-2xl shadow-lg border transition-colors duration-300"
                   style={{
                     backgroundColor: 'var(--card)',
                     borderColor: 'var(--border)'
                   }}>
                <Search className="mx-auto h-16 w-16 transition-colors duration-300 mb-4"
                       style={{ color: 'var(--muted-foreground)' }} />
                <h3 className="text-lg font-medium transition-colors duration-300 mb-2"
                     style={{ color: 'var(--foreground)' }}>ไม่พบรถยนต์ที่คุณค้นหา</h3>
                <p className="text-sm transition-colors duration-300 mb-4"
                   style={{ color: 'var(--muted-foreground)' }}>ลองค้นหาด้วยคำค้นอื่น หรือดูรถยนต์ที่พร้อมจองทั้งหมด</p>
                <button
                  onClick={clearSearch}
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)'
                  }}
                >
                  <span>ดูรถยนต์ทั้งหมด</span>
                </button>
              </div>
            )
          ) : availableCars.length > 0 ? (
            // แสดงรถยนต์ทั้งหมดแบบเดิม
            <div className="space-y-8">
              {groupCarsByShop().map(([shopName, cars]) => (
                <div key={shopName} 
                     className="rounded-2xl shadow-lg border transition-all duration-300"
                     style={{
                       backgroundColor: 'var(--card)',
                       borderColor: 'var(--border)'
                     }}>
                  {/* Shop Header */}
                  <div className="p-6 border-b transition-colors duration-300"
                       style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300"
                           style={{ backgroundColor: 'var(--accent)' }}>
                        <User className="w-4 h-4" style={{ color: 'var(--accent-foreground)' }} />
                      </div>
                      <h3 className="text-lg font-semibold transition-colors duration-300"
                           style={{ color: 'var(--foreground)' }}>
                        {shopName}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-300"
                            style={{
                              backgroundColor: 'var(--primary)',
                              color: 'var(--primary-foreground)'
                            }}>
                        {cars.length} คันพร้อมใช้
                      </span>
                    </div>
                  </div>
                  
                  {/* Cars Grid */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {cars.slice(0, 6).map((car) => (
                        <div key={car.id} 
                             className="group rounded-xl shadow-md overflow-hidden hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 border"
                             style={{
                               backgroundColor: 'var(--card)',
                               borderColor: 'var(--border)'
                             }}>
                          {/* Car Image */}
                          <div className="relative overflow-hidden">
                            {car.image_url ? (
                              <img
                                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${car.image_url}`}
                                alt={`${car.brand} ${car.model}`}
                                className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-40 flex items-center justify-center transition-colors duration-300"
                                   style={{ backgroundColor: 'var(--muted)' }}>
                                <Car className="w-12 h-12" style={{ color: 'var(--muted-foreground)' }} />
                              </div>
                            )}
                            
                            {/* Status Badge */}
                            <div className="absolute top-2 right-2">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-colors duration-300"
                                    style={{
                                      backgroundColor: 'var(--success)',
                                      color: 'var(--success-foreground)'
                                    }}>
                                พร้อมจอง
                              </span>
                            </div>
                          </div>

                          {/* Car Details */}
                          <div className="p-4">
                            <div className="mb-3">
                              <h4 className="text-lg font-bold mb-1 transition-colors duration-300"
                                   style={{ color: 'var(--foreground)' }}>
                                {car.brand} {car.model}
                              </h4>
                              <p className="text-sm transition-colors duration-300"
                                 style={{ color: 'var(--muted-foreground)' }}>
                                ปี {car.year} • {car.car_type}
                              </p>
                            </div>

                            {/* Price & Action */}
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-lg font-bold transition-colors duration-300"
                                      style={{ color: 'var(--primary)' }}>
                                  ฿{car.daily_rate?.toLocaleString()}
                                </span>
                                <span className="text-xs transition-colors duration-300 ml-1"
                                      style={{ color: 'var(--muted-foreground)' }}>/วัน</span>
                              </div>
                              
                              <Link
                                href={`/customer/cars/${car.id}`}
                                className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                                style={{
                                  backgroundColor: 'var(--primary)',
                                  color: 'var(--primary-foreground)'
                                }}
                              >
                                ดูรายละเอียด
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {cars.length > 6 && (
                      <div className="mt-6 text-center">
                        <Link href="/customer/search" 
                              className="inline-flex items-center space-x-2 text-sm font-medium transition-all duration-300 hover:scale-105"
                              style={{ color: 'var(--primary)' }}>
                          <span>ดูรถจากร้าน {shopName} ทั้งหมด ({cars.length} คัน)</span>
                          <span>→</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 rounded-2xl shadow-lg border transition-colors duration-300"
                 style={{
                   backgroundColor: 'var(--card)',
                   borderColor: 'var(--border)'
                 }}>
              <Car className="mx-auto h-16 w-16 transition-colors duration-300 mb-4"
                   style={{ color: 'var(--muted-foreground)' }} />
              <h3 className="text-lg font-medium transition-colors duration-300 mb-2"
                   style={{ color: 'var(--foreground)' }}>ไม่มีรถยนต์พร้อมจอง</h3>
              <p className="text-sm transition-colors duration-300"
                 style={{ color: 'var(--muted-foreground)' }}>ขณะนี้ยังไม่มีรถยนต์ที่พร้อมให้เช่า</p>
            </div>
          )}
        </div>

        {/* Recent Bookings Section */}
        {notifications.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300"
                     style={{ backgroundColor: 'var(--primary)' }}>
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold transition-colors duration-300"
                     style={{ color: 'var(--foreground)' }}>การจองล่าสุด</h2>
              </div>
              <Link href="/customer/bookings" 
                    className="text-sm font-medium transition-all duration-300 hover:scale-105"
                    style={{ color: 'var(--primary)' }}>
                ดูทั้งหมด →
              </Link>
            </div>
            
            <div className="rounded-2xl shadow-lg border transition-all duration-300"
                 style={{
                   backgroundColor: 'var(--card)',
                   borderColor: 'var(--border)'
                 }}>
              <div 
                className="divide-y transition-colors duration-300" 
                style={{
                  '--tw-divide-opacity': '1',
                  '--tw-divide-color': 'var(--border)'
                } as React.CSSProperties}
              >
                {notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="p-6 hover:bg-opacity-50 transition-all duration-300"
                       style={{ backgroundColor: 'var(--accent)' }}>
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {notification.image_url ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'}${notification.image_url}`}
                            alt={`${notification.brand} ${notification.model}`}
                            className="w-20 h-20 rounded-xl object-cover shadow-md"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-xl flex items-center justify-center transition-colors duration-300"
                               style={{ backgroundColor: 'var(--muted)' }}>
                            <Car className="w-10 h-10" style={{ color: 'var(--muted-foreground)' }} />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold transition-colors duration-300 mb-2"
                             style={{ color: 'var(--foreground)' }}>
                          {notification.brand} {notification.model} {notification.year}
                        </h3>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                            <p className="text-sm transition-colors duration-300"
                               style={{ color: 'var(--muted-foreground)' }}>
                              ร้าน: {notification.shop_name}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                            <p className="text-sm transition-colors duration-300"
                               style={{ color: 'var(--muted-foreground)' }}>
                              {new Date(notification.start_date).toLocaleDateString('th-TH')} - {new Date(notification.end_date).toLocaleDateString('th-TH')}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-3">
                        <span className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-full transition-colors duration-300 ${
                          notification.rental_status === 'approved' ? 'bg-green-100 text-green-800 border border-green-200' :
                          notification.rental_status === 'confirmed' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          notification.rental_status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                          notification.rental_status === 'ongoing' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          notification.rental_status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' :
                          'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {notification.rental_status === 'approved' ? 'อนุมัติแล้ว' :
                           notification.rental_status === 'confirmed' ? 'ยืนยันแล้ว' :
                           notification.rental_status === 'pending' ? 'รออนุมัติ' :
                           notification.rental_status === 'ongoing' ? 'กำลังเช่า' :
                           notification.rental_status === 'completed' ? 'เสร็จสิ้น' : 'ยกเลิก'}
                        </span>
                        <div className="text-right">
                          <span className="text-2xl font-bold transition-colors duration-300"
                                style={{ color: 'var(--primary)' }}>
                            ฿{notification.total_amount?.toLocaleString()}
                          </span>
                          <p className="text-sm transition-colors duration-300"
                             style={{ color: 'var(--muted-foreground)' }}>รวมทั้งหมด</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t mt-16 transition-colors duration-300"
              style={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)'
              }}>
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center transition-colors duration-300"
               style={{ color: 'var(--muted-foreground)' }}>
            <p className="text-lg">&copy; 2024 ระบบเช่ารถ. สร้างด้วย Next.js และ Node.js</p>
            <p className="text-sm mt-2">บริการเช่ารถยนต์ที่ดีที่สุดสำหรับคุณ</p>
          </div>
        </div>
      </footer>
    </div>
  );
}