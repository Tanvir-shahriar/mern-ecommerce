import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { apiErrorMessage } from '../services/api.js';

export const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

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
    <section className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <p className="eyebrow">Create profile</p>
        <h1>Register</h1>
        <label>
          Name
          <input required value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} />
        </label>
        <label>
          Email
          <input type="email" required value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} />
        </label>
        <label>
          Password
          <input type="password" minLength="8" required value={form.password} onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))} />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="button primary full" type="submit">
          Create account
        </button>
        <p>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </section>
  );
};
