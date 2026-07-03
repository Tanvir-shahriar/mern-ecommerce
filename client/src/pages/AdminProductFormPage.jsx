import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  ImagePlus,
  PackageCheck,
  Save,
  Star,
  UploadCloud,
  X
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AdminLoadingState } from '../components/AdminLoadingState.jsx';
import { AdminNav } from '../components/AdminNav.jsx';
import { Seo } from '../components/Seo.jsx';
import { api, apiErrorMessage, mediaUrl } from '../services/api.js';
import { money } from '../utils/format.js';

const MAX_PRODUCT_IMAGES = 8;
const MAX_PRODUCT_IMAGE_SIZE_MB = 4;
const MAX_PRODUCT_IMAGE_SIZE_BYTES = MAX_PRODUCT_IMAGE_SIZE_MB * 1024 * 1024;

const watchSpecFields = [
  { key: 'movement', label: 'Movement', placeholder: 'AUTOMATIC' },
  { key: 'caseMetal', label: 'Case Metal', placeholder: 'Stainless Steel' },
  { key: 'caseSize', label: 'Case Size', placeholder: '42 mm' },
  { key: 'caseColor', label: 'Case Color', placeholder: 'Stainless Steel' },
  { key: 'braceletMaterial', label: 'Bracelet Material', placeholder: 'Stainless Steel' },
  { key: 'braceletColor', label: 'Bracelet Color', placeholder: 'Stainless Steel' },
  { key: 'glass', label: 'Glass', placeholder: 'Sapphire' },
  { key: 'dialColor', label: 'Dial Color', placeholder: 'Black' },
  { key: 'buckle', label: 'Buckle', placeholder: 'Butterfly Buckle with Double push' },
  { key: 'waterResistance', label: 'WR', placeholder: '5 ATM' }
];

const blankSpecs = watchSpecFields.reduce((values, field) => ({ ...values, [field.key]: '' }), {});

const initialForm = {
  name: '',
  brand: '',
  sku: '',
  category: '',
  status: 'active',
  price: '',
  compareAtPrice: '',
  stock: '',
  lowStockThreshold: '5',
  trackQuantity: true,
  imageUrl: '',
  images: [],
  shortDescription: '',
  description: '',
  tags: '',
  isFeatured: false,
  specs: blankSpecs
};

const attributeValue = (attributes = [], label) => {
  const found = attributes.find((item) => String(item.name || '').toLowerCase() === label.toLowerCase());
  return found?.value || '';
};

const productToForm = (product, categories) => ({
  name: product.name || '',
  brand: product.brand || '',
  sku: product.sku || '',
  category: typeof product.category === 'object' ? product.category?._id || '' : product.category || categories[0]?._id || '',
  status: product.status || 'active',
  price: product.price ?? '',
  compareAtPrice: product.compareAtPrice ?? '',
  stock: product.inventory?.stock ?? '',
  lowStockThreshold: product.inventory?.lowStockThreshold ?? '5',
  trackQuantity: product.inventory?.trackQuantity !== false,
  imageUrl: '',
  images: product.images || [],
  shortDescription: product.shortDescription || '',
  description: product.description || '',
  tags: (product.tags || []).join(', '),
  isFeatured: Boolean(product.isFeatured),
  specs: watchSpecFields.reduce(
    (values, field) => ({
      ...values,
      [field.key]: attributeValue(product.attributes, field.label)
    }),
    {}
  )
});

const splitTags = (tags) =>
  tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

