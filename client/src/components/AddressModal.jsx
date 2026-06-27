import { useState, useEffect } from 'react';
import { X, ShieldAlert } from 'lucide-react';

const divisions = [
  'Dhaka',
  'Chattogram',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Sylhet',
  'Rangpur',
  'Mymensingh'
];

export const AddressModal = ({ isOpen, onClose, onSave, addressData, isEditing, saving }) => {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    state: '', // Division
    city: '',  // District
    line2: '', // Upazila
    line1: '', // Address details
    label: 'Home',
    postalCode: '1200',
    country: 'Bangladesh',
    isDefault: false
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (addressData) {
      setForm({
        fullName: addressData.fullName || '',
        phone: addressData.phone || '',
        email: addressData.email || '',
        state: addressData.state || '',
        city: addressData.city || '',
        line2: addressData.line2 || '',
        line1: addressData.line1 || '',
        label: addressData.label || 'Home',
        postalCode: addressData.postalCode || '1200',
        country: addressData.country || 'Bangladesh',
        isDefault: Boolean(addressData.isDefault)
      });
    }
  }, [addressData]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await onSave(form);
    } catch (err) {
      setError(err?.message || 'Failed to save address. Please check fields.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card address-modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="address-modal-header">
          <h2>{isEditing ? 'Edit Address' : 'Add New Address'}</h2>
        </div>

        {error ? (
          <div className="form-error modal-error-msg">
            <ShieldAlert size={16} />
            {error}
          </div>
        ) : null}

        <form className="address-modal-form" onSubmit={handleSubmit}>
          {/* Full Name */}
          <label className="address-modal-field">
            <span>
              Full Name <span className="req-star">*</span>
            </span>
            <input
              type="text"
              required
              placeholder="Enter full name"
              value={form.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
            />
          </label>

          {/* Phone Number */}
          <label className="address-modal-field">
            <span>
              Phone Number <span className="req-star">*</span>
            </span>
            <input
              type="text"
              required
              placeholder="Enter phone number"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </label>

          {/* Email */}
          <label className="address-modal-field">
            <span>Email</span>
            <input
              type="email"
              placeholder="Enter email address"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </label>

          {/* Division */}
          <label className="address-modal-field">
            <span>
              Division <span className="req-star">*</span>
            </span>
            <select
              required
              value={form.state}
              onChange={(e) => handleChange('state', e.target.value)}
            >
              <option value="">Select your division</option>
              {divisions.map((div) => (
                <option value={div} key={div}>
                  {div}
                </option>
              ))}
            </select>
          </label>

          {/* District */}
          <label className="address-modal-field">
            <span>
              District <span className="req-star">*</span>
            </span>
            <input
              type="text"
              required
              placeholder="Select your city"
              value={form.city}
              onChange={(e) => handleChange('city', e.target.value)}
            />
          </label>

          {/* Upazila */}
          <label className="address-modal-field">
            <span>
              Upazila <span className="req-star">*</span>
            </span>
            <input
              type="text"
              required
              placeholder="Select your area"
              value={form.line2}
              onChange={(e) => handleChange('line2', e.target.value)}
            />
          </label>

          {/* Address */}
          <label className="address-modal-field">
            <span>
              Address <span className="req-star">*</span>
            </span>
            <input
              type="text"
              required
              placeholder="For ex: House: 23, Road: 24, Block: B"
              value={form.line1}
              onChange={(e) => handleChange('line1', e.target.value)}
            />
          </label>

          <label className="checkbox-row address-default-checkbox">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => handleChange('isDefault', e.target.checked)}
            />
            <span>Use as default delivery address</span>
          </label>

          <button type="submit" className="button primary full address-submit-btn" disabled={saving}>
            {saving ? 'Saving...' : isEditing ? 'Update Address' : 'Add New Address'}
          </button>
        </form>
      </div>
    </div>
  );
};
