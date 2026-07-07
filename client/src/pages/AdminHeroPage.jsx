import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, Copy, Image, Plus, Save, Trash2, Upload, Video } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AdminLoadingState } from '../components/AdminLoadingState.jsx';
import { AdminNav } from '../components/AdminNav.jsx';
import { Seo } from '../components/Seo.jsx';
import { defaultHeroSlides } from '../data/heroDefaults.js';
import { api, apiErrorMessage, mediaUrl } from '../services/api.js';

const clone = (value) => JSON.parse(JSON.stringify(value || {}));

const mediaAssetUrl = (asset) => {
  if (!asset?.url) return '';
  return mediaUrl(asset.url);
};

const titleText = (title) => {
  if (Array.isArray(title)) return title.join('\n');
  return String(title || '');
};

const hexToRgb = (hex) => {
  const clean = String(hex || '').replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return '122, 11, 23';
  const value = Number.parseInt(clean, 16);
  return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
};

const normalizeMedia = (media = {}) => ({
  url: media?.url || '',
  alt: media?.alt || '',
  publicId: media?.publicId || '',
  mimeType: media?.mimeType || ''
});

const normalizeSlide = (slide = {}, index = 0) => ({
  id: slide.id || `hero-${index + 1}`,
  badge: slide.badge || '',
  sku: slide.sku || '',
  titleText: titleText(slide.title),
  slogan: slide.slogan || '',
  subtext: slide.subtext || '',
  ctaText: slide.ctaText || 'SHOP',
  ctaUrl: slide.ctaUrl || '/products',
  image: normalizeMedia(slide.image),
  video: {
    url: slide.video?.url || '',
    thumbnail: slide.video?.thumbnail || '',
    title: slide.video?.title || '',
    alt: slide.video?.alt || '',
    publicId: slide.video?.publicId || '',
    mimeType: slide.video?.mimeType || ''
  },
  gradient: slide.gradient || defaultHeroSlides[0].gradient,
  accentColor: slide.accentColor || defaultHeroSlides[0].accentColor,
  accentColorRgb: slide.accentColorRgb || hexToRgb(slide.accentColor),
  badgeBg: slide.badgeBg || defaultHeroSlides[0].badgeBg,
  badgeColor: slide.badgeColor || defaultHeroSlides[0].badgeColor,
  badgeBgTrans: slide.badgeBgTrans || defaultHeroSlides[0].badgeBgTrans,
  badgeBorderTrans: slide.badgeBorderTrans || defaultHeroSlides[0].badgeBorderTrans,
  isActive: slide.isActive !== false
});

const normalizeForm = (settings) => ({
  slides: (settings?.slides?.length ? settings.slides : defaultHeroSlides).map(normalizeSlide)
});

const compactMedia = (media) => {
  if (!media?.url) return null;
  return {
    url: media.url.trim(),
    alt: media.alt?.trim() || '',
    publicId: media.publicId || '',
    mimeType: media.mimeType || ''
  };
};

const serializeSlide = (slide, index) => ({
  id: slide.id || `hero-${index + 1}`,
  badge: slide.badge.trim(),
  sku: slide.sku.trim(),
  title: slide.titleText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 5),
  slogan: slide.slogan.trim(),
  subtext: slide.subtext.trim(),
  ctaText: slide.ctaText.trim() || 'SHOP',
  ctaUrl: slide.ctaUrl.trim() || '/products',
  image: compactMedia(slide.image),
  video: slide.video.url.trim() || slide.video.thumbnail.trim()
    ? {
        url: slide.video.url.trim(),
        thumbnail: slide.video.thumbnail.trim(),
        title: slide.video.title.trim(),
        alt: slide.video.alt.trim(),
        publicId: slide.video.publicId || '',
        mimeType: slide.video.mimeType || ''
      }
    : null,
  gradient: slide.gradient.trim(),
  accentColor: slide.accentColor.trim(),
  accentColorRgb: slide.accentColorRgb.trim() || hexToRgb(slide.accentColor),
  badgeBg: slide.badgeBg.trim(),
  badgeColor: slide.badgeColor.trim(),
  badgeBgTrans: slide.badgeBgTrans.trim(),
  badgeBorderTrans: slide.badgeBorderTrans.trim(),
  isActive: slide.isActive !== false
});

