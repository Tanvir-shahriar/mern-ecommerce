import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Pause, Play, ShoppingBag, MapPin, ExternalLink } from 'lucide-react';
import { OrderProgressBar } from './OrderProgressBar.jsx';
import { useCurrency } from '../contexts/CurrencyContext.jsx';
import { orderDetailPath } from '../utils/orders.js';

export const OrderSuccessAnimation = ({ order }) => {
  const navigate = useNavigate();
  const { formatMoney } = useCurrency();
  const [countdown, setCountdown] = useState(5);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const targetPath = orderDetailPath(order);

  useEffect(() => {
    if (isPaused) return;

    if (countdown <= 0) {
      navigate(targetPath);
      return;
    }

    timerRef.current = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [countdown, isPaused, navigate, targetPath]);

  // Generate celebratory confetti particles
  const confettiParticles = Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${(Math.random() * 1.5).toFixed(2)}s`,
    duration: `${(2 + Math.random() * 2).toFixed(2)}s`,
    color: ['#e11d48', '#2563eb', '#16a34a', '#eab308', '#ec4899', '#8b5cf6'][i % 6],
    size: `${6 + Math.floor(Math.random() * 8)}px`
  }));

  return (
    <section className="order-success-screen section">
      {/* Confetti Animation Background */}
      <div className="confetti-container" aria-hidden="true">
        {confettiParticles.map((particle) => (
          <span
            key={particle.id}
            className="confetti-particle"
            style={{
              left: particle.left,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
              backgroundColor: particle.color,
              width: particle.size,
              height: particle.size
            }}
          />
        ))}
      </div>

      <div className="order-success-card">
        {/* Scale-In Checkmark Icon with Ripples */}
        <div className="checkmark-wrapper">
          <div className="ripple-ring ring-1" />
          <div className="ripple-ring ring-2" />
          <div className="checkmark-icon-circle">
            <CheckCircle2 size={52} strokeWidth={2.5} />
          </div>
        </div>

        <h1 className="success-title">Order Placed Successfully!</h1>
        <p className="success-subtitle">
          Thank you for shopping with Success Way. Your order <strong>{order.orderNumber}</strong> has been received and is being processed.
        </p>

        {/* Live Order Progress Bar */}
        <div className="success-progress-wrapper">
          <OrderProgressBar status={order.status || 'pending'} />
        </div>

        {/* Quick Summary Box */}
        <div className="success-summary-box">
          <div className="summary-col">
            <span className="col-label"><ShoppingBag size={14} /> Items</span>
            <strong>{order.items?.length || 1} product(s)</strong>
          </div>
          <div className="summary-col">
            <span className="col-label"><MapPin size={14} /> Delivery City</span>
            <strong>{order.shippingAddress?.city || 'Bangladesh'}</strong>
          </div>
          <div className="summary-col">
            <span className="col-label">Total Amount</span>
            <strong className="total-highlight">{formatMoney(order.pricing?.total || 0)}</strong>
          </div>
        </div>

        {/* Automatic Redirect Bar & Actions */}
        <div className="redirect-card-bar">
          <div className="redirect-info">
            <div className="redirect-timer-progress">
              <div
                className="timer-fill"
                style={{ width: `${(countdown / 5) * 100}%` }}
              />
            </div>
            <span>
              {isPaused
                ? 'Automatic redirection paused.'
                : `Redirecting to live order tracking in ${countdown}s...`}
            </span>
          </div>

          <div className="redirect-actions">
            <button
              type="button"
              className="button compact secondary pause-btn"
              onClick={() => setIsPaused((prev) => !prev)}
              title={isPaused ? 'Resume countdown' : 'Pause countdown'}
            >
              {isPaused ? <Play size={15} /> : <Pause size={15} />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>

            <Link to={targetPath} className="button primary track-now-btn">
              Track Order Live
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
