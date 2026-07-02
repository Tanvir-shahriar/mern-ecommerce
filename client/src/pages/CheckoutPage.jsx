import { Banknote, Building2, MapPin, Plus, Smartphone, Upload } from 'lucide-react';
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
              <div className="manual-payment-instructions">
                <strong>{selectedPaymentMethod.label}</strong>
                {paymentMethodSummary(selectedPaymentMethod) ? <span>{paymentMethodSummary(selectedPaymentMethod)}</span> : null}
                {selectedPaymentMethod.instructions ? <p>{selectedPaymentMethod.instructions}</p> : null}
              </div>
            ) : null}

            {isManualPayment ? (
              <div className="manual-payment-form">
                <div className="form-grid">
                  <label>
                    Sender account number
                    <input
                      value={paymentDetails.accountNumber}
                      onChange={(event) => updatePaymentDetails('accountNumber', event.target.value)}
                      placeholder="Your bank account or mobile wallet number"
                    />
                    <small>Required if you submit payment details now. You can also submit it from the order page later.</small>
                  </label>
                  <label>
                    Transaction ID
                    <input
                      value={paymentDetails.transactionId}
                      onChange={(event) => updatePaymentDetails('transactionId', event.target.value)}
                      placeholder="Optional"
                    />
                  </label>
                </div>
                <label className="payment-proof-upload">
                  <Upload size={17} />
                  <span>{uploadingPaymentProof ? 'Uploading proof...' : 'Upload payment proof'}</span>
                  <input type="file" accept="image/*" multiple onChange={uploadPaymentProof} disabled={uploadingPaymentProof} />
                </label>
                {paymentDetails.proofImages.length ? (
                  <div className="payment-proof-list">
                    {paymentDetails.proofImages.map((image) => (
                      <img src={mediaUrl(image.url)} alt={image.alt || 'Payment proof'} key={image.publicId || image.url} />
                    ))}
                  </div>
                ) : null}
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
    </section>
  );
};
