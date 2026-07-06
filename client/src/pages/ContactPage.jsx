import { Globe2, Mail, MapPin, Phone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Seo } from '../components/Seo.jsx';
import { api, apiErrorMessage } from '../services/api.js';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  message: ''
};

const contactItems = [
  {
    className: 'contact-grid-item-1',
    icon: Mail,
    label: 'Email',
    value: 'lahventure@gmail.com',
    href: 'mailto:lahventure@gmail.com'
  },
  {
    className: 'contact-grid-item-2',
    icon: Globe2,
    label: 'Website',
    value: 'lahventure.com',
    href: 'https://lahventure.com'
  },
  {
    className: 'contact-grid-item-3',
    icon: Phone,
    label: 'Phone',
    value: '+880-1853379787',
    href: 'tel:+8801853379787'
  },
  {
    className: 'contact-grid-item-4',
    icon: MapPin,
    label: 'Location',
    value: 'Dhaka, Bangladesh',
    href: 'https://www.google.com/maps/search/?api=1&query=Dhaka%2C%20Bangladesh'
  }
];

export const ContactPage = () => {
  const [phase, setPhase] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('success');
  const [submitting, setSubmitting] = useState(false);
  const timersRef = useRef([]);

  const clearTimers = () => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current = [];
  };

  const queueTimer = (callback, delay) => {
    const timerId = window.setTimeout(callback, delay);
    timersRef.current.push(timerId);
  };

  useEffect(() => {
    const fontId = 'contact-poppins-font';
    let addedFontLink = false;

    if (!document.getElementById(fontId)) {
      const fontLink = document.createElement('link');
      fontLink.id = fontId;
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;800&display=swap';
      document.head.appendChild(fontLink);
      addedFontLink = true;
    }

    setPhase(1);
    queueTimer(() => setPhase(2), 1500);

    return () => {
      clearTimers();
      if (addedFontLink) {
        document.getElementById(fontId)?.remove();
      }
    };
  }, []);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    if (statusMessage) {
      setStatusMessage('');
      setStatusType('success');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearTimers();

    const submittedName = form.name.trim() || 'there';
    setStatusMessage('');
    setStatusType('success');
    setSubmitting(true);
    setPhase(3);

    try {
      await api.post('/contact', form);
      queueTimer(() => {
        setStatusMessage(`Thank you, ${submittedName}. Your message has been sent.`);
        setStatusType('success');
        setForm(initialForm);
        setSubmitting(false);
        setPhase(1);
        queueTimer(() => setPhase(2), 1500);
      }, 900);
    } catch (error) {
      queueTimer(() => {
        setStatusMessage(apiErrorMessage(error));
        setStatusType('error');
        setSubmitting(false);
        setPhase(2);
      }, 700);
    }
  };

  const contactSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact LahVenture',
    url: `${window.location.origin}/contact`,
    mainEntity: {
      '@type': 'Organization',
      name: 'LahVenture',
      url: 'https://lahventure.com',
      email: 'lahventure@gmail.com',
      telephone: '+8801853379787',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Dhaka',
        addressCountry: 'BD'
      }
    }
  };

  return (
    <section className="contact-page">
      <Seo
        title="Contact"
        description="Contact LahVenture for watch orders, customer support, delivery questions, and product assistance in Bangladesh."
        canonicalUrl={`${window.location.origin}/contact`}
        schemaJson={contactSchema}
      />

      <div className={`contact-shell contact-state-phase${phase}`}>
        <div className="contact-copy-column">
          <div className="contact-heading-container">
            <h1>Get in touch.</h1>
            <p>
              Whether you have questions about our services, need support, or want to share your feedback, our
              dedicated team is here to assist you every step of the way.
            </p>
          </div>

          <div className="contact-info-grid" aria-label="LahVenture contact information">
            {contactItems.map((item) => {
              const Icon = item.icon;

              return (
                <a className={`contact-info-item ${item.className}`} href={item.href} key={item.label}>
                  <span className="contact-info-icon" aria-hidden="true">
                    <Icon size={24} strokeWidth={2.4} />
                  </span>
                  <span className="contact-info-text">
                    <strong>{item.label}</strong>
                    <span>{item.value}</span>
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        <div className="contact-form-card">
          <form className="contact-form" onSubmit={handleSubmit}>
            <label className="contact-field contact-name-container">
              <span>Name</span>
              <input
                type="text"
                placeholder="Francisco Andrade"
                required
                value={form.name}
                onChange={updateField('name')}
              />
            </label>

            <div className="contact-field-grid">
              <label className="contact-field">
                <span>Email</span>
                <span className="contact-reveal-field">
                  <span className="contact-email-skeleton contact-field-skeleton" aria-hidden="true">
                    <span />
                  </span>
                  <input
                    className="contact-email-input"
                    type="email"
                    placeholder="hello@reallygreatsite.com"
                    required
                    value={form.email}
                    onChange={updateField('email')}
                  />
                </span>
              </label>

              <label className="contact-field">
                <span>Phone Number</span>
                <span className="contact-reveal-field">
                  <span className="contact-phone-skeleton contact-field-skeleton" aria-hidden="true">
                    <span />
                  </span>
                  <input
                    className="contact-phone-input"
                    type="tel"
                    placeholder="123-456-7890"
                    required
                    value={form.phone}
                    onChange={updateField('phone')}
                  />
                </span>
              </label>
            </div>

            <label className="contact-field contact-message-container">
              <span>Message</span>
              <textarea
                rows="4"
                placeholder="Hi..."
                required
                value={form.message}
                onChange={updateField('message')}
              />
            </label>

            <div className="contact-submit-container">
              <button type="submit" disabled={submitting}>{submitting ? 'Sending...' : 'Submit'}</button>
            </div>

            {statusMessage ? <p className={`contact-status-message ${statusType}`}>{statusMessage}</p> : null}
          </form>
        </div>
      </div>
    </section>
  );
};
