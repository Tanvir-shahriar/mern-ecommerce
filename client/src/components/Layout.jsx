import {
  ArrowUpRight,
  Clock3,
  Globe2,
  Heart,
  Mail,
  MapPin,
  Menu,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Truck,
  User,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { useCurrency } from '../contexts/CurrencyContext.jsx';
import successWayLogo from '../assets/Logo/Success way logo.jpg';

const navClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');
const logoPath = successWayLogo;

export const Layout = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const { currency, currencies, setCurrency } = useCurrency();
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    if (!open) {
      setActiveCategory(null);
    }
  }, [open]);

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
      {open && <div className="menu-backdrop" onClick={() => setOpen(false)} />}
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
            <Link to="/" className="brand" aria-label="Success Way">
              <img className="brand-logo" src={logoPath} alt="" />
            </Link>

            {open && (
              <div className="hamburger-dropdown">
                <Link to="/" className="hamburger-item" onClick={() => setOpen(false)}>
                  Home
                </Link>

                <Link to="/products" className="hamburger-item" onClick={() => setOpen(false)}>
                  Shop
                </Link>

                <Link to="/products?filter=brands" className="hamburger-item" onClick={() => setOpen(false)}>
                  Brands
                </Link>
                
                <div className={`hamburger-item-has-submenu ${activeCategory === 'watch' ? 'active' : ''}`}>
                  <div className="hamburger-item" onClick={(e) => {
                    e.stopPropagation();
                    setActiveCategory(prev => prev === 'watch' ? null : 'watch');
                  }}>
                    <span>Watch</span>
                    <span className="submenu-plus">{activeCategory === 'watch' ? '−' : '+'}</span>
                  </div>
                  <div className="hamburger-submenu">
                    <Link to="/products?category=smartwatches" className="hamburger-submenu-item" onClick={() => setOpen(false)}>Smartwatches</Link>
                    <Link to="/products?category=automatic-watches" className="hamburger-submenu-item" onClick={() => setOpen(false)}>Automatic Watches</Link>
                    <Link to="/products?category=chronographs" className="hamburger-submenu-item" onClick={() => setOpen(false)}>Chronographs</Link>
                  </div>
                </div>

                <div className={`hamburger-item-has-submenu ${activeCategory === 'sunglass' ? 'active' : ''}`}>
                  <div className="hamburger-item" onClick={(e) => {
                    e.stopPropagation();
                    setActiveCategory(prev => prev === 'sunglass' ? null : 'sunglass');
                  }}>
                    <span>Sun Glass</span>
                    <span className="submenu-plus">{activeCategory === 'sunglass' ? '−' : '+'}</span>
                  </div>
                  <div className="hamburger-submenu">
                    <Link to="/products?category=sun-glass-mens" className="hamburger-submenu-item" onClick={() => setOpen(false)}>Mens</Link>
                    <Link to="/products?category=sun-glass-women" className="hamburger-submenu-item" onClick={() => setOpen(false)}>Women</Link>
                  </div>
                </div>

                <div className={`hamburger-item-has-submenu ${activeCategory === 'beauty' ? 'active' : ''}`}>
                  <div className="hamburger-item" onClick={(e) => {
                    e.stopPropagation();
                    setActiveCategory(prev => prev === 'beauty' ? null : 'beauty');
                  }}>
                    <span>Beauty Products</span>
                    <span className="submenu-plus">{activeCategory === 'beauty' ? '−' : '+'}</span>
                  </div>
                  <div className="hamburger-submenu">
                    <Link to="/products?category=skincare" className="hamburger-submenu-item" onClick={() => setOpen(false)}>Skincare</Link>
                    <Link to="/products?category=fragrance" className="hamburger-submenu-item" onClick={() => setOpen(false)}>Fragrance</Link>
                  </div>
                </div>

                <div className={`hamburger-item-has-submenu ${activeCategory === 'clothing' ? 'active' : ''}`}>
                  <div className="hamburger-item" onClick={(e) => {
                    e.stopPropagation();
                    setActiveCategory(prev => prev === 'clothing' ? null : 'clothing');
                  }}>
                    <span>Clothing</span>
                    <span className="submenu-plus">{activeCategory === 'clothing' ? '−' : '+'}</span>
                  </div>
                  <div className="hamburger-submenu">
                    <Link to="/products?category=clothing-mens" className="hamburger-submenu-item" onClick={() => setOpen(false)}>Mens</Link>
                    <Link to="/products?category=clothing-women" className="hamburger-submenu-item" onClick={() => setOpen(false)}>Women</Link>
                    <Link to="/products?category=clothing-kids" className="hamburger-submenu-item" onClick={() => setOpen(false)}>Kids</Link>
                  </div>
                </div>

                <div className={`hamburger-item-has-submenu ${activeCategory === 'shoes' ? 'active' : ''}`}>
                  <div className="hamburger-item" onClick={(e) => {
                    e.stopPropagation();
                    setActiveCategory(prev => prev === 'shoes' ? null : 'shoes');
                  }}>
                    <span>Shoes</span>
                    <span className="submenu-plus">{activeCategory === 'shoes' ? '−' : '+'}</span>
                  </div>
                  <div className="hamburger-submenu">
                    <Link to="/products?category=shoes-sneakers" className="hamburger-submenu-item" onClick={() => setOpen(false)}>Sneakers</Link>
                    <Link to="/products?category=shoes-formal" className="hamburger-submenu-item" onClick={() => setOpen(false)}>Formal</Link>
                    <Link to="/products?category=shoes-boots" className="hamburger-submenu-item" onClick={() => setOpen(false)}>Boots</Link>
                  </div>
                </div>

                <div className={`hamburger-item-has-submenu ${activeCategory === 'accessories' ? 'active' : ''}`}>
                  <div className="hamburger-item" onClick={(e) => {
                    e.stopPropagation();
                    setActiveCategory(prev => prev === 'accessories' ? null : 'accessories');
                  }}>
                    <span>Accessories</span>
                    <span className="submenu-plus">{activeCategory === 'accessories' ? '−' : '+'}</span>
                  </div>
                  <div className="hamburger-submenu">
                    <Link to="/products?category=straps-accessories" className="hamburger-submenu-item" onClick={() => setOpen(false)}>Straps</Link>
                    <Link to="/products?category=cases" className="hamburger-submenu-item" onClick={() => setOpen(false)}>Cases</Link>
                    <Link to="/products?category=wallets" className="hamburger-submenu-item" onClick={() => setOpen(false)}>Wallets</Link>
                  </div>
                </div>

                <Link to="/about" className="hamburger-item" onClick={() => setOpen(false)}>
                  About
                </Link>

                <Link to="/contact" className="hamburger-item" onClick={() => setOpen(false)}>
                  Contact
                </Link>

                {isAdmin ? (
                  <Link to="/admin" className="hamburger-item" onClick={() => setOpen(false)}>
                    Admin Panel
                  </Link>
                ) : null}

                {currencies?.length > 1 ? (
                  <div className="hamburger-item mobile-currency-container">
                    <span className="mobile-currency-label">
                      <Globe2 size={16} />
                      Currency
                    </span>
                    <select
                      value={currency}
                      onChange={(event) => setCurrency(event.target.value)}
                      className="hamburger-currency-select"
                    >
                      {currencies.map((item) => (
                        <option value={item.code} key={item.code}>
                          {item.code}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>
            )}
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
            {currencies?.length > 1 ? (
              <label className="currency-switcher" aria-label="Display currency">
                <Globe2 size={16} />
                <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
                  {currencies.map((item) => (
                    <option value={item.code} key={item.code}>
                      {item.code}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
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
                    <Link to="/account?tab=orders" className="dropdown-item">
                      <Package size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                      My Orders
                    </Link>
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
        <div className="footer-inner">
          <div className="footer-brand-panel">
            <Link to="/" className="footer-brand" aria-label="Success Way home">
              <img className="footer-logo" src={logoPath} alt="" />
            </Link>
            <p>
              Curated watches and smartwatches for Bangladesh, with clear product data,
              secure checkout, saved delivery profiles, and order tracking.
            </p>

            <div className="footer-service-strip" aria-label="Success Way service highlights">
              <span>
                <ShieldCheck size={17} />
                Verified listings
              </span>
              <span>
                <Truck size={17} />
                Tracked delivery
              </span>
              <span>
                <Clock3 size={17} />
                After-order updates
              </span>
            </div>
          </div>

          <div className="footer-directory" aria-label="Footer navigation">
            <div className="footer-column">
              <h2>Collections</h2>
              <Link to="/products">All watches</Link>
              <Link to="/products?category=Smartwatch">Smartwatches</Link>
              <Link to="/products?category=Automatic%20Watches">Automatic watches</Link>
              <Link to="/products?category=Chronographs">Chronographs</Link>
              <Link to="/products?category=Straps%20%26%20Accessories">Straps and accessories</Link>
            </div>

            <div className="footer-column">
              <h2>Brands</h2>
              <Link to="/products?brand=Sea-Gull">Sea-Gull</Link>
              <Link to="/products?brand=San%20Martin">San Martin</Link>
              <Link to="/products?brand=Sugess">Sugess</Link>
              <Link to="/products?brand=Pagani%20Design">Pagani Design</Link>
              <Link to="/products?filter=brands">View all brands</Link>
            </div>

            <div className="footer-column">
              <h2>Service</h2>
              <Link to="/account">My account</Link>
              <Link to="/cart">Cart</Link>
              <Link to="/account">Order tracking</Link>
              <Link to="/contact">Contact support</Link>
              <Link to="/products">Search catalog</Link>
            </div>

            <div className="footer-column footer-contact-column">
              <h2>Contact</h2>
              <Link to="/contact">
                <Mail size={16} />
                Contact support
              </Link>
              <Link to="/account">
                <Truck size={16} />
                Track an order
              </Link>
              <span>
                <MapPin size={16} />
                Dhaka, Bangladesh
              </span>
              <Link className="footer-contact-cta" to="/contact">
                Get assistance
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>

          <div className="footer-newsletter">
            <div>
              <p className="footer-kicker">Collectors desk</p>
              <h2>Receive new arrivals and watch-care notes.</h2>
            </div>
            <form
              className="footer-newsletter-form"
              onSubmit={(event) => event.preventDefault()}
              aria-label="Newsletter signup"
            >
              <input type="email" placeholder="Email address" aria-label="Email address" />
              <button type="submit">Notify me</button>
            </form>
          </div>

          <div className="footer-bottom">
            <span>© 2026 Success Way. Time well lived.</span>
            <div className="footer-legal">
              <span>Secure checkout</span>
              <span>Bangladesh delivery</span>
              <span>Customer-first support</span>
            </div>
            <Heart size={17} aria-hidden="true" />
          </div>
        </div>
      </footer>
    </div>
  );
};
