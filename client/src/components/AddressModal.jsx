import { useState, useEffect, useRef } from 'react';
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

const emptyForm = {
  fullName: '',
  phone: '',
  email: '',
  state: '',
  city: '',
  line2: '',
  line1: '',
  label: 'Home',
  postalCode: '',
  country: 'Bangladesh',
  isDefault: false
};

export const AddressModal = ({ isOpen, onClose, onSave, addressData, isEditing, saving }) => {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  // Store latest addressData/isEditing in refs so the open-effect can read them
  const addressDataRef = useRef(addressData);
  const isEditingRef = useRef(isEditing);
  addressDataRef.current = addressData;
  isEditingRef.current = isEditing;

  // Every time the modal OPENS, populate or reset form
  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (isEditingRef.current && addressDataRef.current) {
      const d = addressDataRef.current;
      setForm({
        fullName: d.fullName || '',
        phone: d.phone || '',
        email: d.email || '',
        state: d.state || '',
        city: d.city || '',
        line2: d.line2 || '',
        line1: d.line1 || '',
        label: d.label || 'Home',
        postalCode: d.postalCode || '',
        country: d.country || 'Bangladesh',
        isDefault: Boolean(d.isDefault)
      });
    } else {
      setForm(emptyForm);
    }
  }, [isOpen]); // Only fires on open/close toggle

  // Prevent body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleClose = () => {
    if (!saving) onClose();
  };

  const handleBackdropClick = (e) => {
    // Only close if the click was directly on the backdrop, not the card
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }
    if (!form.phone.trim() || form.phone.trim().length < 5) {
      setError('Phone number must be at least 5 characters.');
      return;
    }
    if (!form.state) {
      setError('Please select a division.');
      return;
    }
    if (!form.city.trim() || form.city.trim().length < 2) {
      setError('District / city must be at least 2 characters.');
      return;
    }
    if (!form.line2.trim()) {
      setError('Upazila / area is required.');
      return;
    }
    if (!form.line1.trim() || form.line1.trim().length < 3) {
      setError('Address must be at least 3 characters.');
      return;
    }

    try {
      await onSave(form);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save address. Please try again.'
      );
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? 'Edit Address' : 'Add New Address'}
    >
      <div className="modal-card address-modal-card">
        {/* Close button */}
        <button
          type="button"
          className="modal-close"
          onClick={handleClose}
          aria-label="Close modal"
          disabled={saving}
        >
          <X size={20} />
        </button>

        <div className="address-modal-header">
          <h2>{isEditing ? 'Edit Address' : 'Add New Address'}</h2>
        </div>

        {error ? (
          <div className="address-modal-error">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        ) : null}

        <form className="address-modal-form" onSubmit={handleSubmit} noValidate>
          <label className="address-modal-field">
            <span>Full Name <span className="req-star">*</span></span>
            <input
              type="text"
              placeholder="Enter full name"
              value={form.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              autoFocus
            />
          </label>

          <label className="address-modal-field">
            <span>Phone Number <span className="req-star">*</span></span>
            <input
              type="tel"
              placeholder="e.g. 01700000000"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </label>

          <label className="address-modal-field">
            <span>Email <span className="address-optional-tag">(optional)</span></span>
            <input
              type="email"
              placeholder="Enter email address"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </label>

          <label className="address-modal-field">
            <span>Division <span className="req-star">*</span></span>
            <div className="address-select-wrapper">
              <select
                value={form.state}
                onChange={(e) => handleChange('state', e.target.value)}
              >
                <option value="">Select your division</option>
                {divisions.map((div) => (
                  <option value={div} key={div}>{div}</option>
                ))}
              </select>
            </div>
          </label>

          <label className="address-modal-field">
            <span>District <span className="req-star">*</span></span>
            <input
              type="text"
              placeholder="Enter your district / city"
              value={form.city}
              onChange={(e) => handleChange('city', e.target.value)}
            />
          </label>

          <label className="address-modal-field">
            <span>Upazila <span className="req-star">*</span></span>
            <input
              type="text"
              placeholder="Enter your upazila / area"
              value={form.line2}
              onChange={(e) => handleChange('line2', e.target.value)}
            />
          </label>

          <label className="address-modal-field">
            <span>Address <span className="req-star">*</span></span>
            <input
              type="text"
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
            <span>Set as default delivery address</span>
          </label>

          <button
            type="submit"
            className="address-submit-btn"
            disabled={saving}
          >
            {saving ? 'Saving...' : isEditing ? 'Update Address' : 'Add New Address'}
          </button>
        </form>
      </div>
    </div>
  );
};
