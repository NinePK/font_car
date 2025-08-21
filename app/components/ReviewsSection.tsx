// app/components/ReviewsSection.tsx
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  username: string;
  profile_image?: string;
}

interface ReviewsSectionProps {
  carId: number;
}

export default function ReviewsSection({ carId }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState({
    averageRating: '0.0',
    reviewCount: 0
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchReviews = async (pageNum: number = 1) => {
    try {
      if (pageNum === 1) setLoading(true);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      const response = await axios.get(`${apiUrl}/reviews/car/${carId}`, {
        params: {
          page: pageNum,
          limit: 5
        }
      });
      
      const newReviews = response.data.reviews || [];
      
      if (pageNum === 1) {
        setReviews(newReviews);
        setStatistics(response.data.statistics);
      } else {
        setReviews(prev => [...prev, ...newReviews]);
      }
      
      // ตรวจสอบว่ายังมีหน้าถัดไปหรือไม่
      const pagination = response.data.pagination;
      setHasMore(pagination.page < pagination.totalPages);
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
      setError('ไม่สามารถโหลดรีวิวได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(1);
  }, [carId]);

  const loadMoreReviews = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH');
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">รีวิวจากลูกค้า</h3>
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4">⟳</div>
          <p className="text-gray-600">กำลังโหลดรีวิว...</p>
        </div>
      </div>
    );
  }

  if (error && reviews.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">รีวิวจากลูกค้า</h3>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">รีวิวจากลูกค้า</h3>
        {statistics.reviewCount > 0 && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-lg ${
                    star <= Math.round(parseFloat(statistics.averageRating)) 
                      ? 'text-yellow-400' 
                      : 'text-gray-300'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {statistics.averageRating} ({statistics.reviewCount} รีวิว)
            </span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0v8a2 2 0 002 2h6a2 2 0 002-2V8M9 12h6"></path>
            </svg>
          </div>
          <p className="text-gray-600">ยังไม่มีรีวิวสำหรับรถคันนี้</p>
          <p className="text-sm text-gray-500 mt-1">เป็นคนแรกที่รีวิวรถคันนี้</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex items-start space-x-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {review.profile_image ? (
                    <img
                      src={review.profile_image}
                      alt={review.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium text-sm">
                        {review.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Review content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {review.username}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {formatDate(review.created_at)}
                      </p>
                    </div>
                    {renderStars(review.rating)}
                  </div>

                  {review.comment && (
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={loadMoreReviews}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2">⟳</div>
                    กำลังโหลด...
                  </>
                ) : (
                  'โหลดรีวิวเพิ่มเติม'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}