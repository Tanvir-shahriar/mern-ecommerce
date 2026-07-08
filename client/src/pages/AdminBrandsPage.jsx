import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, ImagePlus, Plus, Save, Star, Trash2, Upload, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { AdminLoadingState } from '../components/AdminLoadingState.jsx';
import { AdminNav } from '../components/AdminNav.jsx';
import { Seo } from '../components/Seo.jsx';
import { api, apiErrorMessage, mediaUrl } from '../services/api.js';

const emptyBrand = {
  name: '',
  tagline: '',
  description: '',
  filterGroup: 'Swiss Heritage',
  origin: '',
  founded: '',
  image: null,
  spotlightImage: null,
  spotlightTitle: '',
  spotlightDescription: '',
  ctaText: 'Explore Collection',
  isActive: true,
  isSpotlight: false,
  order: 0
};

const normalizeBrand = (brand = {}) => ({
  ...emptyBrand,
  ...brand,
  image: brand.image || null,
  spotlightImage: brand.spotlightImage || null,
  order: brand.order ?? 0
});

const serializeBrand = (brand) => ({
  name: brand.name.trim(),
  tagline: brand.tagline.trim() || undefined,
  description: brand.description.trim() || undefined,
  filterGroup: brand.filterGroup.trim() || 'All Brands',
  origin: brand.origin.trim() || undefined,
  founded: brand.founded.trim() || undefined,
  image: brand.image?.url ? brand.image : null,
  spotlightImage: brand.spotlightImage?.url ? brand.spotlightImage : null,
  spotlightTitle: brand.spotlightTitle.trim() || undefined,
  spotlightDescription: brand.spotlightDescription.trim() || undefined,
  ctaText: brand.ctaText.trim() || 'Explore Collection',
  isActive: brand.isActive,
  isSpotlight: brand.isSpotlight,
  order: Number(brand.order || 0)
});

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

const serializeFaq = (faq) => ({
  id: faq.id,
  question: faq.question.trim(),
  answer: faq.answer.trim(),
  isActive: faq.isActive !== false
});

