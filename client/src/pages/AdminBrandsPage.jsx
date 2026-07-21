import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, ImagePlus, Plus, Save, Star, Trash2, Upload, X, Layers, Boxes } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { AdminLoadingState } from '../components/AdminLoadingState.jsx';
import { AdminNav } from '../components/AdminNav.jsx';
import { Seo } from '../components/Seo.jsx';
import { api, apiErrorMessage, mediaUrl } from '../services/api.js';

const defaultCollections = [
  {
    categoryKey: 'fashion',
    title: 'FASHION COLLECTION',
    kicker: 'SPRING / SUMMER 2026',
    stampText: 'FASHION • EXCLUSIVE COLLECTION • 2026',
    tagline: 'Curated Haute Couture, Modern Apparel & Luxury Styling',
    bannerImage: {
      url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
      alt: 'Fashion Collection'
    },
    productIds: [],
    isActive: true,
    order: 0
  },
  {
    categoryKey: 'electronics',
    title: 'ELECTRONICS COLLECTION',
    kicker: 'NEXT-GEN TECH & WEARABLES',
    stampText: 'ELECTRONICS • INNOVATION & TECH • 2026',
    tagline: 'State-of-the-art Audio, Smartwatches & Cutting Edge Devices',
    bannerImage: {
      url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
      alt: 'Electronics Collection'
    },
    productIds: [],
    isActive: true,
    order: 1
  },
  {
    categoryKey: 'home-living',
    title: 'HOME & LIVING COLLECTION',
    kicker: 'MODERN INTERIORS & DECOR',
    stampText: 'HOME & LIVING • ELEGANT DESIGN • 2026',
    tagline: 'Refined Home Aesthetics, Minimalist Furniture & Living Gear',
    bannerImage: {
      url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
      alt: 'Home Living Collection'
    },
    productIds: [],
    isActive: true,
    order: 2
  },
  {
    categoryKey: 'beauty-care',
    title: 'BEAUTY & PERSONAL CARE',
    kicker: 'ESSENTIAL CARE & LUXURY BEAUTY',
    stampText: 'BEAUTY • LUXURY CARE • 2026',
    tagline: 'Botanical Skincare, Fragrance Masterpieces & Organic Self-Care',
    bannerImage: {
      url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
      alt: 'Beauty Collection'
    },
    productIds: [],
    isActive: true,
    order: 3
  }
];

const newFaq = () => ({
  id: `brand-faq-${Date.now()}`,
  question: '',
  answer: '',
  isActive: true
});

const normalizeFaq = (faq = {}, index = 0) => ({
  id: faq.id || `brand-faq-${index + 1}`,
  question: faq.question || '',
  answer: faq.answer || '',
  isActive: faq.isActive !== false
});

const normalizeFaqForm = (settings) => {
  if (settings && Array.isArray(settings.faqs) && settings.faqs.length) {
    return settings.faqs.map(normalizeFaq);
  }
  return [newFaq()];
};

