import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppleLogo, FacebookLogo, GoogleLogo } from '../components/SocialLogos.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSocialAuth } from '../hooks/useSocialAuth.js';
import { apiErrorMessage } from '../services/api.js';
import { Seo } from '../components/Seo.jsx';

const loginSlides = [
  {
    image: '/jupiter_watch.png',
    title: 'Mechanical collection access',
    text: 'Track orders, delivery details, and saved watches from one secure profile.'
  },
  {
    image: '/watch_video_thumbnail.png',
    title: 'Curated watch drops',
    text: 'Return to your cart and checkout faster when new LahVenture pieces arrive.'
  },
  {
    image: '/lahventure.png',
    title: 'Time well lived',
    text: 'Keep your customer profile ready for Bangladesh delivery and order updates.'
  }
];

export const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [socialLoading, setSocialLoading] = useState(null); // 'google' | 'facebook' | null
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleAuthSuccess = (user) => {
    const from = location.state?.from;
    const redirectTo = from
      ? `${from.pathname || ''}${from.search || ''}` || '/'
      : (['admin', 'super_admin'].includes(user.role) ? '/admin' : '/account');
    navigate(redirectTo, { replace: true });
  };

  const { signInWithGoogle, signInWithFacebook } = useSocialAuth({
    onSuccess: handleAuthSuccess,
    onError: (msg) => { setError(msg); setSocialLoading(null); }
  });

  const handleGoogleClick = () => {
    setError('');
    setSocialLoading('google');
    // signInWithGoogle resolves via callback — loading cleared in onSuccess/onError
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
      const user = await login(form);
      handleAuthSuccess(user);
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    }
  };

  return (
    <section className="auth-page login-page">
      <Seo title="Member Login" noIndex />
      <div className="login-hero-panel" aria-label="LahVenture account access">
        <div className="login-hero-copy">
          <p className="eyebrow">Member access</p>
          <h1>Enter your LahVenture watch account</h1>
          <p>
            Review orders, saved delivery addresses, wishlist pieces, and checkout progress in a secure customer profile.
          </p>
        </div>

        <div className="login-slideshow" aria-hidden="true">
          {loginSlides.map((slide, index) => (
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
            Protected checkout
          </span>
          <span>
            <Sparkles size={16} />
            Curated watches
          </span>
        </div>
      </div>

      <form className="auth-card login-card" onSubmit={submit}>
        <div className="login-card-heading">
          <p className="eyebrow">Welcome back</p>
          <h2>Sign in</h2>
          <span>Use your account email or a social provider to continue.</span>
        </div>

        <div className="social-login-grid" aria-label="Social sign in options">
          {/* Google */}
          <button
            type="button"
            className={`social-login-button${socialLoading === 'google' ? ' social-loading' : ''}`}
            onClick={handleGoogleClick}
            disabled={!!socialLoading}
            aria-label="Sign in with Google"
          >
            <GoogleLogo size={18} />
            {socialLoading === 'google' ? 'Loading…' : 'Google'}
          </button>

          {/* Apple — not available yet */}
          <div className="social-btn-wrapper">
            <button
              type="button"
              className="social-login-button social-coming-soon"
              onMouseEnter={() => {}}
              aria-label="Apple sign in (coming soon)"
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
            aria-label="Sign in with Facebook"
          >
            <FacebookLogo size={18} />
            {socialLoading === 'facebook' ? 'Loading…' : 'Facebook'}
          </button>
        </div>

        <div className="login-divider">
          <span>or continue with email</span>
        </div>

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
          Sign in securely
        </button>
        <p className="login-register-link">
          New customer? <Link to="/register">Create account</Link>
        </p>
      </form>
    </section>
  );
};
