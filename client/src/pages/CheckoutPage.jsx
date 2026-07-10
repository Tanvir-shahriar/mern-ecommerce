import { Banknote, Building2, MapPin, Plus, Smartphone, Upload, Copy, Check, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState.jsx';
import { LoadingScreen } from '../components/LoadingScreen.jsx';
import { OrderSuccessAnimation } from '../components/OrderSuccessAnimation.jsx';
import { Seo } from '../components/Seo.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { useCurrency } from '../contexts/CurrencyContext.jsx';
import { api, apiErrorMessage, mediaUrl } from '../services/api.js';
import { clearDirectCheckout, readDirectCheckout } from '../utils/directCheckout.js';
import { orderDetailPath } from '../utils/orders.js';
import { paymentMethodSummary, requiresManualPaymentDetails } from '../utils/payments.js';

const TAX_RATE = 0.08;
const FREE_SHIPPING_THRESHOLD = 10000;
const STANDARD_SHIPPING = 120;

const initialAddress = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'Bangladesh'
};

const checkoutAddress = (savedAddress, user) => ({
  fullName: savedAddress?.fullName || user?.name || '',
  phone: savedAddress?.phone || user?.phone || '',
  line1: savedAddress?.line1 || '',
  line2: savedAddress?.line2 || '',
  city: savedAddress?.city || '',
  state: savedAddress?.state || '',
  postalCode: savedAddress?.postalCode || '',
  country: savedAddress?.country || 'Bangladesh'
});

const fallbackPaymentMethods = [
  {
    key: 'cash_on_delivery',
    label: 'Cash on delivery',
    instructions: 'Place the order now and pay in cash when your order arrives.'
  },
  {
    key: 'bank_transfer',
    label: 'Bank transfer',
    instructions: 'Transfer the order total to the configured bank account, then submit your sender account number and transaction ID if available.'
  },
  {
    key: 'mobile_banking',
    label: 'Mobile banking',
    instructions: 'Send the order total to the configured mobile banking number, then submit your sender account number and transaction ID if available.'
  }
];

const paymentIcon = {
  cash_on_delivery: Banknote,
  bank_transfer: Building2,
  mobile_banking: Smartphone
};

const emptyPaymentDetails = {
  accountNumber: '',
  transactionId: '',
  proofImages: []
};

const CheckoutAddressSummary = ({ address }) => (
  <div className="checkout-address-summary">
    <MapPin size={18} />
    <div className="address-summary">
      <strong>{address.fullName}</strong>
      <span>{address.phone}</span>
      <span>{address.line1}</span>
      {address.line2 ? <span>{address.line2}</span> : null}
      <span>
        {address.city}, {address.state} {address.postalCode}
      </span>
      <span>{address.country}</span>
    </div>
  </div>
);

const roundedMoney = (value) => Math.round(value * 100) / 100;

const directPurchaseTotals = (product, quantity) => {
  const subtotal = roundedMoney((product?.price || 0) * quantity);
  const tax = roundedMoney(subtotal * TAX_RATE);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
  return {
    subtotal,
    tax,
    shipping,
    total: roundedMoney(subtotal + tax + shipping)
  };
};

