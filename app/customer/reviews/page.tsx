// app/customer/reviews/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Link from 'next/link';
import axios from 'axios';
import ReviewModal from '../../components/ReviewModal';
import { Star, MessageSquare, Calendar, Car, User, ArrowLeft, Clock, Search, LogOut, Moon, Sun } from 'lucide-react';

interface ReviewableRental {
  rental_id: number;
  car_name: string;
  shop_name: string;
  start_date: string;
  end_date: string;
  car_id: number;
  shop_id: number;
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  car_name: string;
  shop_name: string;
  start_date: string;
  end_date: string;
}

export default function CustomerReviews() {
  const router = useRouter();
  const { user, loading, isCustomer } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [reviewableRentals, setReviewableRentals] = useState<ReviewableRental[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'reviewable' | 'my-reviews'>('reviewable');
  
  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<ReviewableRental | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const fetchData = async () => {
    try {
      setDataLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      // ดึงการเช่าที่สามารถรีวิวได้
      const reviewableResponse = await axios.get(`${apiUrl}/reviews/reviewable-rentals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // ดึงรีวิวของฉัน
      const myReviewsResponse = await axios.get(`${apiUrl}/reviews/my-reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setReviewableRentals(reviewableResponse.data.rentals || []);
      setMyReviews(myReviewsResponse.data.reviews || []);
      setError(null);
      
    } catch (err: any) {
      console.error('Error fetching reviews data:', err);
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user && isCustomer()) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (!isCustomer()) {
        router.replace('/');
      }
    }
  }, [user, loading, isCustomer, router]);

  const handleWriteReview = (rental: ReviewableRental) => {
    setSelectedRental(rental);
    setIsReviewModalOpen(true);
  };

  const handleReviewSuccess = () => {
    fetchData(); // รีเฟรชข้อมูล
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH');
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-2 text-sm transition-colors duration-300"
              style={{ color: 'var(--muted-foreground)' }}>({rating} ดาว)</span>
      </div>
    );
  };

  if (!isMounted) {
    return <div className="min-h-screen flex justify-center items-center">กำลังโหลด...</div>;
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <p className="text-lg">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!isCustomer()) {
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
                  <Calendar className="w-4 h-4" />
                  <span>การจองของฉัน</span>
                </Link>
                <Link
                  href="/customer/reviews"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)'
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>รีวิว</span>
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
                onClick={() => router.push('/customer/dashboard')}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-foreground)'
                }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">กลับหน้าแรก</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300"
                 style={{ backgroundColor: 'var(--primary)' }}>
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold transition-colors duration-300"
                   style={{ color: 'var(--foreground)' }}>รีวิวและประเมิน</h1>
              <p className="text-lg transition-colors duration-300"
                 style={{ color: 'var(--muted-foreground)' }}>จัดการรีวิวของคุณและเขียนรีวิวใหม่</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="rounded-2xl shadow-lg border transition-colors duration-300"
               style={{
                 backgroundColor: 'var(--card)',
                 borderColor: 'var(--border)'
               }}>
            <div className="border-b transition-colors duration-300"
                 style={{ borderColor: 'var(--border)' }}>
              <nav className="-mb-px flex space-x-8 px-6">
                {[
                  { key: 'reviewable', label: 'รอรีวิว', count: reviewableRentals.length, icon: Clock },
                  { key: 'my-reviews', label: 'รีวิวของฉัน', count: myReviews.length, icon: Star }
                ].map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 hover:scale-105 ${
                        activeTab === tab.key
                          ? 'border-b-2 font-semibold'
                          : 'border-transparent'
                      }`}
                      style={{
                        borderColor: activeTab === tab.key ? 'var(--primary)' : 'transparent',
                        color: activeTab === tab.key ? 'var(--primary)' : 'var(--muted-foreground)'
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <IconComponent className="w-4 h-4" />
                        <span>{tab.label}</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-300"
                              style={{
                                backgroundColor: activeTab === tab.key ? 'var(--primary)' : 'var(--accent)',
                                color: activeTab === tab.key ? 'var(--primary-foreground)' : 'var(--accent-foreground)'
                              }}>
                          {tab.count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-6">
              {dataLoading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto transition-colors duration-300"
                       style={{ borderColor: 'var(--primary)' }}></div>
                  <p className="mt-4 text-lg transition-colors duration-300"
                     style={{ color: 'var(--muted-foreground)' }}>กำลังโหลดข้อมูล...</p>
                </div>
              ) : error ? (
                <div className="p-4 rounded-xl border transition-colors duration-300"
                     style={{
                       backgroundColor: 'var(--destructive)',
                       borderColor: 'var(--destructive)',
                       color: 'var(--destructive-foreground)'
                     }}>
                  <p className="font-medium">เกิดข้อผิดพลาด</p>
                  <p>{error}</p>
                </div>
              ) : (
                  <>
                {/* Reviewable Rentals Tab */}
                {activeTab === 'reviewable' && (
                  <div>
                    {reviewableRentals.length === 0 ? (
                      <div className="text-center py-16">
                        <Clock className="mx-auto h-16 w-16 transition-colors duration-300 mb-4"
                              style={{ color: 'var(--muted-foreground)' }} />
                        <h3 className="text-lg font-medium transition-colors duration-300 mb-2"
                             style={{ color: 'var(--foreground)' }}>ไม่มีการเช่าที่รอรีวิว</h3>
                        <p className="text-sm transition-colors duration-300 mb-6"
                           style={{ color: 'var(--muted-foreground)' }}>เมื่อคุณเช่ารถและใช้งานเสร็จแล้ว จะสามารถเขียนรีวิวได้ที่นี่</p>
                        <Link href="/customer/dashboard">
                          <button className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                                  style={{
                                    backgroundColor: 'var(--primary)',
                                    color: 'var(--primary-foreground)'
                                  }}>
                            <Search className="w-4 h-4" />
                            <span>ค้นหารถเช่า</span>
                          </button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {reviewableRentals.map((rental) => (
                          <div key={rental.rental_id} 
                               className="rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
                               style={{
                                 backgroundColor: 'var(--card)',
                                 borderColor: 'var(--border)'
                               }}>
                            <div className="p-6">
                              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start">
                                <div className="flex-1 mb-4 lg:mb-0">
                                  <h3 className="text-xl font-bold mb-2 transition-colors duration-300"
                                       style={{ color: 'var(--foreground)' }}>
                                    {rental.car_name}
                                  </h3>
                                  
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <User className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                                      <span className="text-sm transition-colors duration-300"
                                            style={{ color: 'var(--muted-foreground)' }}>
                                        ร้าน: {rental.shop_name}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                                      <span className="text-sm transition-colors duration-300"
                                            style={{ color: 'var(--muted-foreground)' }}>
                                        วันที่เช่า: {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => handleWriteReview(rental)}
                                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                                  style={{
                                    backgroundColor: 'var(--success)',
                                    color: 'var(--success-foreground)'
                                  }}
                                >
                                  <Star className="w-4 h-4" />
                                  <span>เขียนรีวิว</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* My Reviews Tab */}
                {activeTab === 'my-reviews' && (
                  <div>
                    {myReviews.length === 0 ? (
                      <div className="text-center py-16">
                        <Star className="mx-auto h-16 w-16 transition-colors duration-300 mb-4"
                              style={{ color: 'var(--muted-foreground)' }} />
                        <h3 className="text-lg font-medium transition-colors duration-300 mb-2"
                             style={{ color: 'var(--foreground)' }}>คุณยังไม่มีรีวิว</h3>
                        <p className="text-sm transition-colors duration-300"
                           style={{ color: 'var(--muted-foreground)' }}>รีวิวที่คุณเขียนจะแสดงที่นี่</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {myReviews.map((review) => (
                          <div key={review.id} 
                               className="rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl"
                               style={{
                                 backgroundColor: 'var(--card)',
                                 borderColor: 'var(--border)'
                               }}>
                            <div className="p-6">
                              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4">
                                <div className="flex-1 mb-4 lg:mb-0">
                                  <h3 className="text-xl font-bold mb-2 transition-colors duration-300"
                                       style={{ color: 'var(--foreground)' }}>
                                    {review.car_name}
                                  </h3>
                                  
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <User className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                                      <span className="text-sm transition-colors duration-300"
                                            style={{ color: 'var(--muted-foreground)' }}>
                                        ร้าน: {review.shop_name}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                                      <span className="text-sm transition-colors duration-300"
                                            style={{ color: 'var(--muted-foreground)' }}>
                                        วันที่เช่า: {formatDate(review.start_date)} - {formatDate(review.end_date)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  {renderStars(review.rating)}
                                  <p className="text-xs transition-colors duration-300 mt-1"
                                     style={{ color: 'var(--muted-foreground)' }}>
                                    รีวิวเมื่อ: {formatDate(review.created_at)}
                                  </p>
                                </div>
                              </div>
                              
                              {review.comment && (
                                <div className="p-4 rounded-xl transition-colors duration-300 border"
                                     style={{
                                       backgroundColor: 'var(--accent)',
                                       borderColor: 'var(--border)'
                                     }}>
                                  <div className="flex items-start space-x-3">
                                    <MessageSquare className="w-5 h-5 mt-0.5" style={{ color: 'var(--muted-foreground)' }} />
                                    <p className="text-sm leading-relaxed transition-colors duration-300"
                                       style={{ color: 'var(--foreground)' }}>
                                      {review.comment}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                  </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {selectedRental && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          rental={selectedRental}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}