export const AdminBrandsPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('collections'); // 'collections' | 'faqs'
  const [collectionsForm, setCollectionsForm] = useState(defaultCollections);
  const [faqForm, setFaqForm] = useState(() => [newFaq()]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [message, setMessage] = useState({ text: '', type: 'success' });

  // Query Settings
  const {
    data: brandPageSettings,
    isLoading: settingsLoading,
    isError: settingsIsError,
    error: settingsError
  } = useQuery({
    queryKey: ['admin-brand-page-settings'],
    queryFn: async () => {
      const { data } = await api.get('/admin/brand-page');
      return data.data;
    }
  });

  // Query All Products for manual selection in collections
  const { data: allProducts = [] } = useQuery({
    queryKey: ['admin-all-products'],
    queryFn: async () => {
      const { data } = await api.get('/products', { params: { limit: 100 } });
      return data.data.products || [];
    }
  });

  useEffect(() => {
    if (brandPageSettings) {
      if (brandPageSettings.collections && brandPageSettings.collections.length > 0) {
        setCollectionsForm(brandPageSettings.collections);
      }
      setFaqForm(normalizeFaqForm(brandPageSettings));
    }
  }, [brandPageSettings]);

  const updateCollectionField = (index, field, value) => {
    setCollectionsForm((current) => current.map((col, idx) => (
      idx === index ? { ...col, [field]: value } : col
    )));
  };

  const updateCollectionImage = (index, imageObj) => {
    setCollectionsForm((current) => current.map((col, idx) => (
      idx === index ? { ...col, bannerImage: imageObj } : col
    )));
  };

  const uploadCollectionBanner = async (index, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(`collection-${index}`);
    setMessage({ text: '', type: 'success' });

    try {
      const formData = new FormData();
      formData.append('images', file);
      const { data } = await api.post('/uploads/brands', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const image = data.data.images?.[0];
      if (image) {
        updateCollectionImage(index, {
          url: image.url,
          alt: image.alt || collectionsForm[index].title || 'Banner',
          publicId: image.publicId
        });
        setMessage({ text: 'Banner image uploaded. Click Save to publish.', type: 'success' });
      }
    } catch (uploadError) {
      setMessage({ text: apiErrorMessage(uploadError), type: 'error' });
    } finally {
      setUploading('');
      event.target.value = '';
    }
  };

  const toggleProductInCollection = (colIndex, productId) => {
    setCollectionsForm((current) => current.map((col, idx) => {
      if (idx !== colIndex) return col;
      const currentIds = col.productIds || [];
      const exists = currentIds.includes(productId);
      const nextIds = exists
        ? currentIds.filter((id) => id !== productId)
        : [...currentIds, productId];
      return { ...col, productIds: nextIds };
    }));
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: 'success' });

    try {
      const payload = {
        collections: collectionsForm,
        faqs: faqForm.filter((faq) => faq.question || faq.answer)
      };

      const { data } = await api.patch('/admin/brand-page', payload);
      setMessage({ text: data.message || 'Collections settings saved successfully!', type: 'success' });
      queryClient.setQueryData(['admin-brand-page-settings'], data.data);
      queryClient.invalidateQueries({ queryKey: ['brand-page-settings'] });
      queryClient.invalidateQueries({ queryKey: ['brand-page-public'] });
    } catch (err) {
      setMessage({ text: apiErrorMessage(err), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (settingsLoading) {
    return (
      <section className="admin-page section">
        <Seo title="Admin Collections" noIndex />
        <AdminNav />
        <AdminLoadingState label="Loading collections configuration" />
      </section>
    );
  }

  return (
    <section className="admin-page admin-brands-page section">
      <Seo title="Admin Collections" noIndex />
      <AdminNav />

      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Storefront Content</p>
          <h1>Collections & Category Heros</h1>
        </div>
        <div className="toolbar-actions">
          <button className="button primary" type="submit" form="admin-collections-form" disabled={saving}>
            <Save size={17} />
            {saving ? 'Saving...' : 'Save Collections'}
          </button>
        </div>
      </div>

      {message.text ? (
        <p className={message.type === 'error' ? 'form-error admin-currency-message' : 'form-note admin-currency-message'}>
          {message.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {message.text}
        </p>
      ) : null}

      <form id="admin-collections-form" onSubmit={saveSettings}>
        <div className="admin-collections-manager">
          <div className="editor-card-heading">
            <div>
              <p className="eyebrow">4 Category Hero Sections</p>
              <h2>Fashion, Electronics, Home & Living, Beauty & Personal Care</h2>
            </div>
          </div>

          <div className="admin-collections-grid" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', marginTop: '1.5rem' }}>
            {collectionsForm.map((col, colIdx) => (
              <article className="panel admin-collection-hero-card" key={col.categoryKey || colIdx} style={{ padding: '2rem' }}>
                <div className="editor-card-heading compact-heading" style={{ marginBottom: '1.5rem' }}>
                  <div>
                    <span className="eyebrow" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700', color: '#a1a1aa' }}>
                      Category Section {colIdx + 1}
                    </span>
                    <h3 style={{ margin: '0.25rem 0', fontSize: '1.4rem', textTransform: 'uppercase' }}>{col.title}</h3>
                  </div>
                  <label className="checkbox-row compact-checkbox">
                    <input
                      type="checkbox"
                      checked={col.isActive !== false}
                      onChange={(e) => updateCollectionField(colIdx, 'isActive', e.target.checked)}
                    />
                    Section Active
                  </label>
                </div>

                <div className="admin-brand-form-grid">
                  <label>
                    Section Title
                    <input
                      value={col.title}
                      onChange={(e) => updateCollectionField(colIdx, 'title', e.target.value)}
                      placeholder="FASHION COLLECTION"
                    />
                  </label>
                  <label>
                    Kicker / Season Subtitle
                    <input
                      value={col.kicker}
                      onChange={(e) => updateCollectionField(colIdx, 'kicker', e.target.value)}
                      placeholder="SPRING / SUMMER 2026"
                    />
                  </label>
                  <label>
                    Rotating Stamp Text
                    <input
                      value={col.stampText}
                      onChange={(e) => updateCollectionField(colIdx, 'stampText', e.target.value)}
                      placeholder="FASHION • EXCLUSIVE COLLECTION • 2026"
                    />
                  </label>
                  <label>
                    Tagline
                    <input
                      value={col.tagline}
                      onChange={(e) => updateCollectionField(colIdx, 'tagline', e.target.value)}
                      placeholder="Curated Luxury Apparel & High-End Couture"
                    />
                  </label>
                </div>

                {/* Banner Media */}
                <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>Hero Banner Image</p>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {col.bannerImage?.url ? (
                      <div className="admin-brand-image-preview" style={{ width: '120px', height: '80px' }}>
                        <img src={mediaUrl(col.bannerImage.url)} alt={col.title} />
                      </div>
                    ) : null}
                    <div style={{ flex: 1 }}>
                      <input
                        value={col.bannerImage?.url || ''}
                        onChange={(e) => updateCollectionImage(colIdx, { ...(col.bannerImage || {}), url: e.target.value })}
                        placeholder="Image URL"
                        style={{ width: '100%', marginBottom: '0.5rem' }}
                      />
                      <label className="payment-method-image-upload admin-brand-upload">
                        <Upload size={15} />
                        <span>{uploading === `collection-${colIdx}` ? 'Uploading...' : 'Upload Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploading === `collection-${colIdx}`}
                          onChange={(e) => uploadCollectionBanner(colIdx, e)}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Manually Featured Products */}
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <p className="eyebrow" style={{ margin: 0 }}>Featured Products in Hero Carousel</p>
                    <small style={{ color: '#71717a' }}>Select products to display (auto-fills from store if none selected)</small>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', maxHeight: '240px', overflowY: 'auto', padding: '0.75rem', background: '#09090b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px' }}>
                    {allProducts.map((product) => {
                      const isSelected = (col.productIds || []).includes(String(product._id || product.id));
                      return (
                        <div
                          key={product._id || product.id}
                          onClick={() => toggleProductInCollection(colIdx, String(product._id || product.id))}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                            border: isSelected ? '1px solid #ffffff' : '1px solid transparent'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isSelected ? '#fff' : '#a1a1aa' }}>
                            {product.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </form>
    </section>
  );
};
