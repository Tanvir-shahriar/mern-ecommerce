import {
  BarChart3,
  Boxes,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Image,
  Mail,
  Palette,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  Video
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

const adminSections = {
  compliance: {
    label: 'Compliance',
    description: 'Store operations',
    icon: ShieldCheck,
    landingPath: '/admin',
    tabs: [
      { label: 'Dashboard', path: '/admin', icon: BarChart3, end: true },
      { label: 'Products', path: '/admin/products', icon: Boxes },
      { label: 'Brands', path: '/admin/brands', icon: Tags },
      { label: 'Orders', path: '/admin/orders', icon: ClipboardList },
      { label: 'Messages', path: '/admin/contact-messages', icon: Mail },
      { label: 'Users', path: '/admin/users', icon: Users },
      { label: 'Currency', path: '/admin/currency', icon: CircleDollarSign },
      { label: 'Payments', path: '/admin/payment-methods', icon: CreditCard }
    ]
  },
  design: {
    label: 'Design',
    description: 'Storefront content',
    icon: Palette,
    landingPath: '/admin/hero',
    tabs: [
      { label: 'Hero', path: '/admin/hero', icon: Video },
      { label: 'Gallery', path: '/admin/gallery', icon: Image }
    ]
  }
};

const sectionKeys = Object.keys(adminSections);
const tabClassName = ({ isActive }) => (isActive ? 'admin-tab active' : 'admin-tab');

const sectionFromPath = (pathname) => (
  pathname.startsWith('/admin/hero') || pathname.startsWith('/admin/gallery')
    ? 'design'
    : 'compliance'
);

export const AdminNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const switcherRef = useRef(null);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const activeSectionKey = sectionFromPath(location.pathname);
  const activeSection = adminSections[activeSectionKey];

  useEffect(() => {
    setIsSwitcherOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isSwitcherOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!switcherRef.current?.contains(event.target)) {
        setIsSwitcherOpen(false);
      }
    };

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setIsSwitcherOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isSwitcherOpen]);

  const selectSection = (sectionKey) => {
    setIsSwitcherOpen(false);
    if (sectionKey !== activeSectionKey) {
      navigate(adminSections[sectionKey].landingPath);
    }
  };

  return (
    <nav className="admin-navigation" aria-label="Admin navigation">
      <div className="admin-section-switcher" ref={switcherRef}>
        <button
          type="button"
          className="admin-section-trigger"
          onClick={() => setIsSwitcherOpen((isOpen) => !isOpen)}
          aria-expanded={isSwitcherOpen}
          aria-haspopup="menu"
        >
          <span className="admin-section-trigger-icon" aria-hidden="true">
            <Settings size={18} />
          </span>
          <span className="admin-section-trigger-copy">
            <small>Admin area</small>
            <strong>{activeSection.label}</strong>
          </span>
          <ChevronDown
            className={isSwitcherOpen ? 'admin-section-chevron open' : 'admin-section-chevron'}
            size={17}
            aria-hidden="true"
          />
        </button>

        {isSwitcherOpen ? (
          <div className="admin-section-menu" role="menu">
            {sectionKeys.map((sectionKey) => {
              const section = adminSections[sectionKey];
              const SectionIcon = section.icon;
              const isActive = sectionKey === activeSectionKey;

              return (
                <button
                  type="button"
                  className={isActive ? 'admin-section-option active' : 'admin-section-option'}
                  onClick={() => selectSection(sectionKey)}
                  role="menuitem"
                  aria-current={isActive ? 'page' : undefined}
                  key={sectionKey}
                >
                  <SectionIcon size={18} aria-hidden="true" />
                  <span>
                    <strong>{section.label}</strong>
                    <small>{section.description}</small>
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="admin-tabs" aria-label={`${activeSection.label} admin pages`}>
        {activeSection.tabs.map(({ label, path, icon: Icon, end }) => (
          <NavLink className={tabClassName} to={path} end={end} key={path}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