const newSlide = () => normalizeSlide({
  id: `hero-${Date.now()}`,
  badge: 'NEW ARRIVAL',
  sku: 'LV-HERO',
  title: ['NEW', 'HERO', 'SLIDE'],
  slogan: 'A Fresh Feature',
  subtext: 'Add a description for this hero section card.',
  image: defaultHeroSlides[0].image,
  video: defaultHeroSlides[0].video,
  ctaText: 'SHOP',
  ctaUrl: '/products'
});

export const AdminHeroPage = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [message, setMessage] = useState({ text: '', type: 'success' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');

  const { data: settings, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['admin-hero'],
    queryFn: async () => {
      const { data } = await api.get('/admin/hero');
      return data.data;
    }
  });

  useEffect(() => {
    if (settings) setForm(normalizeForm(settings));
  }, [settings]);

  const selectedSlide = form?.slides?.[selectedIndex] || form?.slides?.[0];
  const previewTitle = selectedSlide?.titleText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) || [];
  const previewImage = mediaAssetUrl(selectedSlide?.image);
  const previewVideoThumb = selectedSlide?.video?.thumbnail ? mediaUrl(selectedSlide.video.thumbnail) : previewImage;

  const updateSlide = (index, patch) => {
    setForm((current) => ({
      ...current,
      slides: current.slides.map((slide, slideIndex) => (
        slideIndex === index ? { ...slide, ...patch } : slide
      ))
    }));
  };

  const updateSelected = (patch) => updateSlide(selectedIndex, patch);

  const updateSelectedImage = (patch) => {
    updateSelected({
      image: {
        ...selectedSlide.image,
        ...patch
      }
    });
  };

  const updateSelectedVideo = (patch) => {
    updateSelected({
      video: {
        ...selectedSlide.video,
        ...patch
      }
    });
  };

  const addSlide = () => {
    setForm((current) => {
      const slides = [...current.slides, newSlide()];
      setSelectedIndex(slides.length - 1);
      return { ...current, slides };
    });
  };

  const duplicateSlide = () => {
    setForm((current) => {
      const copy = {
        ...clone(selectedSlide),
        id: `${selectedSlide.id || 'hero'}-copy-${Date.now()}`
      };
      const slides = [...current.slides];
      slides.splice(selectedIndex + 1, 0, copy);
      setSelectedIndex(selectedIndex + 1);
      return { ...current, slides };
    });
  };

  const removeSlide = () => {
    if (!form || form.slides.length <= 1) return;
    setForm((current) => {
      const slides = current.slides.filter((_, index) => index !== selectedIndex);
      setSelectedIndex(Math.max(0, selectedIndex - 1));
      return { ...current, slides };
    });
  };

  const moveSlide = (direction) => {
    const nextIndex = selectedIndex + direction;
    if (!form || nextIndex < 0 || nextIndex >= form.slides.length) return;
    setForm((current) => {
      const slides = [...current.slides];
      const [moved] = slides.splice(selectedIndex, 1);
      slides.splice(nextIndex, 0, moved);
      setSelectedIndex(nextIndex);
      return { ...current, slides };
    });
  };

  const uploadHeroMedia = async (target, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const uploadKey = `${selectedIndex}-${target}`;
    setUploading(uploadKey);
    setMessage({ text: '', type: 'success' });

    try {
      const formData = new FormData();
      formData.append('media', file);
      const { data } = await api.post('/uploads/hero', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const uploaded = data.data.media?.[0];
      if (!uploaded) return;

      if (target === 'image') {
        updateSelectedImage({
          url: uploaded.url,
          alt: uploaded.alt || selectedSlide.slogan || previewTitle.join(' '),
          publicId: uploaded.publicId,
          mimeType: uploaded.mimeType
        });
      }

      if (target === 'video') {
        updateSelectedVideo({
          url: uploaded.url,
          title: selectedSlide.video.title || uploaded.alt || selectedSlide.slogan,
          alt: selectedSlide.video.alt || uploaded.alt,
          publicId: uploaded.publicId,
          mimeType: uploaded.mimeType
        });
      }

      if (target === 'thumbnail') {
        updateSelectedVideo({
          thumbnail: uploaded.url,
          alt: selectedSlide.video.alt || uploaded.alt
        });
      }

      setMessage({ text: 'Media uploaded. Save hero settings to publish it.', type: 'success' });
    } catch (uploadError) {
      setMessage({ text: apiErrorMessage(uploadError), type: 'error' });
    } finally {
      setUploading('');
      event.target.value = '';
    }
  };

  const saveHero = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: 'success' });

    const slides = form.slides.map(serializeSlide).filter((slide) => slide.title.length || slide.image || slide.video);
    if (!slides.length) {
      setMessage({ text: 'Add at least one hero slide before saving.', type: 'error' });
      setSaving(false);
      return;
    }

    try {
      const { data } = await api.patch('/admin/hero', { slides });
      const nextForm = normalizeForm(data.data);
      setForm(nextForm);
      setSelectedIndex((index) => Math.min(index, nextForm.slides.length - 1));
      setMessage({ text: data.message || 'Hero section saved', type: 'success' });
      queryClient.setQueryData(['admin-hero'], data.data);
      queryClient.invalidateQueries({ queryKey: ['hero-settings'] });
    } catch (saveError) {
      setMessage({ text: apiErrorMessage(saveError), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <section className="admin-page section">
        <Seo title="Admin Hero Section" noIndex />
        <AdminNav />
        <AdminLoadingState label="Loading hero settings" />
      </section>
    );
  }

  if (isError || !form || !selectedSlide) {
    return (
      <section className="admin-page section">
        <Seo title="Admin Hero Section" noIndex />
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
    <section className="admin-page admin-hero-page section">
      <Seo title="Admin Hero Section" noIndex />
      <AdminNav />

      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Homepage</p>
          <h1>Hero section</h1>
        </div>
        <div className="toolbar-actions">
          {isFetching ? <span className="admin-fetching"><span className="spinner tiny" /> Syncing</span> : null}
          <button className="button primary" type="submit" form="hero-settings-form" disabled={saving}>
            <Save size={17} />
            {saving ? 'Saving...' : 'Save hero'}
          </button>
        </div>
      </div>

      {message.text ? (
        <p className={message.type === 'error' ? 'form-error admin-currency-message' : 'form-note admin-currency-message'}>
          {message.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {message.text}
        </p>
      ) : null}

      <div className="admin-hero-layout">
        <aside className="panel admin-hero-slide-panel">
          <div className="editor-card-heading">
            <div>
              <p className="eyebrow">Slides</p>
              <h2>Hero cards</h2>
            </div>
            <span>{form.slides.length}</span>
          </div>

          <div className="admin-hero-slide-list">
            {form.slides.map((slide, index) => {
              const lines = slide.titleText.split(/\r?\n/).filter(Boolean);
              return (
                <button
                  type="button"
                  className={`admin-hero-slide-tab${index === selectedIndex ? ' active' : ''}`}
                  onClick={() => setSelectedIndex(index)}
                  key={slide.id || index}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{lines[0] || slide.slogan || 'Untitled slide'}</strong>
                  <small>{slide.isActive ? 'Visible' : 'Hidden'}</small>
                </button>
              );
            })}
          </div>

          <div className="admin-hero-slide-actions">
            <button className="button compact" type="button" onClick={addSlide}>
              <Plus size={15} />
              Add
            </button>
            <button className="button compact secondary" type="button" onClick={duplicateSlide}>
              <Copy size={15} />
              Duplicate
            </button>
            <button className="button compact secondary" type="button" onClick={() => moveSlide(-1)} disabled={selectedIndex === 0}>
              <ArrowUp size={15} />
            </button>
            <button className="button compact secondary" type="button" onClick={() => moveSlide(1)} disabled={selectedIndex === form.slides.length - 1}>
              <ArrowDown size={15} />
            </button>
            <button className="button compact secondary danger-soft" type="button" onClick={removeSlide} disabled={form.slides.length <= 1}>
              <Trash2 size={15} />
            </button>
          </div>
        </aside>

        <form id="hero-settings-form" className="panel admin-hero-editor" onSubmit={saveHero}>
          <div className="editor-card-heading">
            <div>
              <p className="eyebrow">Selected card</p>
              <h2>Edit content</h2>
            </div>
            <label className="admin-hero-active-toggle">
              <input
                type="checkbox"
                checked={selectedSlide.isActive}
                onChange={(event) => updateSelected({ isActive: event.target.checked })}
              />
              Visible
            </label>
          </div>

          <div className="admin-hero-editor-grid">
            <label>
              Badge
              <input value={selectedSlide.badge} onChange={(event) => updateSelected({ badge: event.target.value })} />
            </label>
            <label>
              SKU
              <input value={selectedSlide.sku} onChange={(event) => updateSelected({ sku: event.target.value })} />
            </label>
            <label className="span-2">
              Title lines
              <textarea value={selectedSlide.titleText} onChange={(event) => updateSelected({ titleText: event.target.value })} />
            </label>
            <label>
              Slogan
              <input value={selectedSlide.slogan} onChange={(event) => updateSelected({ slogan: event.target.value })} />
            </label>
            <label>
              Button text
              <input value={selectedSlide.ctaText} onChange={(event) => updateSelected({ ctaText: event.target.value })} />
            </label>
            <label className="span-2">
              Description
              <textarea value={selectedSlide.subtext} onChange={(event) => updateSelected({ subtext: event.target.value })} />
            </label>
            <label className="span-2">
              Button URL
              <input value={selectedSlide.ctaUrl} onChange={(event) => updateSelected({ ctaUrl: event.target.value })} placeholder="/products" />
            </label>
          </div>

          <div className="admin-hero-media-grid">
            <section className="admin-hero-media-section">
              <div className="editor-card-heading compact-heading">
                <div>
                  <p className="eyebrow">Image</p>
                  <h3>Hero watch image</h3>
                </div>
                <Image size={20} />
              </div>
              {previewImage ? (
                <div className="admin-hero-media-preview image-preview">
                  <img src={previewImage} alt={selectedSlide.image.alt || 'Hero watch preview'} />
                </div>
              ) : null}
              <label>
                Image URL
                <input value={selectedSlide.image.url} onChange={(event) => updateSelectedImage({ url: event.target.value })} />
              </label>
              <label>
                Image alt text
                <input value={selectedSlide.image.alt} onChange={(event) => updateSelectedImage({ alt: event.target.value })} />
              </label>
              <label className="payment-method-image-upload admin-hero-upload-button">
                <Upload size={17} />
                <span>{uploading === `${selectedIndex}-image` ? 'Uploading image...' : 'Upload image'}</span>
                <input type="file" accept="image/*" onChange={(event) => uploadHeroMedia('image', event)} disabled={uploading === `${selectedIndex}-image`} />
              </label>
            </section>

            <section className="admin-hero-media-section">
              <div className="editor-card-heading compact-heading">
                <div>
                  <p className="eyebrow">Video widget</p>
                  <h3>Popup player media</h3>
                </div>
                <Video size={20} />
              </div>
              {selectedSlide.video.url ? (
                <div className="admin-hero-media-preview video-preview">
                  <video src={mediaUrl(selectedSlide.video.url)} poster={previewVideoThumb} muted controls />
                </div>
              ) : previewVideoThumb ? (
                <div className="admin-hero-media-preview image-preview">
                  <img src={previewVideoThumb} alt={selectedSlide.video.alt || 'Video thumbnail preview'} />
                </div>
              ) : null}
              <label>
                Video URL
                <input value={selectedSlide.video.url} onChange={(event) => updateSelectedVideo({ url: event.target.value })} />
              </label>
              <label>
                Video title
                <input value={selectedSlide.video.title} onChange={(event) => updateSelectedVideo({ title: event.target.value })} />
              </label>
              <label>
                Thumbnail URL
                <input value={selectedSlide.video.thumbnail} onChange={(event) => updateSelectedVideo({ thumbnail: event.target.value })} />
              </label>
              <div className="admin-hero-upload-row">
                <label className="payment-method-image-upload admin-hero-upload-button">
                  <Upload size={17} />
                  <span>{uploading === `${selectedIndex}-video` ? 'Uploading video...' : 'Upload video'}</span>
                  <input type="file" accept="video/*" onChange={(event) => uploadHeroMedia('video', event)} disabled={uploading === `${selectedIndex}-video`} />
                </label>
                <label className="payment-method-image-upload admin-hero-upload-button">
                  <Upload size={17} />
                  <span>{uploading === `${selectedIndex}-thumbnail` ? 'Uploading thumbnail...' : 'Upload thumbnail'}</span>
                  <input type="file" accept="image/*" onChange={(event) => uploadHeroMedia('thumbnail', event)} disabled={uploading === `${selectedIndex}-thumbnail`} />
                </label>
              </div>
            </section>
          </div>

          <section className="admin-hero-style-section">
            <div className="editor-card-heading compact-heading">
              <div>
                <p className="eyebrow">Visual style</p>
                <h3>Colors and background</h3>
              </div>
            </div>
            <div className="admin-hero-editor-grid">
              <label>
                Accent color
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(selectedSlide.accentColor) ? selectedSlide.accentColor : defaultHeroSlides[0].accentColor}
                  onChange={(event) => updateSelected({ accentColor: event.target.value, accentColorRgb: hexToRgb(event.target.value) })}
                />
              </label>
              <label>
                Badge text color
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(selectedSlide.badgeColor) ? selectedSlide.badgeColor : defaultHeroSlides[0].badgeColor}
                  onChange={(event) => updateSelected({ badgeColor: event.target.value })}
                />
              </label>
              <label className="span-2">
                Background gradient
                <textarea value={selectedSlide.gradient} onChange={(event) => updateSelected({ gradient: event.target.value })} />
              </label>
              <label>
                Badge background
                <input value={selectedSlide.badgeBg} onChange={(event) => updateSelected({ badgeBg: event.target.value })} />
              </label>
              <label>
                Badge soft background
                <input value={selectedSlide.badgeBgTrans} onChange={(event) => updateSelected({ badgeBgTrans: event.target.value })} />
              </label>
              <label className="span-2">
                Badge soft border
                <input value={selectedSlide.badgeBorderTrans} onChange={(event) => updateSelected({ badgeBorderTrans: event.target.value })} />
              </label>
            </div>
          </section>
        </form>

        <aside className="panel admin-hero-preview-panel">
          <div className="editor-card-heading">
            <div>
              <p className="eyebrow">Preview</p>
              <h2>Storefront card</h2>
            </div>
            <span>{selectedSlide.isActive ? 'Visible' : 'Hidden'}</span>
          </div>
          <div className="admin-hero-preview" style={{ background: selectedSlide.gradient }}>
            <div
              className="admin-hero-preview-copy"
              style={{
                '--preview-accent': selectedSlide.accentColor,
                '--preview-badge-bg': selectedSlide.badgeBg,
                '--preview-badge-color': selectedSlide.badgeColor
              }}
            >
              {selectedSlide.badge ? <span>{selectedSlide.badge}</span> : null}
              <small>{selectedSlide.sku}</small>
              <strong>{previewTitle[0] || 'Hero title'}</strong>
              <em>{selectedSlide.slogan}</em>
              <p>{selectedSlide.subtext}</p>
            </div>
            {previewImage ? <img src={previewImage} alt={selectedSlide.image.alt || 'Hero preview'} /> : null}
            {selectedSlide.video.url ? (
              <div className="admin-hero-preview-video">
                <img src={previewVideoThumb} alt={selectedSlide.video.alt || 'Video thumbnail'} />
                <span className="play-button-custom" aria-hidden="true">
                  <span className="play-icon-circle"></span>
                </span>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
};
