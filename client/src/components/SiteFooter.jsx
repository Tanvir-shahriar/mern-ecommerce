import { ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import lahventureLogo from '../assets/images/Lahventure Logo.png';
import { api, apiErrorMessage } from '../services/api.js';

const footerColumns = [
  {
    title: 'Shop',
    links: [
      { label: 'All products', to: '/products' },
      { label: 'Smartwatches', to: '/products?category=smartwatches' },
      { label: 'Automatic watches', to: '/products?category=automatic-watches' },
      { label: 'Collections', to: '/collections' }
    ]
  },
  {
    title: 'Curated',
    links: [
      { label: 'Fashion', to: '/products?category=fashion' },
      { label: 'Electronics', to: '/products?category=electronics' },
      { label: 'Home & Living', to: '/products?category=home-living' },
      { label: 'Beauty & Care', to: '/products?category=beauty-personal-care' }
    ]
  },
  {
    title: 'Client care',
    links: [
      { label: 'Track an order', to: '/account?tab=orders' },
      { label: 'My account', to: '/account' },
      { label: 'Shopping cart', to: '/cart' },
      { label: 'Contact support', to: '/contact' }
    ]
  },
  {
    title: 'Connect',
    links: [
      { label: 'Email us', href: 'mailto:lahventure@gmail.com', external: false },
      { label: 'Call us', href: 'tel:+8801853379787', external: false },
      { label: 'Contact page', to: '/contact' },
      { label: 'About LahVenture', to: '/about' }
    ]
  }
];

const wordmarkLetters = Array.from('LAHVENTURE');

const FooterDirectoryLink = ({ item }) => (
  item.href ? (
    <a
      href={item.href}
      target={item.external === false ? undefined : '_blank'}
      rel={item.external === false ? undefined : 'noreferrer'}
    >
      {item.label}
    </a>
  ) : (
    <Link to={item.to}>{item.label}</Link>
  )
);

export const SiteFooter = ({ onVisibilityChange, variant = 'default' }) => {
  const footerRef = useRef(null);
  const newsletterRef = useRef(null);
  const directoryRef = useRef(null);
  const wordmarkRef = useRef(null);
  const [newsletterVisible, setNewsletterVisible] = useState(false);
  const [directoryVisible, setDirectoryVisible] = useState(false);
  const [wordmarkVisible, setWordmarkVisible] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState({ source: null, type: 'idle', message: '' });

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = [
      [newsletterRef.current, setNewsletterVisible, 0.2],
      [directoryRef.current, setDirectoryVisible, 0.14],
      [wordmarkRef.current, setWordmarkVisible, 0.24]
    ];

    if (reduceMotion || !('IntersectionObserver' in window)) {
      setNewsletterVisible(true);
      setDirectoryVisible(true);
      setWordmarkVisible(true);
      return undefined;
    }

    const observers = targets.map(([target, reveal, threshold]) => {
      if (!target) return null;
      const observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        reveal(true);
        observer.disconnect();
      }, {
        threshold,
        rootMargin: '0px 0px -5% 0px'
      });
      observer.observe(target);
      return observer;
    });

    return () => observers.forEach((observer) => observer?.disconnect());
  }, []);

  useEffect(() => {
    if (!onVisibilityChange || !footerRef.current) return undefined;

    if (!('IntersectionObserver' in window)) {
      const footer = footerRef.current;
      const scrollRoot = footer.closest('.editorial-collections-page__scroller');
      const updateVisibility = () => {
        const bounds = footer.getBoundingClientRect();
        onVisibilityChange(bounds.top < window.innerHeight && bounds.bottom > 0);
      };

      const eventTarget = scrollRoot || window;
      eventTarget.addEventListener('scroll', updateVisibility, { passive: true });
      window.addEventListener('resize', updateVisibility, { passive: true });
      updateVisibility();

      return () => {
        eventTarget.removeEventListener('scroll', updateVisibility);
        window.removeEventListener('resize', updateVisibility);
      };
    }

    const observer = new IntersectionObserver(([entry]) => {
      onVisibilityChange(entry.isIntersecting);
    }, { threshold: 0.015 });

    observer.observe(footerRef.current);
    return () => {
      observer.disconnect();
    };
  }, [onVisibilityChange]);

  const handleNewsletterSubmit = async (event, source) => {
    event.preventDefault();
    if (newsletterStatus.type === 'loading') return;

    const form = event.currentTarget;
    const email = String(new FormData(form).get('email') || '').trim();
    if (!email) return;

    setNewsletterStatus({ source, type: 'loading', message: 'Sending your request…' });

    try {
      await api.post('/contact', {
        name: 'Newsletter subscriber',
        email,
        phone: 'Newsletter signup',
        message: `Please add ${email} to the LahVenture newsletter list.`
      });
      form.reset();
      setNewsletterStatus({
        source,
        type: 'success',
        message: 'Thank you—your subscription request has been received.'
      });
    } catch (error) {
      setNewsletterStatus({ source, type: 'error', message: apiErrorMessage(error) });
    }
  };

  const newsletterMessage = (source) => (
    newsletterStatus.source === source && newsletterStatus.message ? (
      <p
        className={`lv-footer__form-message is-${newsletterStatus.type}`}
        role={newsletterStatus.type === 'error' ? 'alert' : 'status'}
      >
        {newsletterStatus.message}
      </p>
    ) : null
  );

  return (
    <footer
      ref={footerRef}
      className={`site-footer lv-footer lv-footer--${variant}`}
      aria-label="LahVenture footer"
    >
      <section
        ref={newsletterRef}
        className={`lv-footer__atelier${newsletterVisible ? ' is-revealed' : ''}`}
        aria-labelledby="lv-footer-newsletter-title"
      >
        <div className="lv-footer__atelier-copy">
          <p>The LahVenture Journal</p>
          <h2 id="lv-footer-newsletter-title">Join the LahVenture circle</h2>
          <span>Receive new arrivals, private previews and considered stories—direct to your inbox.</span>
        </div>

        <form
          className="lv-footer__atelier-form"
          onSubmit={(event) => handleNewsletterSubmit(event, 'featured')}
          aria-label="Newsletter signup"
        >
          <label className="sr-only" htmlFor="lv-footer-featured-email">Email address</label>
          <input
            id="lv-footer-featured-email"
            name="email"
            type="email"
            placeholder="Email address"
            autoComplete="email"
            required
          />
          <button type="submit" disabled={newsletterStatus.type === 'loading'}>
            {newsletterStatus.source === 'featured' && newsletterStatus.type === 'loading' ? 'Sending…' : 'Subscribe'}
          </button>
        </form>
        {newsletterMessage('featured')}
        <small>No spam, only considered words. Unsubscribe anytime.</small>
      </section>

      <div className="lv-footer__body">
        <div
          ref={directoryRef}
          className={`lv-footer__directory${directoryVisible ? ' is-revealed' : ''}`}
        >
          <div className="lv-footer__brand-panel">
            <Link to="/" className="lv-footer__brand-link" aria-label="LahVenture home">
              <img src={lahventureLogo} alt="" />
            </Link>
            <p>Curated watches and considered essentials, selected with care and delivered across Bangladesh.</p>
            <form
              className="lv-footer__inline-form"
              onSubmit={(event) => handleNewsletterSubmit(event, 'inline')}
              aria-label="Footer newsletter signup"
            >
              <label className="sr-only" htmlFor="lv-footer-inline-email">Email address</label>
              <input
                id="lv-footer-inline-email"
                name="email"
                type="email"
                placeholder="Email address"
                autoComplete="email"
                required
              />
              <button
                type="submit"
                aria-label={newsletterStatus.type === 'loading' ? 'Sending subscription request' : 'Subscribe to the newsletter'}
                disabled={newsletterStatus.type === 'loading'}
              >
                <ArrowRight size={17} strokeWidth={1.5} />
              </button>
            </form>
            {newsletterMessage('inline')}
          </div>

          <nav className="lv-footer__nav" aria-label="Footer navigation">
            {footerColumns.map((column, columnIndex) => (
              <div
                className="lv-footer__nav-column"
                key={column.title}
                style={{ '--column-index': columnIndex }}
              >
                <h2>{column.title}</h2>
                {column.links.map((item) => <FooterDirectoryLink item={item} key={item.label} />)}
              </div>
            ))}
          </nav>
        </div>

        <Link
          ref={wordmarkRef}
          to="/"
          className={`lv-footer__wordmark${wordmarkVisible ? ' is-revealed' : ''}`}
        >
          <span className="sr-only">LahVenture home</span>
          <span className="lv-footer__wordmark-letters" aria-hidden="true">
            {wordmarkLetters.map((letter, index) => (
              <span className="lv-footer__letter-shell" key={`${letter}-${index}`}>
                <span
                  className={`lv-footer__letter${index % 2 ? ' fills-left' : ' fills-right'}`}
                  style={{ '--letter-index': index }}
                >
                  <span className="lv-footer__letter-outline">{letter}</span>
                  <span className="lv-footer__letter-fill">{letter}</span>
                </span>
              </span>
            ))}
          </span>
        </Link>

        <div className="lv-footer__legal">
          <span>© {new Date().getFullYear()} LahVenture. All rights reserved.</span>
          <div>
            <Link to="/contact">Contact</Link>
            <Link to="/about">About</Link>
            <a href="mailto:lahventure@gmail.com">Email</a>
            <span>Dhaka, Bangladesh</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
