import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppleLogo, FacebookLogo, GoogleLogo } from '../components/SocialLogos.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSocialAuth } from '../hooks/useSocialAuth.js';
import { apiErrorMessage } from '../services/api.js';
import { Seo } from '../components/Seo.jsx';

const registerSlides = [
  {
    image: '/jupiter_watch.png',
    title: 'Start your watch profile',
    text: 'Save delivery details, wishlist pieces, and account preferences before your next LahVenture order.'
  },
  {
    image: '/watch_video_thumbnail.png',
    title: 'A smoother checkout',
    text: 'Create once, then return to faster cart, purchase-now, and order tracking workflows.'
  },
  {
    image: '/lahventure.png',
    title: 'Built for collectors',
    text: 'Keep your watch journey organized with secure customer access and updated order history.'
  }
];

export const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleAuthSuccess = () => navigate('/account');

  const { signInWithGoogle, signInWithFacebook } = useSocialAuth({
    onSuccess: handleAuthSuccess,
    onError: (msg) => { setError(msg); setSocialLoading(null); }
  });

  const handleGoogleClick = () => {
    setError('');
    setSocialLoading('google');
    signInWithGoogle().finally(() => setSocialLoading(null));
  };

  const handleFacebookClick = () => {
    setError('');
    setSocialLoading('facebook');
    signInWithFacebook().finally(() => setSocialLoading(null));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await register(form);
      navigate('/account');
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    }
  };

  return (
    <section className="auth-page login-page register-page">
      <Seo title="Create Account" noIndex />
      <div className="login-hero-panel register-hero-panel" aria-label="Create a LahVenture account">
        <div className="login-hero-copy">
          <p className="eyebrow">Create profile</p>
          <h1>Begin your LahVenture account</h1>
          <p>
            Save your customer details once, keep delivery information ready, and manage watch orders from a secure profile.
          </p>
        </div>

        <div className="login-slideshow" aria-hidden="true">
          {registerSlides.map((slide, index) => (
            <div className="login-slide" style={{ '--slide-index': index }} key={slide.title}>
              <span className="login-slide-media">
                <img src={slide.image} alt={slide.title || 'LahVenture registration preview'} />
              </span>
              <div>
                <strong>{slide.title}</strong>
                <span>{slide.text}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="login-trust-strip">
          <span>
            <ShieldCheck size={16} />
            Secure profile
          </span>
          <span>
            <Sparkles size={16} />
            Watch-first account
          </span>
        </div>
      </div>

      <form className="auth-card login-card register-card" onSubmit={submit}>
        <div className="login-card-heading">
          <p className="eyebrow">Join LahVenture</p>
          <h2>Create account</h2>
          <span>Register with a social account or use your email below.</span>
        </div>

        <div className="social-login-grid" aria-label="Social registration options">
          {/* Google */}
          <button
            type="button"
            className={`social-login-button${socialLoading === 'google' ? ' social-loading' : ''}`}
            onClick={handleGoogleClick}
            disabled={!!socialLoading}
            aria-label="Register with Google"
          >
            <GoogleLogo size={18} />
            {socialLoading === 'google' ? 'Loading…' : 'Google'}
          </button>

          {/* Apple — not available yet */}
          <div className="social-btn-wrapper">
            <button
              type="button"
              className="social-login-button social-coming-soon"
              aria-label="Apple register (coming soon)"
              disabled
            >
              <AppleLogo size={18} />
              Apple
            </button>
            <span className="social-badge-soon">Soon</span>
          </div>

          {/* Facebook */}
          <button
            type="button"
            className={`social-login-button${socialLoading === 'facebook' ? ' social-loading' : ''}`}
            onClick={handleFacebookClick}
            disabled={!!socialLoading}
            aria-label="Register with Facebook"
          >
            <FacebookLogo size={18} />
            {socialLoading === 'facebook' ? 'Loading…' : 'Facebook'}
          </button>
        </div>

        <div className="login-divider">
          <span>or register with email</span>
        </div>

        <label className="login-field">
          Name
          <span>
            <UserRound size={18} />
            <input required value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} />
          </span>
        </label>
        <label className="login-field">
          Email
          <span>
            <Mail size={18} />
            <input type="email" required value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} />
          </span>
        </label>
        <label className="login-field">
          Password
          <span>
            <LockKeyhole size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              minLength="8"
              required
              value={form.password}
              onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))}
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="button primary full login-submit-button" type="submit">
          Create secure account
        </button>
        <p className="login-register-link">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </section>
  );
};
