import React from 'react';
import { ClipboardList, Package, Truck, Home, AlertCircle, RefreshCw } from 'lucide-react';

const STEPS = [
  {
    key: 'ordered',
    label: 'Ordered',
    icon: ClipboardList,
    targetStatus: 'confirmed', // or pending
    matches: ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
  },
  {
    key: 'packed',
    label: 'Packed',
    icon: Package,
    targetStatus: 'processing',
    matches: ['processing', 'shipped', 'delivered']
  },
  {
    key: 'in_transit',
    label: 'In Transit',
    icon: Truck,
    targetStatus: 'shipped',
    matches: ['shipped', 'delivered']
  },
  {
    key: 'delivered',
    label: 'Delivered',
    icon: Home,
    targetStatus: 'delivered',
    matches: ['delivered']
  }
];

export const OrderProgressBar = ({ status = 'pending', onUpdateStatus, isAdmin = false }) => {
  const isCancelled = status === 'cancelled';
  const isRefunded = status === 'refunded';

  if (isCancelled || isRefunded) {
    return (
      <div className="order-progress-container cancelled-container">
        <div className={`order-status-banner ${status}`}>
          {isCancelled ? <AlertCircle size={20} /> : <RefreshCw size={20} />}
          <span>Order is <strong>{status.toUpperCase()}</strong></span>
        </div>
      </div>
    );
  }

  // Determine current step index
  let activeIndex = 0;
  if (status === 'delivered') {
    activeIndex = 3;
  } else if (status === 'shipped') {
    activeIndex = 2;
  } else if (status === 'processing') {
    activeIndex = 1;
  } else {
    activeIndex = 0;
  }

  return (
    <div className="order-progress-container">
      {isAdmin && <p className="admin-progress-hint">Admin: Click any step icon below to update order status instantly</p>}
      <div className="order-progress-bar">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index <= activeIndex;
          const isCurrent = index === activeIndex;
          const isNextLineActive = index < activeIndex;

          const isClickable = isAdmin && typeof onUpdateStatus === 'function';

          return (
            <React.Fragment key={step.key}>
              {/* Connector line before step (except first step) */}
              {index > 0 && (
                <div className={`progress-line ${index <= activeIndex ? 'completed' : 'pending'}`}>
                  {index > activeIndex && (
                    <div className="dotted-pattern">
                      <span /><span /><span /><span /><span />
                    </div>
                  )}
                </div>
              )}

              {/* Step circle & label */}
              <div className={`progress-step-item ${isCompleted ? 'completed' : 'pending'} ${isCurrent ? 'current' : ''}`}>
                <button
                  type="button"
                  className={`step-circle ${isClickable ? 'clickable' : ''}`}
                  onClick={() => {
                    if (isClickable) {
                      onUpdateStatus(step.targetStatus);
                    }
                  }}
                  disabled={!isClickable}
                  title={isClickable ? `Set status to ${step.label}` : step.label}
                  aria-label={`${step.label}${isCompleted ? ' completed' : ''}`}
                >
                  <Icon size={24} strokeWidth={2} />
                </button>
                <span className="step-label">{step.label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
