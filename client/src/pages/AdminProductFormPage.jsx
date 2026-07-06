import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  ImagePlus,
  PackageCheck,
  Plus,
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

const productTypes = [
  { value: 'physical', label: 'Physical product' },
  { value: 'digital', label: 'Digital product' },
  { value: 'service', label: 'Service' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'gift_card', label: 'Gift card' },
  { value: 'other', label: 'Other' }
];

const newAttribute = () => ({ name: '', value: '' });
const newVariant = () => ({ name: '', optionsText: '' });

const initialForm = {
  name: '',
  brand: '',
  vendor: '',
  productType: 'physical',
  barcode: '',
  sku: '',
  category: '',
  status: 'active',
  price: '',
  compareAtPrice: '',
  cost: '',
  stock: '',
  lowStockThreshold: '5',
  trackQuantity: true,
  imageUrl: '',
  images: [],
  shortDescription: '',
  description: '',
  tags: '',
  isFeatured: false,
  attributes: [],
  variants: [],
  shippingWeight: '',
  shippingLength: '',
  shippingWidth: '',
  shippingHeight: '',
  freeShipping: false,
  seoTitle: '',
  seoDescription: ''
};

const productToForm = (product, categories) => ({
  name: product.name || '',
  brand: product.brand || '',
  vendor: product.vendor || '',
  productType: product.productType || 'physical',
  barcode: product.barcode || '',
  sku: product.sku || '',
  category: typeof product.category === 'object' ? product.category?._id || '' : product.category || categories[0]?._id || '',
  status: product.status || 'active',
  price: product.price ?? '',
  compareAtPrice: product.compareAtPrice ?? '',
  cost: product.cost ?? '',
  stock: product.inventory?.stock ?? '',
  lowStockThreshold: product.inventory?.lowStockThreshold ?? '5',
  trackQuantity: product.inventory?.trackQuantity !== false,
  imageUrl: '',
  images: product.images || [],
  shortDescription: product.shortDescription || '',
  description: product.description || '',
  tags: (product.tags || []).join(', '),
  isFeatured: Boolean(product.isFeatured),
  attributes: (product.attributes || []).map((attribute) => ({
    name: attribute.name || '',
    value: attribute.value || ''
  })),
  variants: (product.variants || []).map((variant) => ({
    name: variant.name || '',
    optionsText: (variant.options || []).join(', ')
  })),
  shippingWeight: product.shipping?.weight ?? '',
  shippingLength: product.shipping?.dimensions?.length ?? '',
  shippingWidth: product.shipping?.dimensions?.width ?? '',
  shippingHeight: product.shipping?.dimensions?.height ?? '',
  freeShipping: Boolean(product.shipping?.freeShipping),
  seoTitle: product.seo?.title || '',
  seoDescription: product.seo?.description || ''
});

const splitTags = (tags) =>
  tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

