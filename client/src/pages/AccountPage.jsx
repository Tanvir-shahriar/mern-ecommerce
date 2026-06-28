import { CheckCircle2, Heart, LogOut, MapPin, Package, Plus, Save, Trash2, UserRound } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AddressModal } from '../components/AddressModal.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCurrency } from '../contexts/CurrencyContext.jsx';
import { api, apiErrorMessage, mediaUrl } from '../services/api.js';
import { dateShort, statusLabel } from '../utils/format.js';
import { orderCustomerName, orderDetailPath, orderIdentifier } from '../utils/orders.js';

const addressKey = (address, index) => address._id || `${address.label}-${address.line1}-${index}`;


const normalizeAddress = (address) => ({
  label: address.label || 'Home',
  fullName: address.fullName || '',
  phone: address.phone || '',
  line1: address.line1 || '',
  line2: address.line2 || '',
  city: address.city || '',
  state: address.state || '',
  postalCode: address.postalCode || '',
  country: address.country || 'Bangladesh',
  isDefault: Boolean(address.isDefault)
  // Note: email is intentionally excluded — not part of the address backend schema
});


const normalizeAddresses = (addresses = []) => {
  const normalized = addresses.map(normalizeAddress);
  const defaultIndex = normalized.findIndex((address) => address.isDefault);

  return normalized.map((address, index) => ({
    ...address,
    isDefault: defaultIndex === -1 ? index === 0 : index === defaultIndex
  }));
};

const AddressSummary = ({ address }) => (
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
);

