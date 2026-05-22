import { Heart, LayoutDashboard, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';

const navClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');
const logoPath = '/lahventure.png';
const BrandName = () => (
  <span className="brand-name">
    lah<span className="brand-v">Venture</span>
  </span>
);

export const Layout = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();

  const submitSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products');
    setOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link to="/" className="brand" aria-label="lahVenture">
          <img className="brand-logo" src={logoPath} alt="" />
          <BrandName />
        </Link>

        <nav className={open ? 'primary-nav open' : 'primary-nav'}>
          <NavLink className={navClass} to="/" onClick={() => setOpen(false)}>
            Home
          </NavLink>
          <NavLink className={navClass} to="/products" onClick={() => setOpen(false)}>
            Shop
          </NavLink>
          {isAdmin ? (
            <NavLink className={navClass} to="/admin" onClick={() => setOpen(false)}>
              Admin
            </NavLink>
          ) : null}
        </nav>

        <form className="header-search" onSubmit={submitSearch}>
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search watches"
            aria-label="Search watches and smartwatches"
          />
        </form>

        <div className="header-actions">
          {isAdmin ? (
            <Link className="icon-button" to="/admin" aria-label="Dashboard">
              <LayoutDashboard size={19} />
            </Link>
          ) : null}
          {user ? (
            <Link className="icon-button" to="/account" aria-label="Profile">
              <User size={19} />
            </Link>
          ) : (
            <Link className="text-link" to="/login">
              Sign in
            </Link>
          )}
          <Link className="icon-button cart-link" to="/cart" aria-label="Cart">
            <ShoppingBag size={19} />
            {itemCount ? <span>{itemCount}</span> : null}
          </Link>
          <button type="button" className="icon-button mobile-toggle" onClick={() => setOpen((value) => !value)} aria-label="Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {user ? (
          <button type="button" className="logout-button" onClick={handleLogout}>
            Sign out
          </button>
        ) : null}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div>
          <Link to="/" className="brand small">
            <img className="brand-logo" src={logoPath} alt="" />
            <BrandName />
          </Link>
          <p>Watches, smartwatches, straps, and accessories with live order tracking.</p>
        </div>
        <div className="footer-links">
          <Link to="/products">Catalog</Link>
          <Link to="/cart">Cart</Link>
          <Link to="/account">Account</Link>
        </div>
        <Heart size={18} />
      </footer>
    </div>
  );
};
