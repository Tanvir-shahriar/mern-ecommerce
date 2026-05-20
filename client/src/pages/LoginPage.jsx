import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { apiErrorMessage } from '../services/api.js';

export const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const user = await login(form);
      navigate(location.state?.from?.pathname || (user.role === 'admin' ? '/admin' : '/account'), { replace: true });
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    }
  };

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in</h1>
        <label>
          Email
          <input type="email" required value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} />
        </label>
        <label>
          Password
          <input type="password" required value={form.password} onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))} />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="button primary full" type="submit">
          Sign in
        </button>
        <p>
          New customer? <Link to="/register">Create account</Link>
        </p>
      </form>
    </section>
  );
};