export const AdminProductFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data.data.categories;
    }
  });

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['admin-product-edit', id],
    enabled: isEdit,
    queryFn: async () => {
      const { data } = await api.get(`/products/${id}`, { params: { admin: true } });
      return data.data.product;
    }
  });

  useEffect(() => {
    if (isEdit && product) {
      setForm(productToForm(product, categories));
      return;
    }

    if (!isEdit && categories[0]?._id && !form.category) {
      setForm((current) => ({ ...current, category: categories[0]._id }));
    }
  }, [categories, form.category, isEdit, product]);

  const coverImage = form.images[0];
  const selectedCategory = useMemo(
    () => categories.find((category) => category._id === form.category),
    [categories, form.category]
  );

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateSpec = (key, value) => {
    setForm((current) => ({
      ...current,
      specs: {
        ...current.specs,
        [key]: value
      }
    }));
  };

  const uploadProductImages = async (files) => {
    if (!files.length) return;

    if (form.images.length + files.length > MAX_PRODUCT_IMAGES) {
      setMessage(`Upload up to ${MAX_PRODUCT_IMAGES} images for one product`);
      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES);
    if (oversizedFile) {
      setMessage(`${oversizedFile.name} is too large. Upload images up to ${MAX_PRODUCT_IMAGE_SIZE_MB}MB each.`);
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));

    setUploadingImages(true);
    setMessage('');
    try {
      const { data } = await api.post('/uploads/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setForm((current) => ({
        ...current,
        images: [...current.images, ...data.data.images]
      }));
      setMessage(`${data.data.images.length} image(s) uploaded`);
    } catch (error) {
      setMessage(apiErrorMessage(error));
    } finally {
      setUploadingImages(false);
    }
  };

  const addImageUrl = () => {
    const url = form.imageUrl.trim();
    if (!url) return;

    if (form.images.length >= MAX_PRODUCT_IMAGES) {
      setMessage(`Upload up to ${MAX_PRODUCT_IMAGES} images for one product`);
      return;
    }

    setForm((current) => ({
      ...current,
      imageUrl: '',
      images: [...current.images, { url, alt: current.name }]
    }));
  };

  const removeImage = (index) => {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_image, imageIndex) => imageIndex !== index)
    }));
  };

  const setCoverImage = (index) => {
    setForm((current) => {
      const nextImages = [...current.images];
      const [selected] = nextImages.splice(index, 1);
      return {
        ...current,
        images: [selected, ...nextImages]
      };
    });
  };

  const buildPayload = () => {
    const imageUrl = form.imageUrl.trim();
    const images = imageUrl ? [...form.images, { url: imageUrl, alt: form.name }] : form.images;

    return {
      name: form.name.trim(),
      brand: form.brand.trim(),
      sku: form.sku.trim(),
      category: form.category,
      status: form.status,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice === '' ? undefined : Number(form.compareAtPrice),
      shortDescription: form.shortDescription.trim() || undefined,
      description: form.description.trim(),
      tags: splitTags(form.tags),
      images: images.map((image) => ({
        ...image,
        alt: image.alt || form.name
      })),
      attributes: watchSpecFields
        .map((field) => ({
          name: field.label,
          value: form.specs[field.key]?.trim()
        }))
        .filter((item) => item.value),
      inventory: {
        stock: Number(form.stock || 0),
        lowStockThreshold: Number(form.lowStockThreshold || 0),
        trackQuantity: form.trackQuantity
      },
      isFeatured: form.isFeatured
    };
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      if (!form.images.length && !form.imageUrl.trim()) {
        setMessage('Upload at least one product image or add an image URL');
        return;
      }

      if (!form.category) {
        setMessage('Create or select a category before saving this product');
        return;
      }

      const payload = buildPayload();
      if (isEdit) {
        await api.patch(`/products/${id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      navigate('/admin/products');
    } catch (error) {
      setMessage(apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && productLoading) {
    return (
      <section className="admin-page section">
        <Seo title="Product Editor" noIndex />
        <AdminNav />
        <AdminLoadingState label="Loading product editor" />
      </section>
    );
  }

  return (
    <section className="admin-page section">
      <Seo title={isEditing ? 'Edit Product' : 'New Product'} noIndex />
      <AdminNav />
      <Link className="back-link" to="/admin/products">
        <ArrowLeft size={17} />
        Back to inventory
      </Link>

      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1>{isEdit ? 'Edit product' : 'Add product'}</h1>
        </div>
        <button className="button primary" type="submit" form="admin-product-form" disabled={saving || uploadingImages}>
          <Save size={17} />
          {saving ? 'Saving...' : isEdit ? 'Update product' : 'Publish product'}
        </button>
      </div>

      <form id="admin-product-form" className="admin-product-editor" onSubmit={saveProduct}>
        <div className="product-editor-main">
          <div className="panel product-editor-card">
            <div className="editor-card-heading">
              <div>
                <p className="eyebrow">Core</p>
                <h2>Product identity</h2>
              </div>
              <span>Required</span>
            </div>
            <div className="form-grid">
              <label>
                Product name
                <input required value={form.name} onChange={(event) => updateField('name', event.target.value)} />
              </label>
              <label>
                Family / Brand
                <input value={form.brand} onChange={(event) => updateField('brand', event.target.value)} placeholder="Patek, Sea-Gull, San Martin" />
              </label>
              <label>
                Product code / SKU
                <input required value={form.sku} onChange={(event) => updateField('sku', event.target.value)} placeholder="SKU: 214928" />
              </label>
              <label>
                Category
                <select required value={form.category} onChange={(event) => updateField('category', event.target.value)}>
                  <option value="" disabled>Select category</option>
                  {categories.map((category) => (
                    <option value={category._id} key={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label>
                Tags
                <input value={form.tags} onChange={(event) => updateField('tags', event.target.value)} placeholder="automatic, sapphire, dress" />
              </label>
              <label className="span-2">
                Short description
                <input value={form.shortDescription} onChange={(event) => updateField('shortDescription', event.target.value)} />
              </label>
              <label className="span-2">
                Description
                <textarea required value={form.description} onChange={(event) => updateField('description', event.target.value)} />
              </label>
              <label className="checkbox-row span-2">
                <input type="checkbox" checked={form.isFeatured} onChange={(event) => updateField('isFeatured', event.target.checked)} />
                Feature on storefront
              </label>
            </div>
          </div>

          <div className="panel product-editor-card">
            <div className="editor-card-heading">
              <div>
                <p className="eyebrow">Media</p>
                <h2>Product gallery</h2>
              </div>
              <span>{form.images.length}/{MAX_PRODUCT_IMAGES} images</span>
            </div>
            <label
              className="image-dropzone product-editor-dropzone"
              onDrop={(event) => {
                event.preventDefault();
                uploadProductImages(Array.from(event.dataTransfer.files || []));
              }}
              onDragOver={(event) => event.preventDefault()}
            >
              <UploadCloud size={26} />
              <strong>{uploadingImages ? 'Uploading...' : 'Drop or choose product images'}</strong>
              <small>Upload 3-4 product angles for a stronger gallery. PNG, JPG, WEBP, or GIF up to 4MB each.</small>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={uploadingImages}
                onChange={(event) => {
                  uploadProductImages(Array.from(event.target.files || []));
                  event.target.value = '';
                }}
              />
            </label>

            <div className="image-url-row">
              <label>
                Image URL
                <input value={form.imageUrl} onChange={(event) => updateField('imageUrl', event.target.value)} placeholder="https://example.com/watch.jpg" />
              </label>
              <button className="button dark" type="button" onClick={addImageUrl}>
                <ImagePlus size={17} />
                Add URL
              </button>
            </div>

            {form.images.length ? (
              <div className="uploaded-image-grid product-editor-image-grid">
                {form.images.map((image, index) => (
                  <div className="uploaded-image product-editor-image" key={`${image.publicId || image.url}-${index}`}>
                    <img src={mediaUrl(image.url)} alt={image.alt || form.name || 'Uploaded product'} />
                    <div className="product-editor-image-actions">
                      {index === 0 ? (
                        <span>
                          <Star size={13} fill="currentColor" />
                          Cover
                        </span>
                      ) : (
                        <button type="button" onClick={() => setCoverImage(index)}>
                          Set cover
                        </button>
                      )}
                      <button type="button" onClick={() => removeImage(index)} aria-label="Remove image">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="panel product-editor-card">
            <div className="editor-card-heading">
              <div>
                <p className="eyebrow">Details</p>
                <h2>Watch specifications</h2>
              </div>
              <span>Optional</span>
            </div>
            <div className="watch-spec-grid">
              {watchSpecFields.map((field) => (
                <label key={field.key}>
                  {field.label}
                  <input value={form.specs[field.key] || ''} onChange={(event) => updateSpec(field.key, event.target.value)} placeholder={field.placeholder} />
                </label>
              ))}
            </div>
          </div>
        </div>

        <aside className="product-editor-side">
          <div className="panel product-editor-card product-editor-preview">
            <div className="editor-card-heading">
              <div>
                <p className="eyebrow">Preview</p>
                <h2>Inventory card</h2>
              </div>
              <PackageCheck size={22} />
            </div>
            <div className="product-editor-preview-media">
              {coverImage ? (
                <img src={mediaUrl(coverImage.url)} alt={coverImage.alt || form.name || 'Product preview'} />
              ) : (
                <ImagePlus size={36} />
              )}
            </div>
            <div className="product-editor-preview-copy">
              <span>{form.brand || selectedCategory?.name || 'Family'}</span>
              <strong>{form.name || 'Product name'}</strong>
              <p>{form.shortDescription || form.description || 'Product summary will appear here.'}</p>
            </div>
            <div className="product-editor-preview-meta">
              <span>Product code</span>
              <strong>{form.sku || 'SKU'}</strong>
              <span>Base price</span>
              <strong>{form.price ? money(Number(form.price)) : money(0)}</strong>
              <span>Stock</span>
              <strong>{form.trackQuantity ? `${form.stock || 0} unit(s)` : 'Not tracked'}</strong>
            </div>
          </div>

          <div className="panel product-editor-card">
            <div className="editor-card-heading">
              <div>
                <p className="eyebrow">Pricing</p>
                <h2>Stock control</h2>
              </div>
              <span>{form.status}</span>
            </div>
            <div className="form-grid product-editor-side-grid">
              <label>
                Price (BDT)
                <input required type="number" min="0" value={form.price} onChange={(event) => updateField('price', event.target.value)} />
              </label>
              <label>
                Compare at (BDT)
                <input type="number" min="0" value={form.compareAtPrice} onChange={(event) => updateField('compareAtPrice', event.target.value)} />
              </label>
              <label>
                Stock
                <input type="number" min="0" value={form.stock} onChange={(event) => updateField('stock', event.target.value)} />
              </label>
              <label>
                Low stock alert
                <input type="number" min="0" value={form.lowStockThreshold} onChange={(event) => updateField('lowStockThreshold', event.target.value)} />
              </label>
              <label className="checkbox-row span-2">
                <input type="checkbox" checked={form.trackQuantity} onChange={(event) => updateField('trackQuantity', event.target.checked)} />
                Track product quantity
              </label>
            </div>
          </div>

          {message ? (
            <p className={message.includes('uploaded') ? 'form-note product-editor-message' : 'form-error product-editor-message'}>
              {message.includes('uploaded') ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              {message}
            </p>
          ) : null}
        </aside>
      </form>
    </section>
  );
};