export const CheckoutPage = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { cart, fetchCart } = useCart();
  const { formatMoney } = useCurrency();
  const isDirectCheckout = new URLSearchParams(location.search).get('mode') === 'buy-now';
  const [directItem] = useState(() => (isDirectCheckout ? readDirectCheckout() : null));
  const [address, setAddress] = useState(initialAddress);
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [paymentDetails, setPaymentDetails] = useState(emptyPaymentDetails);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [uploadingPaymentProof, setUploadingPaymentProof] = useState(false);
  const [customerNote, setCustomerNote] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addressMode, setAddressMode] = useState('new');
  const [showAddressChoices, setShowAddressChoices] = useState(false);
  const savedAddresses = user?.addresses || [];
  const defaultAddress = useMemo(
    () => savedAddresses.find((item) => item.isDefault) || savedAddresses[0],
    [savedAddresses]
  );
  const selectedSavedAddress = useMemo(
    () => savedAddresses.find((item) => item._id === selectedAddressId) || defaultAddress,
    [defaultAddress, savedAddresses, selectedAddressId]
  );
  const { data: directProduct, isLoading: directLoading, isError: directError } = useQuery({
    queryKey: ['direct-checkout-product', directItem?.productId],
    enabled: Boolean(isDirectCheckout && directItem?.productId),
    queryFn: async () => {
      const { data } = await api.get(`/products/${directItem.productId}`);
      return data.data.product;
    }
  });
  const { data: paymentMethodsData } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const { data } = await api.get('/payment-methods');
      return data.data.methods;
    }
  });
  const paymentMethods = paymentMethodsData?.length ? paymentMethodsData : fallbackPaymentMethods;
  const selectedPaymentMethod = paymentMethods.find((method) => method.key === paymentMethod) || paymentMethods[0];
  const isManualPayment = requiresManualPaymentDetails(paymentMethod);
  const directQuantity = directItem?.quantity || 1;
  const directTotals = useMemo(
    () => (directProduct ? directPurchaseTotals(directProduct, directQuantity) : null),
    [directProduct, directQuantity]
  );
  const directHasStock = directProduct
    ? !directProduct.inventory?.trackQuantity || directQuantity <= directProduct.inventory.stock
    : true;

  useEffect(() => {
    if (defaultAddress) {
      setAddress(checkoutAddress(defaultAddress, user));
      setSelectedAddressId(defaultAddress._id || '');
      setAddressMode('saved');
    } else {
      setAddress(checkoutAddress(null, user));
      setSelectedAddressId('');
      setAddressMode('new');
    }
    setShowAddressChoices(false);
  }, [defaultAddress, user]);

  useEffect(() => {
    if (paymentMethods.length && !paymentMethods.some((method) => method.key === paymentMethod)) {
      setPaymentMethod(paymentMethods[0].key);
    }
  }, [paymentMethod, paymentMethods]);

  useEffect(() => {
    if (showInstructionsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showInstructionsModal]);

  if (order) {
    return <OrderSuccessAnimation order={order} />;
  }

  if (isDirectCheckout && !directItem?.productId) {
    return <EmptyState title="Direct checkout expired" message="Choose Purchase now again to start a single-product checkout." actionLabel="Shop watches" actionTo="/products" />;
  }

  if (isDirectCheckout && directLoading) return <LoadingScreen />;

  if (isDirectCheckout && (directError || !directProduct)) {
    return <EmptyState title="Product unavailable" actionLabel="Back to catalog" actionTo="/products" />;
  }

  if (isDirectCheckout && !directHasStock) {
    return <EmptyState title="Not enough stock" message="This product no longer has enough stock for direct checkout." actionLabel="Back to product" actionTo={`/products/${directProduct.slug || directProduct._id}`} />;
  }

  if (!isDirectCheckout && !cart?.items?.length) {
    return <EmptyState title="Your cart is empty" actionLabel="Shop watches" actionTo="/products" />;
  }

  const updateAddress = (key, value) => {
    setAddress((current) => ({ ...current, [key]: value }));
  };

  const chooseSavedAddress = (item) => {
    setSelectedAddressId(item._id || '');
    setAddress(checkoutAddress(item, user));
    setAddressMode('saved');
    setShowAddressChoices(false);
  };

  const startNewAddress = () => {
    setSelectedAddressId('');
    setAddress(checkoutAddress(null, user));
    setAddressMode('new');
    setShowAddressChoices(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const cleanedPaymentDetails = {
        accountNumber: paymentDetails.accountNumber.trim(),
        transactionId: paymentDetails.transactionId.trim(),
        proofImages: paymentDetails.proofImages
      };
      const hasPaymentSubmission = Boolean(
        cleanedPaymentDetails.accountNumber ||
          cleanedPaymentDetails.transactionId ||
          cleanedPaymentDetails.proofImages.length
      );

      if (isManualPayment && hasPaymentSubmission && !cleanedPaymentDetails.accountNumber) {
        setError('Account number is required when submitting bank or mobile banking payment details.');
        setSubmitting(false);
        return;
      }

      const { data } = await api.post('/orders', {
        shippingAddress: address,
        paymentMethod,
        paymentDetails: isManualPayment && hasPaymentSubmission ? cleanedPaymentDetails : undefined,
        customerNote,
        directItem: isDirectCheckout
          ? {
              productId: directItem.productId,
              quantity: directQuantity,
              variant: directItem.variant
            }
          : undefined
      });
      setOrder(data.data.order);
      if (isDirectCheckout) {
        clearDirectCheckout();
      } else {
        await fetchCart();
      }
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const updatePaymentDetails = (key, value) => {
    setPaymentDetails((current) => ({ ...current, [key]: value }));
  };

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField('');
    }, 1500);
  };

  const uploadPaymentProof = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setUploadingPaymentProof(true);
    setError('');

    try {
      const formData = new FormData();
      files.slice(0, 5).forEach((file) => formData.append('images', file));
      const { data } = await api.post('/uploads/payments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPaymentDetails((current) => ({
        ...current,
        proofImages: [...current.proofImages, ...(data.data.images || [])].slice(0, 5)
      }));
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    } finally {
      setUploadingPaymentProof(false);
      event.target.value = '';
    }
  };

  const isUsingSavedAddress = Boolean(savedAddresses.length && selectedSavedAddress && addressMode === 'saved');

  return (
    <section className="checkout-page section">
      <Seo title="Checkout" noIndex />
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Checkout</p>
          <h1>Shipping and payment</h1>
        </div>
      </div>
      <div className="checkout-layout">
        <form className="form-panel" onSubmit={submit}>
          {isUsingSavedAddress ? (
            <div className="checkout-address-panel">
              <span className="form-section-label">Delivery address</span>
              <CheckoutAddressSummary address={selectedSavedAddress} />
              <div className="toolbar-actions">
                {savedAddresses.length > 1 ? (
                  <button className="button dark compact" type="button" onClick={() => setShowAddressChoices((value) => !value)}>
                    Use another address
                  </button>
                ) : null}
                <button className="button primary compact" type="button" onClick={startNewAddress}>
                  <Plus size={16} />
                  New address
                </button>
              </div>
              {showAddressChoices ? (
                <div className="saved-address-picker">
                  <span>Choose delivery address</span>
                  <div>
                    {savedAddresses.map((item) => (
                      <button
                        type="button"
                        className={item._id === selectedAddressId ? 'active' : ''}
                        key={item._id || item.line1}
                        onClick={() => chooseSavedAddress(item)}
                      >
                        {item.label || item.city}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : savedAddresses.length ? (
            <div className="checkout-address-switch">
              <button className="button dark compact" type="button" onClick={() => chooseSavedAddress(selectedSavedAddress)}>
                Use saved address
              </button>
            </div>
          ) : null}

          {!isUsingSavedAddress ? (
            <div className="form-grid">
              <label>
                Full name
                <input required value={address.fullName} onChange={(event) => updateAddress('fullName', event.target.value)} />
              </label>
              <label>
                Phone
                <input required value={address.phone} onChange={(event) => updateAddress('phone', event.target.value)} />
              </label>
              <label className="span-2">
                Address line 1
                <input required value={address.line1} onChange={(event) => updateAddress('line1', event.target.value)} />
              </label>
              <label className="span-2">
                Address line 2
                <input value={address.line2} onChange={(event) => updateAddress('line2', event.target.value)} />
              </label>
              <label>
                City
                <input required value={address.city} onChange={(event) => updateAddress('city', event.target.value)} />
              </label>
              <label>
                District
                <input required value={address.state} onChange={(event) => updateAddress('state', event.target.value)} />
              </label>
              <label>
                Postal code
                <input required value={address.postalCode} onChange={(event) => updateAddress('postalCode', event.target.value)} />
              </label>
              <label>
                Country
                <input required value={address.country} onChange={(event) => updateAddress('country', event.target.value)} />
              </label>
            </div>
          ) : null}

          <div className="payment-method-panel">
            <span className="form-section-label">Payment method</span>
            <div className="payment-method-grid">
              {paymentMethods.map((method) => {
                const Icon = paymentIcon[method.key] || Banknote;
                return (
                  <button
                    type="button"
                    className={paymentMethod === method.key ? 'payment-method-option active' : 'payment-method-option'}
                    key={method.key}
                    onClick={() => {
                      setPaymentMethod(method.key);
                      setPaymentDetails(emptyPaymentDetails);
                    }}
                  >
                    <Icon size={18} />
                    <span>{method.label}</span>
                  </button>
                );
              })}
            </div>

            {selectedPaymentMethod ? (
              <div
                className="manual-payment-instructions"
                onClick={() => setShowInstructionsModal(true)}
                style={{ cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
              >
                <strong>{selectedPaymentMethod.label}</strong>
                {paymentMethodSummary(selectedPaymentMethod) ? <span>{paymentMethodSummary(selectedPaymentMethod)}</span> : null}
                {selectedPaymentMethod.image?.url ? (
                  <div className="manual-payment-image" style={{ pointerEvents: 'none' }}>
                    <img src={mediaUrl(selectedPaymentMethod.image.url)} alt={selectedPaymentMethod.image.alt || `${selectedPaymentMethod.label} payment image`} />
                  </div>
                ) : null}
                {selectedPaymentMethod.instructions ? <p>{selectedPaymentMethod.instructions}</p> : null}
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold', color: 'var(--red, #c74132)' }}>
                  <span>Click to view detailed payment info & copy details</span>
                </div>
              </div>
            ) : null}
          </div>

          <label>
            Note
            <textarea value={customerNote} onChange={(event) => setCustomerNote(event.target.value)} />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="button primary" type="submit" disabled={submitting}>
            {submitting ? 'Placing order...' : 'Place order'}
          </button>
        </form>

        <aside className="summary-panel">
          <h2>{isDirectCheckout ? 'Direct purchase' : 'Totals'}</h2>
          {isDirectCheckout ? (
            <>
              <div className="checkout-summary-item">
                <img src={mediaUrl(directProduct.images?.[0]?.url)} alt={directProduct.images?.[0]?.alt || directProduct.name} />
                <div>
                  <strong>{directProduct.name}</strong>
                  <span>Quantity: {directQuantity}</span>
                </div>
              </div>
              <div className="summary-row">
                <span>Subtotal</span>
                <strong>{formatMoney(directTotals.subtotal)}</strong>
              </div>
              <div className="summary-row">
                <span>Tax</span>
                <strong>{formatMoney(directTotals.tax)}</strong>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <strong>{directTotals.shipping ? formatMoney(directTotals.shipping) : 'Free'}</strong>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <strong>{formatMoney(directTotals.total)}</strong>
              </div>
              <p className="muted">Only this product will be ordered. Your cart will not be changed.</p>
            </>
          ) : (
            <>
              <div className="summary-row">
                <span>Items</span>
                <strong>{cart.items.length}</strong>
              </div>
              <div className="summary-row">
                <span>Cart total</span>
                <strong>{formatMoney(cart.totals?.total)}</strong>
              </div>
              <p className="muted">Tax and shipping are finalized after order submission.</p>
            </>
          )}
        </aside>
      </div>

      {showInstructionsModal && selectedPaymentMethod && (
        <div className="modal-backdrop" onClick={() => setShowInstructionsModal(false)}>
          <div className="modal-card manual-payment-details-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setShowInstructionsModal(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <div className="social-modal-header" style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 6px 0' }}>
                {selectedPaymentMethod.label} Details
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
                Copy info below to complete manual payment in your banking app.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedPaymentMethod.bankName && (
                <div className="address-modal-field" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Bank Name</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      readOnly
                      value={selectedPaymentMethod.bankName}
                      style={{ flex: 1, padding: '8px 12px', background: '#f8fafc', border: '1px solid var(--line)', borderRadius: '6px' }}
                    />
                    <button
                      type="button"
                      className="button dark compact"
                      onClick={() => handleCopy(selectedPaymentMethod.bankName, 'bankName')}
                      style={{ minWidth: '80px', height: '38px' }}
                    >
                      {copiedField === 'bankName' ? <Check size={14} /> : <Copy size={14} />}
                      {copiedField === 'bankName' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {selectedPaymentMethod.accountName && (
                <div className="address-modal-field" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Account Name</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      readOnly
                      value={selectedPaymentMethod.accountName}
                      style={{ flex: 1, padding: '8px 12px', background: '#f8fafc', border: '1px solid var(--line)', borderRadius: '6px' }}
                    />
                    <button
                      type="button"
                      className="button dark compact"
                      onClick={() => handleCopy(selectedPaymentMethod.accountName, 'accountName')}
                      style={{ minWidth: '80px', height: '38px' }}
                    >
                      {copiedField === 'accountName' ? <Check size={14} /> : <Copy size={14} />}
                      {copiedField === 'accountName' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {selectedPaymentMethod.accountNumber && (
                <div className="address-modal-field" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>
                    {paymentMethod === 'mobile_banking' ? 'Wallet Number' : 'Account Number'}
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      readOnly
                      value={selectedPaymentMethod.accountNumber}
                      style={{ flex: 1, padding: '8px 12px', background: '#f8fafc', border: '1px solid var(--line)', borderRadius: '6px', fontWeight: 'bold' }}
                    />
                    <button
                      type="button"
                      className="button dark compact"
                      onClick={() => handleCopy(selectedPaymentMethod.accountNumber, 'accountNumber')}
                      style={{ minWidth: '80px', height: '38px' }}
                    >
                      {copiedField === 'accountNumber' ? <Check size={14} /> : <Copy size={14} />}
                      {copiedField === 'accountNumber' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {selectedPaymentMethod.branchName && (
                <div className="address-modal-field" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Branch Name</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      readOnly
                      value={selectedPaymentMethod.branchName}
                      style={{ flex: 1, padding: '8px 12px', background: '#f8fafc', border: '1px solid var(--line)', borderRadius: '6px' }}
                    />
                    <button
                      type="button"
                      className="button dark compact"
                      onClick={() => handleCopy(selectedPaymentMethod.branchName, 'branchName')}
                      style={{ minWidth: '80px', height: '38px' }}
                    >
                      {copiedField === 'branchName' ? <Check size={14} /> : <Copy size={14} />}
                      {copiedField === 'branchName' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {selectedPaymentMethod.routingNumber && (
                <div className="address-modal-field" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Routing Number</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      readOnly
                      value={selectedPaymentMethod.routingNumber}
                      style={{ flex: 1, padding: '8px 12px', background: '#f8fafc', border: '1px solid var(--line)', borderRadius: '6px' }}
                    />
                    <button
                      type="button"
                      className="button dark compact"
                      onClick={() => handleCopy(selectedPaymentMethod.routingNumber, 'routingNumber')}
                      style={{ minWidth: '80px', height: '38px' }}
                    >
                      {copiedField === 'routingNumber' ? <Check size={14} /> : <Copy size={14} />}
                      {copiedField === 'routingNumber' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {selectedPaymentMethod.providerName && (
                <div className="address-modal-field" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Provider</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      readOnly
                      value={selectedPaymentMethod.providerName}
                      style={{ flex: 1, padding: '8px 12px', background: '#f8fafc', border: '1px solid var(--line)', borderRadius: '6px' }}
                    />
                    <button
                      type="button"
                      className="button dark compact"
                      onClick={() => handleCopy(selectedPaymentMethod.providerName, 'providerName')}
                      style={{ minWidth: '80px', height: '38px' }}
                    >
                      {copiedField === 'providerName' ? <Check size={14} /> : <Copy size={14} />}
                      {copiedField === 'providerName' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {selectedPaymentMethod.paymentType && (
                <div className="address-modal-field" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)' }}>Account Type</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      readOnly
                      value={selectedPaymentMethod.paymentType}
                      style={{ flex: 1, padding: '8px 12px', background: '#f8fafc', border: '1px solid var(--line)', borderRadius: '6px' }}
                    />
                    <button
                      type="button"
                      className="button dark compact"
                      onClick={() => handleCopy(selectedPaymentMethod.paymentType, 'paymentType')}
                      style={{ minWidth: '80px', height: '38px' }}
                    >
                      {copiedField === 'paymentType' ? <Check size={14} /> : <Copy size={14} />}
                      {copiedField === 'paymentType' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {selectedPaymentMethod.instructions && (
                <div style={{ background: '#f8fafc', border: '1px solid var(--line)', borderRadius: '8px', padding: '12px', fontSize: '13px', lineHeight: '1.4', marginTop: '4px' }}>
                  <strong>Instructions:</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#475569' }}>{selectedPaymentMethod.instructions}</p>
                </div>
              )}
            </div>

            {error ? <p className="form-error" style={{ marginTop: '12px', marginBottom: '0' }}>{error}</p> : null}

            <button
              type="button"
              className="button primary full"
              onClick={submit}
              disabled={submitting}
              style={{ marginTop: '20px' }}
            >
              {submitting ? 'Placing order...' : 'Place order'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