export const AdminBrandsPage = () => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState('new');
  const [form, setForm] = useState(emptyBrand);
  const [faqForm, setFaqForm] = useState(() => [newFaq()]);
  const [saving, setSaving] = useState(false);
  const [faqSaving, setFaqSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [message, setMessage] = useState({ text: '', type: 'success' });
  const [faqMessage, setFaqMessage] = useState({ text: '', type: 'success' });

  const { data: brands = [], isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: async () => {
      const { data } = await api.get('/brands/admin');
      return data.data.brands;
    }
  });

  const {
    data: brandPageSettings,
    isLoading: faqLoading,
    isFetching: faqFetching,
    isError: faqIsError,
    error: faqError
  } = useQuery({
    queryKey: ['admin-brand-page-settings'],
    queryFn: async () => {
      const { data } = await api.get('/admin/brand-page');
      return data.data;
    }
  });

  const selectedBrand = useMemo(
    () => brands.find((brand) => brand._id === selectedId),
    [brands, selectedId]
  );

  useEffect(() => {
    if (selectedId === 'new') {
      setForm({ ...emptyBrand, order: brands.length });
      return;
    }

    if (selectedBrand) setForm(normalizeBrand(selectedBrand));
  }, [selectedId, selectedBrand?._id, brands.length]);

  useEffect(() => {
    if (brandPageSettings) setFaqForm(normalizeFaqForm(brandPageSettings));
  }, [brandPageSettings]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateImage = (key, image) => {
    setForm((current) => ({ ...current, [key]: image }));
  };

  const updateFaq = (index, patch) => {
    setFaqForm((current) => current.map((faq, faqIndex) => (
      faqIndex === index ? { ...faq, ...patch } : faq
    )));
  };

  const addFaq = () => {
    setFaqForm((current) => [...current, newFaq()]);
  };

  const removeFaq = (index) => {
    setFaqForm((current) => {
      const next = current.filter((_, faqIndex) => faqIndex !== index);
      return next.length ? next : [newFaq()];
    });
  };

  const moveFaq = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= faqForm.length) return;
    setFaqForm((current) => {
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(nextIndex, 0, moved);
      return next;
    });
  };

  const uploadBrandImage = async (target, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(target);
    setMessage({ text: '', type: 'success' });

    try {
      const formData = new FormData();
      formData.append('images', file);
      const { data } = await api.post('/uploads/brands', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const image = data.data.images?.[0];
      if (image) {
        updateImage(target, {
          url: image.url,
          alt: image.alt || form.name || 'Brand image',
          publicId: image.publicId
        });
        setMessage({ text: 'Image uploaded. Save the brand to publish it.', type: 'success' });
      }
    } catch (uploadError) {
      setMessage({ text: apiErrorMessage(uploadError), type: 'error' });
    } finally {
      setUploading('');
      event.target.value = '';
    }
  };

  const saveBrand = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: 'success' });

    try {
      const payload = serializeBrand(form);
      const response = selectedId === 'new'
        ? await api.post('/brands', payload)
        : await api.patch(`/brands/${selectedId}`, payload);

      const savedBrand = response.data.data.brand;
      setSelectedId(savedBrand._id);
      setMessage({ text: selectedId === 'new' ? 'Brand created' : 'Brand saved', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (saveError) {
      setMessage({ text: apiErrorMessage(saveError), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const saveFaqSettings = async (event) => {
    event.preventDefault();
    setFaqSaving(true);
    setFaqMessage({ text: '', type: 'success' });

    const faqs = faqForm
      .map(serializeFaq)
      .filter((faq) => faq.question || faq.answer);

    if (faqs.some((faq) => !faq.question || !faq.answer)) {
      setFaqMessage({ text: 'Each saved FAQ needs both a question and an answer.', type: 'error' });
      setFaqSaving(false);
      return;
    }

    try {
      const { data } = await api.patch('/admin/brand-page', { faqs });
      setFaqForm(normalizeFaqForm(data.data));
      setFaqMessage({ text: data.message || 'Brand FAQ section saved', type: 'success' });
      queryClient.setQueryData(['admin-brand-page-settings'], data.data);
      queryClient.invalidateQueries({ queryKey: ['brand-page-settings'] });
    } catch (saveError) {
      setFaqMessage({ text: apiErrorMessage(saveError), type: 'error' });
    } finally {
      setFaqSaving(false);
    }
  };

  const deleteBrand = async () => {
    if (selectedId === 'new') return;
    setSaving(true);
    setMessage({ text: '', type: 'success' });

    try {
      await api.delete(`/brands/${selectedId}`);
      setSelectedId('new');
      setMessage({ text: 'Brand deleted', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    } catch (deleteError) {
      setMessage({ text: apiErrorMessage(deleteError), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <section className="admin-page section">
        <Seo title="Admin Brands" noIndex />
        <AdminNav />
        <AdminLoadingState label="Loading brands" />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="admin-page section">
        <Seo title="Admin Brands" noIndex />
        <AdminNav />
        <div className="panel">
          <p className="form-error">
            <AlertTriangle size={16} />
            {apiErrorMessage(error)}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page admin-brands-page section">
      <Seo title="Admin Brands" noIndex />
      <AdminNav />

      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1>Brands</h1>
        </div>
        <div className="toolbar-actions">
          {isFetching ? <span className="admin-fetching"><span className="spinner tiny" /> Syncing</span> : null}
          <button className="button primary" type="submit" form="admin-brand-form" disabled={saving}>
            <Save size={17} />
            {saving ? 'Saving...' : selectedId === 'new' ? 'Create brand' : 'Save brand'}
          </button>
        </div>
      </div>

      {message.text ? (
        <p className={message.type === 'error' ? 'form-error admin-currency-message' : 'form-note admin-currency-message'}>
          {message.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {message.text}
        </p>
      ) : null}

      <div className="admin-brands-layout">
        <aside className="panel admin-brand-list-panel">
          <div className="editor-card-heading">
            <div>
              <p className="eyebrow">Saved brands</p>
              <h2>Brand categories</h2>
            </div>
            <button className="button compact" type="button" onClick={() => setSelectedId('new')}>
              <Plus size={15} />
              New
            </button>
          </div>

          <div className="admin-brand-list">
            {brands.map((brand) => (
              <button
                type="button"
                className={`admin-brand-row${selectedId === brand._id ? ' active' : ''}`}
                onClick={() => setSelectedId(brand._id)}
                key={brand._id}
              >
                <span className="admin-brand-row-image">
                  {brand.image?.url ? <img src={mediaUrl(brand.image.url)} alt={brand.image.alt || brand.name} /> : <ImagePlus size={18} />}
                </span>
                <span>
                  <strong>{brand.name}</strong>
                  <small>{brand.productCount || 0} product(s)</small>
                </span>
                {brand.isSpotlight ? <Star size={15} fill="currentColor" /> : null}
              </button>
            ))}
          </div>
        </aside>

        <form id="admin-brand-form" className="panel admin-brand-editor" onSubmit={saveBrand}>
          <div className="editor-card-heading">
            <div>
              <p className="eyebrow">{selectedId === 'new' ? 'New brand' : 'Edit brand'}</p>
              <h2>Brand details</h2>
            </div>
            {selectedId !== 'new' ? (
              <button className="button compact secondary danger-soft" type="button" onClick={deleteBrand} disabled={saving || (selectedBrand?.productCount || 0) > 0}>
                <Trash2 size={15} />
                Delete
              </button>
            ) : null}
          </div>

          <div className="admin-brand-form-grid">
            <label>
              Brand name
              <input required value={form.name} onChange={(event) => updateField('name', event.target.value)} />
            </label>
            <label>
              Display group
              <input value={form.filterGroup} onChange={(event) => updateField('filterGroup', event.target.value)} placeholder="Swiss Heritage" />
            </label>
            <label>
              Tagline
              <input value={form.tagline} onChange={(event) => updateField('tagline', event.target.value)} placeholder="Haute Horlogerie" />
            </label>
            <label>
              Order
              <input type="number" value={form.order} onChange={(event) => updateField('order', event.target.value)} />
            </label>
            <label>
              Founded
              <input value={form.founded} onChange={(event) => updateField('founded', event.target.value)} placeholder="1839" />
            </label>
            <label>
              Origin
              <input value={form.origin} onChange={(event) => updateField('origin', event.target.value)} placeholder="Geneva" />
            </label>
            <label className="span-2">
              Description
              <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} />
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={form.isActive} onChange={(event) => updateField('isActive', event.target.checked)} />
              Show on public brands page
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={form.isSpotlight} onChange={(event) => updateField('isSpotlight', event.target.checked)} />
              Use as brand spotlight
            </label>
          </div>

          <div className="admin-brand-media-grid">
            <div className="admin-brand-media-card">
              <div className="editor-card-heading compact-heading">
                <div>
                  <p className="eyebrow">Card image</p>
                  <h3>Brand grid media</h3>
                </div>
              </div>
              {form.image?.url ? (
                <div className="admin-brand-image-preview">
                  <img src={mediaUrl(form.image.url)} alt={form.image.alt || form.name || 'Brand'} />
                  <button type="button" onClick={() => updateImage('image', null)} aria-label="Remove card image">
                    <X size={15} />
                  </button>
                </div>
              ) : null}
              <label>
                Image URL
                <input value={form.image?.url || ''} onChange={(event) => updateImage('image', { ...(form.image || {}), url: event.target.value, alt: form.image?.alt || form.name })} />
              </label>
              <label className="payment-method-image-upload admin-brand-upload">
                <Upload size={17} />
                <span>{uploading === 'image' ? 'Uploading...' : 'Upload image'}</span>
                <input type="file" accept="image/*" disabled={uploading === 'image'} onChange={(event) => uploadBrandImage('image', event)} />
              </label>
            </div>

            <div className="admin-brand-media-card">
              <div className="editor-card-heading compact-heading">
                <div>
                  <p className="eyebrow">Spotlight</p>
                  <h3>Feature section</h3>
                </div>
              </div>
              <label>
                Spotlight title
                <input value={form.spotlightTitle} onChange={(event) => updateField('spotlightTitle', event.target.value)} />
              </label>
              <label>
                Spotlight image URL
                <input value={form.spotlightImage?.url || ''} onChange={(event) => updateImage('spotlightImage', { ...(form.spotlightImage || {}), url: event.target.value, alt: form.spotlightImage?.alt || form.name })} />
              </label>
              {form.spotlightImage?.url ? (
                <div className="admin-brand-image-preview">
                  <img src={mediaUrl(form.spotlightImage.url)} alt={form.spotlightImage.alt || form.name || 'Brand spotlight'} />
                  <button type="button" onClick={() => updateImage('spotlightImage', null)} aria-label="Remove spotlight image">
                    <X size={15} />
                  </button>
                </div>
              ) : null}
              <label>
                Spotlight description
                <textarea value={form.spotlightDescription} onChange={(event) => updateField('spotlightDescription', event.target.value)} />
              </label>
              <label className="payment-method-image-upload admin-brand-upload">
                <Upload size={17} />
                <span>{uploading === 'spotlightImage' ? 'Uploading...' : 'Upload spotlight image'}</span>
                <input type="file" accept="image/*" disabled={uploading === 'spotlightImage'} onChange={(event) => uploadBrandImage('spotlightImage', event)} />
              </label>
            </div>
          </div>
        </form>
      </div>

      <form id="admin-brand-faq-form" className="panel admin-brand-faq-editor" onSubmit={saveFaqSettings}>
        <div className="editor-card-heading">
          <div>
            <p className="eyebrow">Brands page</p>
            <h2>FAQ section</h2>
          </div>
          <div className="admin-faq-heading-actions">
            {faqFetching ? <span className="admin-fetching"><span className="spinner tiny" /> Syncing</span> : null}
            <button className="button compact" type="button" onClick={addFaq}>
              <Plus size={15} />
              Add FAQ
            </button>
            <button className="button primary compact" type="submit" disabled={faqSaving || faqLoading || faqIsError}>
              <Save size={16} />
              {faqSaving ? 'Saving...' : 'Save FAQ'}
            </button>
          </div>
        </div>

        {faqMessage.text ? (
          <p className={faqMessage.type === 'error' ? 'form-error admin-currency-message' : 'form-note admin-currency-message'}>
            {faqMessage.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            {faqMessage.text}
          </p>
        ) : null}

        {faqLoading ? (
          <AdminLoadingState label="Loading brand FAQs" />
        ) : faqIsError ? (
          <p className="form-error">
            <AlertTriangle size={16} />
            {apiErrorMessage(faqError)}
          </p>
        ) : (
          <div className="admin-faq-list">
            {faqForm.map((faq, index) => (
              <article className="admin-faq-item" key={faq.id || index}>
                <div className="admin-faq-item-heading">
                  <strong>FAQ {index + 1}</strong>
                  <div className="admin-faq-item-actions">
                    <label className="checkbox-row compact-checkbox">
                      <input
                        type="checkbox"
                        checked={faq.isActive}
                        onChange={(event) => updateFaq(index, { isActive: event.target.checked })}
                      />
                      Active
                    </label>
                    <button type="button" className="button icon-button" onClick={() => moveFaq(index, -1)} disabled={index === 0} aria-label="Move FAQ up">
                      <ArrowUp size={15} />
                    </button>
                    <button type="button" className="button icon-button" onClick={() => moveFaq(index, 1)} disabled={index === faqForm.length - 1} aria-label="Move FAQ down">
                      <ArrowDown size={15} />
                    </button>
                    <button type="button" className="button icon-button danger-soft" onClick={() => removeFaq(index)} aria-label="Remove FAQ">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="admin-faq-fields">
                  <label>
                    Question
                    <input
                      value={faq.question}
                      onChange={(event) => updateFaq(index, { question: event.target.value })}
                      placeholder="Are all brand watches genuine?"
                    />
                  </label>
                  <label>
                    Answer
                    <textarea
                      value={faq.answer}
                      onChange={(event) => updateFaq(index, { answer: event.target.value })}
                      placeholder="Write the customer-facing answer."
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>
        )}
      </form>
    </section>
  );
};
