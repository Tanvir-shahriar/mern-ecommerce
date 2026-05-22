import { Heart, LayoutDashboard, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';

const navClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');
const logoPath = '/lahventure.png';
const BrandName = () => (
  <span className="brand-name">
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
        <div className="header-inner">
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
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search Watches..."
              aria-label="Search watches and smartwatches"
            />
            <button type="submit" className="header-search-button" aria-label="Search">
              <Search size={18} />
            </button>
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
              <Link className="icon-button" to="/login" aria-label="Sign in">
                <User size={19} />
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
        </div>
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
