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
  state: '',   // Division
  city: '',    // District
  line2: '',   // Upazila
  line1: '',   // Address details
  label: 'Home',
  postalCode: '',
  country: 'Bangladesh',
  isDefault: false
};

export const AddressModal = ({ isOpen, onClose, onSave, addressData, isEditing, saving }) => {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const prevOpenRef = useRef(false);

  // Reset / populate form whenever the modal opens
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      // Modal just opened
      if (isEditing && addressData) {
        setForm({
          fullName: addressData.fullName || '',
          phone: addressData.phone || '',
          email: addressData.email || '',
          state: addressData.state || '',
          city: addressData.city || '',
          line2: addressData.line2 || '',
          line1: addressData.line1 || '',
          label: addressData.label || 'Home',
          postalCode: addressData.postalCode || '',
          country: addressData.country || 'Bangladesh',
          isDefault: Boolean(addressData.isDefault)
        });
      } else {
        // New address – start fresh
        setForm(emptyForm);
      }
      setError('');
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, isEditing, addressData]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!form.fullName.trim()) { setError('Full name is required.'); return; }
    if (!form.phone.trim()) { setError('Phone number is required.'); return; }
    if (!form.state) { setError('Please select a division.'); return; }
    if (!form.city.trim()) { setError('District is required.'); return; }
    if (!form.line2.trim()) { setError('Upazila is required.'); return; }
    if (!form.line1.trim()) { setError('Address details are required.'); return; }

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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card address-modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
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
          {/* Full Name */}
          <label className="address-modal-field">
            <span>
              Full Name <span className="req-star">*</span>
            </span>
            <input
              type="text"
              placeholder="Enter full name"
              value={form.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              autoFocus
            />
          </label>

          {/* Phone Number */}
          <label className="address-modal-field">
            <span>
              Phone Number <span className="req-star">*</span>
            </span>
            <input
              type="tel"
              placeholder="Enter phone number (e.g. 01700000000)"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </label>

          {/* Email (optional) */}
          <label className="address-modal-field">
            <span>Email <span className="address-optional-tag">(optional)</span></span>
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
            <div className="address-select-wrapper">
              <select
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
            </div>
          </label>

          {/* District */}
          <label className="address-modal-field">
            <span>
              District <span className="req-star">*</span>
            </span>
            <input
              type="text"
              placeholder="Enter your district / city"
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
              placeholder="Enter your upazila / area"
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
              placeholder="For ex: House: 23, Road: 24, Block: B"
              value={form.line1}
              onChange={(e) => handleChange('line1', e.target.value)}
            />
          </label>

          {/* Default checkbox */}
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
            className="button primary full address-submit-btn"
            disabled={saving}
          >
            {saving ? 'Saving...' : isEditing ? 'Update Address' : 'Add New Address'}
          </button>
        </form>
      </div>
    </div>
  );
};
