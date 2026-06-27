import { useState, useMemo } from 'react';
import { Star, CheckCircle2, ThumbsUp, ArrowUpDown, Filter, Plus, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api, apiErrorMessage } from '../services/api.js';
import { dateShort } from '../utils/format.js';

export const ProductRatingsAndReviews = ({ product, onReviewAdded }) => {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState('relevance'); // 'relevance' | 'newest' | 'highest' | 'lowest'
  const [filterStar, setFilterStar] = useState('all'); // 'all' | '5' | '4' | '3' | '2' | '1'
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [likedReviews, setLikedReviews] = useState({});

  const reviews = useMemo(() => product?.reviews || [], [product]);
  const totalReviews = reviews.length;

  // Calculate rating distribution
  const distribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.round(r.rating || 5);
      if (counts[star] !== undefined) counts[star]++;
    });
    return counts;
  }, [reviews]);

  const averageRating = product?.ratingsAverage
    ? Math.round(product.ratingsAverage * 10) / 10
    : totalReviews
    ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews) * 10) / 10
    : 0;

  // Filter and sort reviews
  const filteredReviews = useMemo(() => {
    let result = [...reviews];

    if (filterStar !== 'all') {
      const starNum = parseInt(filterStar, 10);
      result = result.filter((r) => Math.round(r.rating) === starNum);
    }

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === 'highest') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'lowest') {
      result.sort((a, b) => a.rating - b.rating);
    } // 'relevance' preserves default array order

    return result;
  }, [reviews, filterStar, sortBy]);

  const toggleLike = (reviewId) => {
    setLikedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 5) {
      setError('Please write at least 5 characters for your review.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post(`/products/${product._id}/reviews`, {
        rating,
        comment: comment.trim()
      });
      setShowReviewModal(false);
      setComment('');
      setRating(5);
      if (onReviewAdded) onReviewAdded();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const hasAlreadyReviewed = user && reviews.some((r) => r.user?._id === user._id || r.user === user._id);

  return (
    <section className="ratings-reviews-section" id="ratings-and-reviews">
      {/* Header bar matching reference image */}
      <div className="ratings-reviews-header-bar">
        <h3>Ratings &amp; Reviews of {product.name}</h3>
      </div>

      <div className="ratings-reviews-card">
        {/* Top Summary Block */}
        <div className="ratings-summary-container">
          {/* Left: Score & Stars */}
          <div className="ratings-score-box">
            <div className="score-number-wrapper">
              <span className="score-big">{averageRating > 0 ? averageRating.toFixed(1) : '0.0'}</span>
              <span className="score-max">/5</span>
            </div>
            <div className="score-stars-row">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={22}
                  className={s <= Math.round(averageRating) ? 'star-filled' : 'star-empty'}
                />
              ))}
            </div>
            <div className="score-count-label">
              {totalReviews} {totalReviews === 1 ? 'Rating' : 'Ratings'}
            </div>
          </div>

          {/* Right: Distribution Bars */}
          <div className="ratings-bars-box">
            {[5, 4, 3, 2, 1].map((starNum) => {
              const count = distribution[starNum] || 0;
              const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

              return (
                <div className="rating-bar-row" key={starNum}>
                  <div className="bar-stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={13}
                        className={s <= starNum ? 'bar-star-filled' : 'bar-star-empty'}
                      />
                    ))}
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="bar-count">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Toolbar: Filters, Sorting & Write Review */}
        <div className="reviews-toolbar flex-between">
          <div className="toolbar-title-group">
            <h4 className="reviews-toolbar-title">Product Reviews</h4>
          </div>

          <div className="toolbar-actions-group">
            {/* Sort Dropdown */}
            <div className="select-dropdown-wrapper">
              <ArrowUpDown size={15} className="dropdown-icon" />
              <span>Sort:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort reviews">
                <option value="relevance">Relevance</option>
                <option value="newest">Newest</option>
                <option value="highest">Highest rating</option>
                <option value="lowest">Lowest rating</option>
              </select>
            </div>

            {/* Filter Dropdown */}
            <div className="select-dropdown-wrapper">
              <Filter size={15} className="dropdown-icon" />
              <span>Filter:</span>
              <select value={filterStar} onChange={(e) => setFilterStar(e.target.value)} aria-label="Filter reviews by star">
                <option value="all">All star</option>
                <option value="5">5 star</option>
                <option value="4">4 star</option>
                <option value="3">3 star</option>
                <option value="2">2 star</option>
                <option value="1">1 star</option>
              </select>
            </div>

            {/* Write a Review Button */}
            <button
              type="button"
              className="button primary write-review-btn"
              onClick={() => setShowReviewModal(true)}
            >
              <Plus size={16} />
              Write a Review
            </button>
          </div>
        </div>

        {/* Reviews List */}
        <div className="reviews-list-container">
          {filteredReviews.length > 0 ? (
            filteredReviews.map((item, index) => {
              const reviewId = item._id || index;
              const isLiked = Boolean(likedReviews[reviewId]);
              const likeCount = (isLiked ? 1 : 0) + (item.likes || 0);

              return (
                <article className="review-card-item" key={reviewId}>
                  <div className="review-item-top">
                    <div className="item-stars">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={16}
                          className={s <= item.rating ? 'review-star-filled' : 'review-star-empty'}
                        />
                      ))}
                    </div>
                    <span className="review-date">
                      {item.createdAt ? dateShort(item.createdAt) : 'Recently'}
                    </span>
                  </div>

                  <div className="review-author-row">
                    <strong className="author-name">{item.name || item.user?.name || 'Verified Customer'}</strong>
                    {item.verifiedPurchase ? (
                      <span className="verified-badge">
                        <CheckCircle2 size={15} />
                        Verified Purchase
                      </span>
                    ) : (
                      <span className="verified-badge unverified">
                        <CheckCircle2 size={15} />
                        Verified Review
                      </span>
                    )}
                  </div>

                  <p className="review-comment-body">{item.comment}</p>

                  <div className="review-item-footer">
                    <button
                      type="button"
                      className={`review-like-btn ${isLiked ? 'liked' : ''}`}
                      onClick={() => toggleLike(reviewId)}
                      aria-label="Mark review as helpful"
                    >
                      <ThumbsUp size={14} />
                      <span>{likeCount > 0 ? likeCount : ''}</span>
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="no-reviews-empty">
              <p>No customer reviews match your filter criteria yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Write Review Modal */}
      {showReviewModal && (
        <div className="modal-backdrop" onClick={() => setShowReviewModal(false)}>
          <div className="modal-card review-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setShowReviewModal(false)}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <div className="address-modal-header">
              <h2>Write a Review</h2>
              <p className="modal-subtitle">Share your experience with {product.name}</p>
            </div>

            {hasAlreadyReviewed ? (
              <div className="already-reviewed-notice">
                <ShieldAlert size={18} />
                <span>You have already submitted a review for this product. Thank you!</span>
              </div>
            ) : !user ? (
              <div className="already-reviewed-notice">
                <ShieldAlert size={18} />
                <span>Please log in to submit a review for this product.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="review-form">
                {error && (
                  <div className="address-modal-error">
                    <ShieldAlert size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="form-group-star-select">
                  <label className="field-label">Overall Rating</label>
                  <div className="interactive-stars-row">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        className="star-btn"
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(s)}
                      >
                        <Star
                          size={28}
                          className={s <= (hoverRating || rating) ? 'star-filled-interactive' : 'star-empty-interactive'}
                        />
                      </button>
                    ))}
                    <span className="rating-text-hint">
                      {hoverRating || rating} out of 5 stars
                    </span>
                  </div>
                </div>

                <div className="form-group-comment">
                  <label className="field-label">Your Review</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="What did you like or dislike about this product? (Minimum 5 characters)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="address-submit-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting Review...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
