import { CheckCircle2, MapPin, Plus, Save, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api, apiErrorMessage, mediaUrl } from '../services/api.js';
import { dateShort, money, statusLabel } from '../utils/format.js';

const emptyAddress = (user) => ({
  label: 'Home',
  fullName: user?.name || '',
  phone: user?.phone || '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'Bangladesh',
  isDefault: false
});

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
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [addresses, setAddresses] = useState(() => normalizeAddresses(user?.addresses || []));
  const [addressForm, setAddressForm] = useState(() => emptyAddress(user));
  const [editingAddressIndex, setEditingAddressIndex] = useState(-1);
  const [message, setMessage] = useState('');
  const [addressMessage, setAddressMessage] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    setProfile({ name: user?.name || '', phone: user?.phone || '' });
    setAddresses(normalizeAddresses(user?.addresses || []));
    setAddressForm((current) => ({
      ...emptyAddress(user),
      label: current.label || 'Home'
    }));
    setEditingAddressIndex(-1);
  }, [user]);

  const defaultAddress = useMemo(() => addresses.find((address) => address.isDefault) || addresses[0], [addresses]);

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

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setMessage('');
    try {
      await updateProfile(profile);
      setMessage('Profile updated');
    } catch (error) {
      setMessage(apiErrorMessage(error));
    } finally {
      setSavingProfile(false);
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
      setAddressForm(emptyAddress(user));
      setEditingAddressIndex(-1);
    } catch (error) {
      setAddressMessage(apiErrorMessage(error));
    } finally {
      setSavingAddress(false);
    }
  };

  const saveAddress = async (event) => {
    event.preventDefault();
    const cleaned = normalizeAddress(addressForm);
    const nextAddresses =
      editingAddressIndex >= 0
        ? addresses.map((address, index) => (index === editingAddressIndex ? cleaned : address))
        : [...addresses, cleaned];

    await persistAddresses(
      cleaned.isDefault || !addresses.length
        ? nextAddresses.map((address, index) => ({ ...address, isDefault: index === (editingAddressIndex >= 0 ? editingAddressIndex : nextAddresses.length - 1) }))
        : nextAddresses,
      editingAddressIndex >= 0 ? 'Delivery address updated' : 'Delivery address added'
    );
  };

  const editAddress = (index) => {
    setEditingAddressIndex(index);
    setAddressForm(normalizeAddress(addresses[index]));
    setAddressMessage('');
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
    setAddressForm(emptyAddress(user));
    setAddressMessage('');
  };

  const updateAddressForm = (key, value) => {
    setAddressForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <section className="account-page section">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Account</p>
          <h1>{user?.name}</h1>
        </div>
        <Link className="button dark" to="/cart">
          View cart
        </Link>
      </div>

      <div className="account-grid">
        <form className="form-panel" onSubmit={saveProfile}>
          <h2>Profile</h2>
          <label>
            Name
            <input required value={profile.name} onChange={(event) => setProfile((value) => ({ ...value, name: event.target.value }))} />
          </label>
          <label>
            Phone
            <input value={profile.phone} onChange={(event) => setProfile((value) => ({ ...value, phone: event.target.value }))} />
          </label>
          <div className="profile-snapshot">
            <span>Email</span>
            <strong>{user?.email}</strong>
          </div>
          <div className="profile-snapshot">
            <span>Default delivery</span>
            <strong>{defaultAddress ? `${defaultAddress.city}, ${defaultAddress.state}` : 'Not set'}</strong>
          </div>
          {message ? <p className={message.includes('updated') ? 'form-note' : 'form-error'}>{message}</p> : null}
          <button className="button dark" type="submit" disabled={savingProfile}>
            <Save size={17} />
            {savingProfile ? 'Saving...' : 'Save profile'}
          </button>
        </form>

        <div className="panel">
          <h2>Orders</h2>
          <div className="order-list">
            {orders.length ? (
              orders.map((order) => (
                <Link className="order-row" key={order._id} to={`/orders/${order._id}`}>
                  <div>
                    <strong>{order.itemSummary?.label || order.orderNumber}</strong>
                    <span>
                      {order.orderNumber} · {dateShort(order.createdAt)}
                    </span>
                    <span>Deliver to {order.customer?.name || order.shippingAddress?.fullName || 'Customer'}</span>
                  </div>
                  <span className={`status-pill ${order.status}`}>{statusLabel(order.status)}</span>
                  <strong>{money(order.pricing.total)}</strong>
                </Link>
              ))
            ) : (
              <p className="muted">No orders yet.</p>
            )}
          </div>
        </div>

        <div className="panel span-2">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Delivery</p>
              <h2>Saved addresses</h2>
            </div>
            <span>{addresses.length} saved</span>
          </div>

          <div className="address-manager">
            <form className="address-form" onSubmit={saveAddress}>
              <div className="form-grid">
                <label>
                  Label
                  <input required value={addressForm.label} onChange={(event) => updateAddressForm('label', event.target.value)} placeholder="Home, Office" />
                </label>
                <label>
                  Full name
                  <input required value={addressForm.fullName} onChange={(event) => updateAddressForm('fullName', event.target.value)} />
                </label>
                <label>
                  Phone
                  <input required value={addressForm.phone} onChange={(event) => updateAddressForm('phone', event.target.value)} />
                </label>
                <label className="span-2">
                  Address line 1
                  <input required value={addressForm.line1} onChange={(event) => updateAddressForm('line1', event.target.value)} />
                </label>
                <label className="span-2">
                  Address line 2
                  <input value={addressForm.line2} onChange={(event) => updateAddressForm('line2', event.target.value)} />
                </label>
                <label>
                  City
                  <input required value={addressForm.city} onChange={(event) => updateAddressForm('city', event.target.value)} />
                </label>
                <label>
                  District
                  <input required value={addressForm.state} onChange={(event) => updateAddressForm('state', event.target.value)} />
                </label>
                <label>
                  Postal code
                  <input required value={addressForm.postalCode} onChange={(event) => updateAddressForm('postalCode', event.target.value)} />
                </label>
                <label>
                  Country
                  <input required value={addressForm.country} onChange={(event) => updateAddressForm('country', event.target.value)} />
                </label>
                <label className="checkbox-row span-2">
                  <input type="checkbox" checked={addressForm.isDefault} onChange={(event) => updateAddressForm('isDefault', event.target.checked)} />
                  Use as default delivery address
                </label>
              </div>
              {addressMessage ? <p className={addressMessage.includes('updated') || addressMessage.includes('added') || addressMessage.includes('removed') ? 'form-note' : 'form-error'}>{addressMessage}</p> : null}
              <div className="toolbar-actions">
                <button className="button primary" type="submit" disabled={savingAddress}>
                  <Plus size={17} />
                  {savingAddress ? 'Saving...' : editingAddressIndex >= 0 ? 'Update address' : 'Add address'}
                </button>
                {editingAddressIndex >= 0 ? (
                  <button className="button dark" type="button" onClick={cancelAddressEdit}>
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>

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
                      <button type="button" onClick={() => editAddress(index)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => setDefaultAddress(index)} disabled={address.isDefault || savingAddress}>
                        Make default
                      </button>
                      <button type="button" onClick={() => removeAddress(index)} disabled={savingAddress}>
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

        <div className="panel span-2">
          <h2>Wishlist</h2>
          <div className="wishlist-grid">
            {wishlist.length ? (
              wishlist.map((product) => (
                <Link className="wishlist-item" key={product._id} to={`/products/${product.slug}`}>
                  <img src={mediaUrl(product.images?.[0]?.url)} alt={product.name} />
                  <span>{product.name}</span>
                  <strong>{money(product.price)}</strong>
                </Link>
              ))
            ) : (
              <p className="muted">No saved products.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
