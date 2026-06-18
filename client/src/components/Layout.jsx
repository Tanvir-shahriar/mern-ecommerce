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
    setOpen(false);
    navigate('/');
  };

  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-inner">
          <div className="brand-group">
            <button
              type="button"
              className="header-menu-toggle"
              onClick={() => setOpen((value) => !value)}
              aria-label="Menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link to="/" className="brand" aria-label="lahVenture">
              <img className="brand-logo" src={logoPath} alt="" />
              <span className="brand-title">LAHVENTURE</span>
            </Link>
          </div>

          <nav className={open ? 'primary-nav open' : 'primary-nav'}>
            <NavLink className={navClass} to="/products" onClick={() => setOpen(false)}>
              Shop
            </NavLink>
            <NavLink className={navClass} to="/products?filter=brands" onClick={() => setOpen(false)}>
              Brands
            </NavLink>
            <NavLink className={navClass} to="/products" onClick={() => setOpen(false)}>
              Catalog
            </NavLink>
            <NavLink className={navClass} to="/about" onClick={() => setOpen(false)}>
              About
            </NavLink>
            <NavLink className={navClass} to="/contact" onClick={() => setOpen(false)}>
              Contact
            </NavLink>
            {isAdmin ? (
              <NavLink className={`${navClass} nav-admin-only`} to="/admin" onClick={() => setOpen(false)}>
                Admin
              </NavLink>
            ) : null}
          </nav>

          {showSearch ? (
            <form className="header-search-active" onSubmit={submitSearch}>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search watches..."
                autoFocus
                onBlur={() => {
                  if (!search) {
                    setTimeout(() => setShowSearch(false), 200);
                  }
                }}
              />
              <button type="submit" className="search-active-submit" aria-label="Submit search">
                <Search size={18} />
              </button>
            </form>
          ) : null}

          <div className="header-actions">
            {!showSearch && (
              <button
                type="button"
                className="header-action-btn search-toggle"
                onClick={() => setShowSearch(true)}
                aria-label="Search"
              >
                <Search size={19} />
              </button>
            )}
            {user ? (
              <div className="profile-menu-container">
                <Link className="header-action-btn" to="/account" aria-label="Profile">
                  <User size={19} />
                </Link>
                <div className="profile-dropdown">
                  <div className="profile-dropdown-inner">
                    <Link to="/account" className="dropdown-item">My Account</Link>
                    <button type="button" className="dropdown-item signout-btn" onClick={handleLogout}>
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link className="header-action-btn" to="/login" aria-label="Sign in">
                <User size={19} />
              </Link>
            )}
            <Link className="header-action-btn cart-link-custom" to="/cart" aria-label="Cart">
              <ShoppingBag size={19} />
              {itemCount ? <span className="cart-badge-dot-custom">{itemCount}</span> : null}
            </Link>
          </div>
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