export const AccountPage = () => {
  const { user, updateProfile, logout } = useAuth();
  const { formatMoney } = useCurrency();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account-details');

  // Inline editing states for Account Details
  const [editingField, setEditingField] = useState(null); // 'name' | 'phone' | 'password' | null
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [phoneInput, setPhoneInput] = useState(user?.phone || '');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [profileMessage, setProfileMessage] = useState({ text: '', type: 'success' });
  const [savingProfileField, setSavingProfileField] = useState(false);

  // Address states
  const [addresses, setAddresses] = useState(() => normalizeAddresses(user?.addresses || []));
  const [editingAddressIndex, setEditingAddressIndex] = useState(-1);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressMessage, setAddressMessage] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    const normalizedAddresses = normalizeAddresses(user?.addresses || []);
    setNameInput(user?.name || '');
    setPhoneInput(user?.phone || '');
    setAddresses(normalizedAddresses);
    setEditingAddressIndex(-1);
    setShowAddressForm(false);
  }, [user]);

  const { data: orders = [] } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const { data } = await api.get('/orders/mine');
      return data.data.orders;
    }
  });

  const { data: wishlist = [] } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const { data } = await api.get('/users/wishlist');
      return data.data.wishlist;
    }
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSaveField = async (field) => {
    setSavingProfileField(true);
    setProfileMessage({ text: '', type: 'success' });
    try {
      if (field === 'name') {
        await updateProfile({ name: nameInput });
        setProfileMessage({ text: 'Name updated successfully', type: 'success' });
      } else if (field === 'phone') {
        await updateProfile({ phone: phoneInput });
        setProfileMessage({ text: 'Phone number updated successfully', type: 'success' });
      } else if (field === 'password') {
        await api.patch('/auth/password', passwordForm);
        setProfileMessage({ text: 'Password updated successfully', type: 'success' });
        setPasswordForm({ currentPassword: '', newPassword: '' });
      }
      setEditingField(null);
    } catch (error) {
      setProfileMessage({ text: apiErrorMessage(error), type: 'error' });
    } finally {
      setSavingProfileField(false);
    }
  };

  const persistAddresses = async (nextAddresses, successMessage) => {
    const normalized = normalizeAddresses(nextAddresses);
    setSavingAddress(true);
    setAddressMessage('');
    try {
      await updateProfile({ addresses: normalized });
      setAddresses(normalized);
      setAddressMessage(successMessage);
      setEditingAddressIndex(-1);
      setShowAddressForm(false);
    } catch (error) {
      setAddressMessage(apiErrorMessage(error));
      throw error;
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSaveAddressModal = async (formData) => {
    const cleaned = normalizeAddress(formData);
    const nextAddresses =
      editingAddressIndex >= 0
        ? addresses.map((address, index) => (index === editingAddressIndex ? cleaned : address))
        : [...addresses, cleaned];

    await persistAddresses(
      cleaned.isDefault || !addresses.length
        ? nextAddresses.map((address, index) => ({
            ...address,
            isDefault: index === (editingAddressIndex >= 0 ? editingAddressIndex : nextAddresses.length - 1)
          }))
        : nextAddresses,
      editingAddressIndex >= 0 ? 'Delivery address updated' : 'Delivery address added'
    );
  };



  const removeAddress = async (index) => {
    const nextAddresses = addresses.filter((_address, itemIndex) => itemIndex !== index);
    await persistAddresses(nextAddresses, 'Delivery address removed');
  };

  const setDefaultAddress = async (index) => {
    const nextAddresses = addresses.map((address, itemIndex) => ({
      ...address,
      isDefault: itemIndex === index
    }));
    await persistAddresses(nextAddresses, 'Default delivery address updated');
  };

  const cancelAddressEdit = () => {
    setEditingAddressIndex(-1);
    setAddressMessage('');
    setShowAddressForm(false);
  };

  const startAddressAdd = () => {
    setEditingAddressIndex(-1);
    setAddressMessage('');
    setShowAddressForm(true);
  };

  const openEditAddress = (index) => {
    setEditingAddressIndex(index);
    setAddressMessage('');
    setShowAddressForm(true);
  };

  return (
    <section className="account-page section">
      <div className="account-layout-container">
        {/* Left Navigation Sidebar Card */}
        <aside className="account-sidebar-card">
          <nav className="account-nav-list">
            <button
              type="button"
              className={`account-nav-item ${activeTab === 'account-details' ? 'active' : ''}`}
              onClick={() => { setActiveTab('account-details'); setShowAddressForm(false); }}
            >
              <UserRound size={18} />
              <span>Account Details</span>
            </button>

            <button
              type="button"
              className={`account-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => { setActiveTab('orders'); setShowAddressForm(false); }}
            >
              <Package size={18} />
              <span>Order</span>
            </button>

            <button
              type="button"
              className={`account-nav-item ${activeTab === 'addresses' ? 'active' : ''}`}
              onClick={() => setActiveTab('addresses')}
            >
              <MapPin size={18} />
              <span>Addresses</span>
            </button>

            <button
              type="button"
              className={`account-nav-item ${activeTab === 'wishlist' ? 'active' : ''}`}
              onClick={() => { setActiveTab('wishlist'); setShowAddressForm(false); }}
            >
              <Heart size={18} />
              <span>Wishlist</span>
            </button>

            <button type="button" className="account-nav-item logout" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Log Out</span>
            </button>
          </nav>
        </aside>

        {/* Right Main Content Card */}
        <main className="account-content-card">
          {profileMessage.text ? (
            <p className={profileMessage.type === 'error' ? 'form-error' : 'form-note'}>
              {profileMessage.text}
            </p>
          ) : null}

          {/* TAB 1: ACCOUNT DETAILS */}
          {activeTab === 'account-details' && (
            <div className="account-tab-content">
              <h1 className="account-tab-title">Account Details</h1>

              <div className="account-detail-rows">
                {/* NAME ROW */}
                <div className="account-field-row">
                  <div className="field-info">
                    <span className="field-label">Name</span>
                    {editingField === 'name' ? (
                      <input
                        type="text"
                        className="field-inline-input"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <strong className="field-value">{user?.name}</strong>
                    )}
                  </div>
                  <div className="field-action">
                    {editingField === 'name' ? (
                      <div className="inline-action-buttons">
                        <button
                          type="button"
                          className="pill-button primary"
                          onClick={() => handleSaveField('name')}
                          disabled={savingProfileField}
                        >
                          {savingProfileField ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          className="pill-button text"
                          onClick={() => {
                            setEditingField(null);
                            setNameInput(user?.name || '');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="pill-button"
                        onClick={() => setEditingField('name')}
                      >
                        Change
                      </button>
                    )}
                  </div>
                </div>

                {/* EMAIL ROW */}
                <div className="account-field-row">
                  <div className="field-info">
                    <span className="field-label">Email Address</span>
                    <strong className="field-value">{user?.email}</strong>
                  </div>
                </div>

                {/* PHONE ROW */}
                <div className="account-field-row">
                  <div className="field-info">
                    <span className="field-label">Phone Number</span>
                    {editingField === 'phone' ? (
                      <input
                        type="text"
                        className="field-inline-input"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="Enter phone number"
                        autoFocus
                      />
                    ) : (
                      <strong className="field-value">{user?.phone || 'Not provided'}</strong>
                    )}
                  </div>
                  <div className="field-action">
                    {editingField === 'phone' ? (
                      <div className="inline-action-buttons">
                        <button
                          type="button"
                          className="pill-button primary"
                          onClick={() => handleSaveField('phone')}
                          disabled={savingProfileField}
                        >
                          {savingProfileField ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          className="pill-button text"
                          onClick={() => {
                            setEditingField(null);
                            setPhoneInput(user?.phone || '');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="pill-button"
                        onClick={() => setEditingField('phone')}
                      >
                        Change
                      </button>
                    )}
                  </div>
                </div>

                {/* PASSWORD ROW */}
                <div className="account-field-row">
                  <div className="field-info span-flex">
                    <span className="field-label">Current Password</span>
                    {editingField === 'password' ? (
                      <div className="password-change-form">
                        <input
                          type="password"
                          className="field-inline-input"
                          placeholder="Current password"
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                          }
                        />
                        <input
                          type="password"
                          className="field-inline-input"
                          placeholder="New password (min 8 chars)"
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                          }
                        />
                      </div>
                    ) : (
                      <strong className="field-value password-dots">••••••••</strong>
                    )}
                  </div>
                  <div className="field-action">
                    {editingField === 'password' ? (
                      <div className="inline-action-buttons">
                        <button
                          type="button"
                          className="pill-button primary"
                          onClick={() => handleSaveField('password')}
                          disabled={
                            savingProfileField ||
                            !passwordForm.currentPassword ||
                            passwordForm.newPassword.length < 8
                          }
                        >
                          {savingProfileField ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          className="pill-button text"
                          onClick={() => {
                            setEditingField(null);
                            setPasswordForm({ currentPassword: '', newPassword: '' });
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="pill-button"
                        onClick={() => setEditingField('password')}
                      >
                        Change
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS */}
          {activeTab === 'orders' && (
            <div className="account-tab-content">
              <h1 className="account-tab-title">Order History</h1>
              <div className="order-list">
                {orders.length ? (
                  orders.map((order) => (
                    <Link
                      className="order-row"
                      key={orderIdentifier(order)}
                      to={orderDetailPath(order)}
                    >
                      <div>
                        <strong>{order.itemSummary?.label || order.orderNumber}</strong>
                        <span>
                          {order.orderNumber} · {dateShort(order.createdAt)}
                        </span>
                        <span>Deliver to {orderCustomerName(order)}</span>
                      </div>
                      <span className={`status-pill ${order.status}`}>
                        {statusLabel(order.status)}
                      </span>
                      <strong>{formatMoney(order.pricing.total)}</strong>
                    </Link>
                  ))
                ) : (
                  <p className="muted">No orders placed yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="account-tab-content">
              <div className="account-tab-header-flex">
                <h1 className="account-tab-title">Address</h1>
                <button
                  type="button"
                  className="pill-button add-address-pill-btn"
                  onClick={startAddressAdd}
                >
                  Add New Address
                </button>
              </div>

              {addressMessage ? (
                <p
                  className={
                    addressMessage.includes('updated') ||
                    addressMessage.includes('added') ||
                    addressMessage.includes('removed')
                      ? 'form-note'
                      : 'form-error'
                  }
                  style={{ marginBottom: '16px' }}
                >
                  {addressMessage}
                </p>
              ) : null}

              <div className="address-manager">
                <div className="address-list">
                  {addresses.length ? (
                    addresses.map((address, index) => (
                      <article className="address-card" key={addressKey(address, index)}>
                        <div className="address-card-heading">
                          <div>
                            <MapPin size={17} />
                            <strong>{address.label}</strong>
                          </div>
                          {address.isDefault ? (
                            <span className="status-pill delivered">
                              <CheckCircle2 size={14} />
                              Default
                            </span>
                          ) : null}
                        </div>
                        <AddressSummary address={address} />
                        <div className="address-actions">
                          <button type="button" onClick={() => openEditAddress(index)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDefaultAddress(index)}
                            disabled={address.isDefault || savingAddress}
                          >
                            Make default
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAddress(index)}
                            disabled={savingAddress}
                          >
                            <Trash2 size={15} />
                            Remove
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="muted">No delivery address saved yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="account-tab-content">
              <h1 className="account-tab-title">Saved Wishlist</h1>
              <div className="wishlist-grid">
                {wishlist.length ? (
                  wishlist.map((product) => (
                    <Link className="wishlist-item" key={product._id} to={`/products/${product.slug}`}>
                      <img src={mediaUrl(product.images?.[0]?.url)} alt={product.name} />
                      <span>{product.name}</span>
                      <strong>{formatMoney(product.price)}</strong>
                    </Link>
                  ))
                ) : (
                  <p className="muted">No saved products in wishlist.</p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Address Modal — always in tree, controlled by isOpen */}
      <AddressModal
        isOpen={showAddressForm}
        onClose={cancelAddressEdit}
        onSave={handleSaveAddressModal}
        addressData={editingAddressIndex >= 0 ? addresses[editingAddressIndex] : null}
        isEditing={editingAddressIndex >= 0}
        saving={savingAddress}
      />
    </section>
  );
};
