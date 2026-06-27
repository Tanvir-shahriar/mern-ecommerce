import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppleLogo, FacebookLogo, GoogleLogo } from '../components/SocialLogos.jsx';
import { SocialAuthModal } from '../components/SocialAuthModal.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { apiErrorMessage } from '../services/api.js';

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
  const [notice, setNotice] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeSocial, setActiveSocial] = useState(null);
  const { register, socialLogin } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      await register(form);
      navigate('/account');
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    }
  };

  const handleSocialAuth = async (socialData) => {
    setError('');
    setNotice('');
    await socialLogin(socialData);
    setActiveSocial(null);
    navigate('/account');
  };

  return (
    <section className="auth-page login-page register-page">
      {activeSocial ? (
        <SocialAuthModal
          provider={activeSocial}
          onClose={() => setActiveSocial(null)}
          onSuccess={handleSocialAuth}
        />
      ) : null}

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
                <img src={slide.image} alt="" />
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
          <span>Use your email to create a customer profile.</span>
        </div>

        <div className="social-login-grid" aria-label="Social registration options">
          <button type="button" className="social-login-button" onClick={() => setActiveSocial('google')}>
            <GoogleLogo size={18} />
            Google
          </button>
          <button type="button" className="social-login-button" onClick={() => setActiveSocial('apple')}>
            <AppleLogo size={18} />
            Apple
          </button>
          <button type="button" className="social-login-button" onClick={() => setActiveSocial('facebook')}>
            <FacebookLogo size={18} />
            Facebook
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
        {notice ? <p className="form-note login-social-note">{notice}</p> : null}
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
