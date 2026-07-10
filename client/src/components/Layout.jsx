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
import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { useCurrency } from '../contexts/CurrencyContext.jsx';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { api, mediaUrl } from '../services/api.js';
import lahventureLogo from '../assets/images/Lahventure Logo.png';

const navClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');
const logoPath = lahventureLogo;

export const Layout = () => {
  const location = useLocation();
  const isAboutPage = location.pathname === '/about';
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const { currency, currencies, setCurrency, formatMoney } = useCurrency();
  const [activeCategory, setActiveCategory] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);

  const searchContainerRef = useRef(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  // Autocomplete Suggestions Query
  const { data: suggestions = [], isLoading: isSuggestionsLoading } = useQuery({
    queryKey: ['search-suggestions', debouncedSearch],
    queryFn: async () => {
      const queryStr = debouncedSearch.trim();
      if (queryStr.length < 2) return [];
      try {
        const { data } = await api.get('/search/suggestions', {
          params: { q: queryStr }
        });
        return data.data.suggestions || [];
      } catch (err) {
        console.error('Error fetching search suggestions:', err);
        return [];
      }
    },
    enabled: debouncedSearch.trim().length >= 2
  });

  // Popular Trending Searches Query
  const { data: popularQueries = [] } = useQuery({
    queryKey: ['popular-searches'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/search/popular');
        return data.data.queries || [];
      } catch (e) {
        console.error('Error fetching popular searches:', e);
        return [];
      }
    },
    enabled: showSearch
  });

  // Load recent searches from localStorage on focus
  useEffect(() => {
    if (showSearch) {
      const recents = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      setRecentSearches(recents);
    }
  }, [showSearch]);

  const saveRecentSearch = (queryStr) => {
    const q = queryStr.trim();
    if (!q) return;
    const recents = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const filtered = [q, ...recents.filter(x => x.toLowerCase() !== q.toLowerCase())].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(filtered));
    setRecentSearches(filtered);
  };

  const clearRecentSearches = () => {
    localStorage.removeItem('recentSearches');
    setRecentSearches([]);
  };

  useEffect(() => {
    if (!open) {
      setActiveCategory(null);
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearch(false);
        setActiveSuggestionIndex(-1);
      }
    };
    if (showSearch) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearch]);

  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [suggestions]);

  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    const cleanQuery = query.trim();
    if (!cleanQuery) return text;

    const terms = cleanQuery.split(/\s+/).filter(Boolean);
    if (terms.length === 0) return text;

    const escapeRegexStr = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexStr = `(${terms.map(escapeRegexStr).join('|')})`;
    const parts = text.split(new RegExp(regexStr, 'gi'));

    return (
      <span>
        {parts.map((part, index) =>
          terms.some((term) => term.toLowerCase() === part.toLowerCase()) ? (
            <mark key={index} className="search-highlight">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const handleKeyDown = (e) => {
    if (!showSearch) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setShowSearch(false);
      setActiveSuggestionIndex(-1);
    } else if (e.key === 'Enter') {
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        e.preventDefault();
        const selectedProduct = suggestions[activeSuggestionIndex];
        saveRecentSearch(selectedProduct.name);
        navigate(`/products/${selectedProduct.slug || selectedProduct._id}`);
        setShowSearch(false);
        setActiveSuggestionIndex(-1);
      } else {
        e.preventDefault();
        submitSearch(e);
      }
    }
  };

  const submitSearch = (event) => {
    event?.preventDefault();
    const query = search.trim();
    if (query) {
      saveRecentSearch(query);
      navigate(`/products?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/products');
    }
    setShowSearch(false);
    setOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate('/');
  };

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
            <Link to="/" className="brand" aria-label="lahVenture">
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

                <Link to="/brands" className="hamburger-item" onClick={() => setOpen(false)}>
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
            <NavLink className={navClass} to="/" onClick={() => setOpen(false)}>
              Home
            </NavLink>
            <NavLink className={navClass} to="/products" onClick={() => setOpen(false)}>
              Shop
            </NavLink>
            <NavLink className={navClass} to="/brands" onClick={() => setOpen(false)}>
              Brands
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
            <div className="header-search-container" ref={searchContainerRef}>
              <form className="header-search-active" onSubmit={submitSearch} onKeyDown={handleKeyDown}>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search products, brands, categories..."
                  autoFocus
                />
                <button type="submit" className="search-active-submit" aria-label="Submit search">
                  <Search size={18} />
                </button>
              </form>

              <div className="search-dropdown">
                {search.trim().length < 2 ? (
                  <div className="search-dropdown-meta-sections">
                    {recentSearches.length > 0 && (
                      <div className="search-meta-section">
                        <div className="search-meta-section-header">
                          <span>Recent Searches</span>
                          <button
                            type="button"
                            className="search-meta-clear-btn"
                            onClick={clearRecentSearches}
                          >
                            Clear
                          </button>
                        </div>
                        <div className="search-meta-list">
                          {recentSearches.map((item, idx) => (
                            <div
                              key={idx}
                              className="search-meta-item"
                              onClick={() => {
                                setSearch(item);
                                navigate(`/products?search=${encodeURIComponent(item)}`);
                                saveRecentSearch(item);
                                setShowSearch(false);
                              }}
                            >
                              <Clock3 size={13} className="search-meta-icon" />
                              <span className="search-meta-text">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="search-meta-section">
                      <div className="search-meta-section-header">
                        <span>Trending Searches</span>
                      </div>
                      <div className="search-trending-tags">
                        {popularQueries.length > 0 ? (
                          popularQueries.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="search-trending-tag"
                              onClick={() => {
                                setSearch(item);
                                navigate(`/products?search=${encodeURIComponent(item)}`);
                                saveRecentSearch(item);
                                setShowSearch(false);
                              }}
                            >
                              {item}
                            </button>
                          ))
                        ) : (
                          <span className="search-meta-empty">No trending searches yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {isSuggestionsLoading ? (
                      <div className="search-dropdown-loading">Searching timepieces...</div>
                    ) : suggestions.length > 0 ? (
                      <div className="search-dropdown-results">
                        {suggestions.map((product, index) => (
                          <Link
                            to={`/products/${product.slug || product._id}`}
                            key={product._id}
                            className={`search-dropdown-item ${index === activeSuggestionIndex ? 'active' : ''}`}
                            onClick={() => {
                              saveRecentSearch(product.name);
                              setShowSearch(false);
                              setActiveSuggestionIndex(-1);
                            }}
                          >
                            <img
                              src={mediaUrl(product.images?.[0]?.url)}
                              alt={product.images?.[0]?.alt || product.name}
                              className="search-dropdown-item-img"
                            />
                            <div className="search-dropdown-item-info">
                              <span className="search-dropdown-item-brand">
                                {highlightMatch(product.brand, search)}
                              </span>
                              <span className="search-dropdown-item-name">
                                {highlightMatch(product.name, search)}
                              </span>
                              <span className="search-dropdown-item-price">
                                {formatMoney(product.price)}
                              </span>
                            </div>
                          </Link>
                        ))}
                        <div className="search-dropdown-footer">
                          <Link
                            to={`/products?search=${encodeURIComponent(search.trim())}`}
                            onClick={() => {
                              saveRecentSearch(search);
                              setShowSearch(false);
                              setActiveSuggestionIndex(-1);
                            }}
                            className="search-dropdown-view-all"
                          >
                            View all results for "{search.trim()}"
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="search-dropdown-empty">
                        No products found for "{search.trim()}"
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
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

      {!isAboutPage && (
        <footer className="site-footer">
          <div className="footer-inner">
            <div className="footer-brand-panel">
              <Link to="/" className="footer-brand" aria-label="lahVenture home">
                <img className="footer-logo" src={logoPath} alt="" />
              </Link>
              <p>
                Curated watches and smartwatches for Bangladesh, with clear product data,
                secure checkout, saved delivery profiles, and order tracking.
              </p>

              <div className="footer-service-strip" aria-label="LahVenture service highlights">
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
                <Link to="/brands">View all brands</Link>
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
              <span>© 2026 LahVenture. Time well lived.</span>
              <div className="footer-legal">
                <span>Secure checkout</span>
                <span>Bangladesh delivery</span>
                <span>Customer-first support</span>
              </div>
              <Heart size={17} aria-hidden="true" />
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