const splitOptions = (options) =>
  options
    .split(',')
    .map((option) => option.trim())
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
    }
  }, [isEdit, product?._id]);

  useEffect(() => {
    if (!isEdit && categories[0]?._id) {
      setForm((current) => (current.category ? current : { ...current, category: categories[0]._id }));
    }
  }, [categories, isEdit]);

  const coverImage = form.images[0];
  const selectedCategory = useMemo(
    () => categories.find((category) => category._id === form.category),
    [categories, form.category]
  );

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateAttribute = (index, key, value) => {
    setForm((current) => ({
      ...current,
      attributes: current.attributes.map((attribute, attributeIndex) =>
        attributeIndex === index ? { ...attribute, [key]: value } : attribute
      )
    }));
  };

  const addAttribute = () => {
    setForm((current) => ({ ...current, attributes: [...current.attributes, newAttribute()] }));
  };

  const removeAttribute = (index) => {
    setForm((current) => ({
      ...current,
      attributes: current.attributes.filter((_attribute, attributeIndex) => attributeIndex !== index)
    }));
  };

  const updateVariant = (index, key, value) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [key]: value } : variant
      )
    }));
  };

  const addVariant = () => {
    setForm((current) => ({ ...current, variants: [...current.variants, newVariant()] }));
  };

  const removeVariant = (index) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.filter((_variant, variantIndex) => variantIndex !== index)
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
      vendor: form.vendor.trim() || undefined,
      productType: form.productType,
      barcode: form.barcode.trim() || undefined,
      sku: form.sku.trim(),
      category: form.category,
      status: form.status,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice === '' ? undefined : Number(form.compareAtPrice),
      cost: form.cost === '' ? undefined : Number(form.cost),
      shortDescription: form.shortDescription.trim() || undefined,
      description: form.description.trim(),
      tags: splitTags(form.tags),
      images: images.map((image) => ({
        ...image,
        alt: image.alt || form.name
      })),
      attributes: form.attributes
        .map((attribute) => ({
          name: attribute.name.trim(),
          value: attribute.value.trim()
        }))
        .filter((attribute) => attribute.name && attribute.value),
      variants: form.variants
        .map((variant) => ({
          name: variant.name.trim(),
          options: splitOptions(variant.optionsText)
        }))
        .filter((variant) => variant.name && variant.options.length),
      inventory: {
        stock: Number(form.stock || 0),
        lowStockThreshold: Number(form.lowStockThreshold || 0),
        trackQuantity: form.trackQuantity
      },
      shipping: {
        weight: form.shippingWeight === '' ? undefined : Number(form.shippingWeight),
        dimensions: {
          length: form.shippingLength === '' ? undefined : Number(form.shippingLength),
          width: form.shippingWidth === '' ? undefined : Number(form.shippingWidth),
          height: form.shippingHeight === '' ? undefined : Number(form.shippingHeight)
        },
        freeShipping: form.freeShipping
      },
      isFeatured: form.isFeatured,
      seo: {
        title: form.seoTitle.trim() || undefined,
        description: form.seoDescription.trim() || undefined
      }
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
      <Seo title={isEdit ? 'Edit Product' : 'New Product'} noIndex />
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
                Brand / Maker
                <input value={form.brand} onChange={(event) => updateField('brand', event.target.value)} placeholder="Apple, Nike, LahVenture, Handmade" />
              </label>
              <label>
                Vendor / Supplier
                <input value={form.vendor} onChange={(event) => updateField('vendor', event.target.value)} placeholder="Supplier, studio, distributor" />
              </label>
              <label>
                Product code / SKU
                <input required value={form.sku} onChange={(event) => updateField('sku', event.target.value)} placeholder="SKU: 214928" />
              </label>
              <label>
                Barcode / GTIN
                <input value={form.barcode} onChange={(event) => updateField('barcode', event.target.value)} placeholder="UPC, EAN, ISBN, or internal barcode" />
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
                Product type
                <select value={form.productType} onChange={(event) => updateField('productType', event.target.value)}>
                  {productTypes.map((type) => (
                    <option value={type.value} key={type.value}>
                      {type.label}
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
                <input value={form.tags} onChange={(event) => updateField('tags', event.target.value)} placeholder="new arrival, gift, eco, premium" />
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
                <input value={form.imageUrl} onChange={(event) => updateField('imageUrl', event.target.value)} placeholder="https://example.com/product.jpg" />
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
                <h2>Custom attributes</h2>
              </div>
              <button className="button compact" type="button" onClick={addAttribute}>
                <Plus size={15} />
                Add attribute
              </button>
            </div>
            <p className="admin-helper-text">
              Add any product facts customers should compare: size, color, material, age range, warranty,
              ingredients, license type, duration, compatibility, or care instructions.
            </p>
            {form.attributes.length ? (
              <div className="dynamic-field-list">
                {form.attributes.map((attribute, index) => (
                  <div className="dynamic-field-row" key={`attribute-${index}`}>
                    <label>
                      Attribute
                      <input value={attribute.name} onChange={(event) => updateAttribute(index, 'name', event.target.value)} placeholder="Material" />
                    </label>
                    <label>
                      Value
                      <input value={attribute.value} onChange={(event) => updateAttribute(index, 'value', event.target.value)} placeholder="Organic cotton" />
                    </label>
                    <button type="button" className="icon-button dynamic-remove-button" onClick={() => removeAttribute(index)} aria-label="Remove attribute">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-inline-note">No custom attributes yet.</p>
            )}
          </div>

          <div className="panel product-editor-card">
            <div className="editor-card-heading">
              <div>
                <p className="eyebrow">Options</p>
                <h2>Variants and choices</h2>
              </div>
              <button className="button compact" type="button" onClick={addVariant}>
                <Plus size={15} />
                Add option
              </button>
            </div>
            <p className="admin-helper-text">
              Use option groups for products with choices such as size, color, finish, license tier,
              duration, bundle, storage, or scent. Separate option values with commas.
            </p>
            {form.variants.length ? (
              <div className="dynamic-field-list">
                {form.variants.map((variant, index) => (
                  <div className="dynamic-field-row" key={`variant-${index}`}>
                    <label>
                      Option name
                      <input value={variant.name} onChange={(event) => updateVariant(index, 'name', event.target.value)} placeholder="Size" />
                    </label>
                    <label>
                      Values
                      <input value={variant.optionsText} onChange={(event) => updateVariant(index, 'optionsText', event.target.value)} placeholder="Small, Medium, Large" />
                    </label>
                    <button type="button" className="icon-button dynamic-remove-button" onClick={() => removeVariant(index)} aria-label="Remove option">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-inline-note">No product options yet.</p>
            )}
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
              <span>{form.brand || selectedCategory?.name || 'Brand or category'}</span>
              <strong>{form.name || 'Product name'}</strong>
              <p>{form.shortDescription || form.description || 'Product summary will appear here.'}</p>
            </div>
            <div className="product-editor-preview-meta">
              <span>Type</span>
              <strong>{productTypes.find((type) => type.value === form.productType)?.label || 'Physical product'}</strong>
              <span>Product code</span>
              <strong>{form.sku || 'SKU'}</strong>
              {form.barcode ? (
                <>
                  <span>Barcode</span>
                  <strong>{form.barcode}</strong>
                </>
              ) : null}
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
                <h2>Pricing and stock</h2>
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
                Cost (private)
                <input type="number" min="0" value={form.cost} onChange={(event) => updateField('cost', event.target.value)} />
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

          <div className="panel product-editor-card">
            <div className="editor-card-heading">
              <div>
                <p className="eyebrow">Fulfillment</p>
                <h2>Shipping details</h2>
              </div>
              <span>Optional</span>
            </div>
            <div className="form-grid product-editor-side-grid">
              <label>
                Weight
                <input type="number" min="0" step="0.01" value={form.shippingWeight} onChange={(event) => updateField('shippingWeight', event.target.value)} placeholder="kg" />
              </label>
              <label>
                Length
                <input type="number" min="0" step="0.01" value={form.shippingLength} onChange={(event) => updateField('shippingLength', event.target.value)} />
              </label>
              <label>
                Width
                <input type="number" min="0" step="0.01" value={form.shippingWidth} onChange={(event) => updateField('shippingWidth', event.target.value)} />
              </label>
              <label>
                Height
                <input type="number" min="0" step="0.01" value={form.shippingHeight} onChange={(event) => updateField('shippingHeight', event.target.value)} />
              </label>
              <label className="checkbox-row span-2">
                <input type="checkbox" checked={form.freeShipping} onChange={(event) => updateField('freeShipping', event.target.checked)} />
                Mark this product as free shipping eligible
              </label>
            </div>
          </div>

          <div className="panel product-editor-card">
            <div className="editor-card-heading">
              <div>
                <p className="eyebrow">SEO</p>
                <h2>Search appearance</h2>
              </div>
              <span>Optional</span>
            </div>
            <div className="form-grid product-editor-side-grid">
              <label className="span-2">
                SEO title
                <input value={form.seoTitle} onChange={(event) => updateField('seoTitle', event.target.value)} placeholder={form.name || 'Search result title'} />
              </label>
              <label className="span-2">
                SEO description
                <textarea rows="3" value={form.seoDescription} onChange={(event) => updateField('seoDescription', event.target.value)} placeholder="Short search result summary" />
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
