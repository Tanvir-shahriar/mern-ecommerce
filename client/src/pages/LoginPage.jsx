import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppleLogo, FacebookLogo, GoogleLogo } from '../components/SocialLogos.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { apiErrorMessage } from '../services/api.js';

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
  const [notice, setNotice] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      const user = await login(form);
      const from = location.state?.from;
      const redirectTo = from
        ? `${from.pathname || ''}${from.search || ''}` || '/'
        : (['admin', 'super_admin'].includes(user.role) ? '/admin' : '/account');
      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    }
  };

  const socialLoginNotice = (provider) => {
    setError('');
    setNotice(`${provider} sign-in is not connected yet. Use email and password for now.`);
  };

  return (
    <section className="auth-page login-page">
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
          <span>Use your account email to continue.</span>
        </div>

        <div className="social-login-grid" aria-label="Social sign in options">
          <button type="button" className="social-login-button" onClick={() => socialLoginNotice('Google')}>
            <GoogleLogo size={18} />
            Google
          </button>
          <button type="button" className="social-login-button" onClick={() => socialLoginNotice('Apple')}>
            <AppleLogo size={18} />
            Apple
          </button>
          <button type="button" className="social-login-button" onClick={() => socialLoginNotice('Facebook')}>
            <FacebookLogo size={18} />
            Facebook
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
        {notice ? <p className="form-note login-social-note">{notice}</p> : null}
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
