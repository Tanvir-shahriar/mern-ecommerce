import { useState } from 'react';
import { X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { AppleLogo, FacebookLogo, GoogleLogo } from './SocialLogos.jsx';

export const SocialAuthModal = ({ provider, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const providerNames = {
    google: 'Google',
    apple: 'Apple ID',
    facebook: 'Facebook'
  };

  const providerIcons = {
    google: <GoogleLogo size={28} />,
    apple: <AppleLogo size={28} />,
    facebook: <FacebookLogo size={28} />
  };

  const handleQuickSelect = (demoEmail, demoName) => {
    setEmail(demoEmail);
    setName(demoName);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await onSuccess({
        provider,
        email,
        name: name || email.split('@')[0]
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  const title = providerNames[provider] || 'Social';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card social-auth-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="social-modal-header">
          <div className="social-modal-icon">{providerIcons[provider]}</div>
          <h2>Sign in with {title}</h2>
          <p>Choose an account or enter your email to continue to LahVenture</p>
        </div>

        {error ? (
          <div className="form-error social-modal-error">
            <ShieldAlert size={16} />
            {error}
          </div>
        ) : null}

        <div className="social-quick-accounts">
          <p className="social-quick-label">Fast sign in options:</p>
          <button
            type="button"
            className="social-account-chip"
            onClick={() => handleQuickSelect('demo.user@gmail.com', 'LahVenture Collector')}
          >
            <div className="chip-avatar">{provider === 'google' ? 'G' : provider === 'facebook' ? 'f' : ''}</div>
            <div className="chip-info">
              <strong>LahVenture Collector</strong>
              <span>demo.user@gmail.com</span>
            </div>
            <CheckCircle2 size={16} className="chip-check" />
          </button>
        </div>

        <form className="social-modal-form" onSubmit={handleSubmit}>
          <div className="social-divider-line">
            <span>or enter email</span>
          </div>

          <label className="login-field">
            {title} Email address
            <input
              type="email"
              required
              placeholder={`name@${provider === 'apple' ? 'icloud.com' : provider === 'facebook' ? 'facebook.com' : 'gmail.com'}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="login-field">
            Full Name (optional)
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <button type="submit" className="button primary full" disabled={loading}>
            {loading ? 'Authenticating...' : `Continue as ${name || email || title}`}
          </button>
        </form>
      </div>
    </div>
  );
};
