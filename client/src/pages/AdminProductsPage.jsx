import { Archive, ImagePlus, Minus, Plus, Save, Search, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { AdminLoadingState } from '../components/AdminLoadingState.jsx';
import { AdminNav } from '../components/AdminNav.jsx';
import { api, apiErrorMessage, mediaUrl } from '../services/api.js';
import { money } from '../utils/format.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';

const productInitial = {
  name: '',
  brand: '',
  sku: '',
  category: '',
  price: '',
  compareAtPrice: '',
  stock: '',
  imageUrl: '',
  uploadedImages: [],
  shortDescription: '',
  description: '',
  isFeatured: false
};

const MAX_PRODUCT_IMAGES = 8;
const MAX_PRODUCT_IMAGE_SIZE_MB = 4;
const MAX_PRODUCT_IMAGE_SIZE_BYTES = MAX_PRODUCT_IMAGE_SIZE_MB * 1024 * 1024;

export const AdminProductsPage = () => {
  const [productForm, setProductForm] = useState(productInitial);
  const [categoryName, setCategoryName] = useState('');
  const [message, setMessage] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const debouncedSearch = useDebouncedValue(search);
  const queryClient = useQueryClient();

  const { data: productData, isLoading: productsLoading, isFetching: productsFetching } = useQuery({
    queryKey: ['admin-products', debouncedSearch, statusFilter],
    queryFn: async () => {
      const { data } = await api.get('/products', {
        params: {
          admin: true,
          limit: 50,
          sort: 'newest',
          search: debouncedSearch || undefined,
          status: statusFilter
        }
      });
      return data.data.products;
    }
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data.data.categories;
    }
  });

  const formCategory = useMemo(() => productForm.category || categories[0]?._id || '', [productForm.category, categories]);

  const updateProductForm = (key, value) => {
    setProductForm((current) => ({ ...current, [key]: value }));
  };

  const uploadProductImages = async (files) => {
    if (!files.length) return;

    if (productForm.uploadedImages.length + files.length > MAX_PRODUCT_IMAGES) {
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

      setProductForm((current) => ({
        ...current,
        uploadedImages: [...current.uploadedImages, ...data.data.images]
      }));
      setMessage('Image uploaded');
    } catch (error) {
      setMessage(apiErrorMessage(error));
    } finally {
      setUploadingImages(false);
    }
  };

  const removeUploadedImage = (publicId) => {
    setProductForm((current) => ({
      ...current,
      uploadedImages: current.uploadedImages.filter((image) => image.publicId !== publicId)
    }));
  };

  const createCategory = async (event) => {
    event.preventDefault();
    if (!categoryName.trim()) return;
    try {
      await api.post('/categories', { name: categoryName });
      setCategoryName('');
      setMessage('Category created');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (error) {
      setMessage(apiErrorMessage(error));
    }
  };

  const createProduct = async (event) => {
    event.preventDefault();
    try {
      if (!productForm.uploadedImages.length && !productForm.imageUrl.trim()) {
        setMessage('Upload at least one image or add an image URL');
        return;
      }

      const images = productForm.uploadedImages.length
        ? productForm.uploadedImages.map((image) => ({
            ...image,
            alt: productForm.name || image.alt
          }))
        : [
            {
              url: productForm.imageUrl,
              alt: productForm.name
            }
          ];

      const payload = {
        name: productForm.name,
        brand: productForm.brand,
        sku: productForm.sku,
        category: formCategory,
        price: Number(productForm.price),
        compareAtPrice: productForm.compareAtPrice ? Number(productForm.compareAtPrice) : undefined,
        shortDescription: productForm.shortDescription,
        description: productForm.description,
        isFeatured: productForm.isFeatured,
        inventory: {
          stock: Number(productForm.stock || 0),
          lowStockThreshold: 5,
          trackQuantity: true
        },
        images,
        status: 'active'
      };

      await api.post('/products', payload);
      setProductForm(productInitial);
      setMessage('Product created');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      setMessage(apiErrorMessage(error));
    }
  };

  const archiveProduct = async (id) => {
    const product = productData?.find((item) => item._id === id);
    if (!window.confirm(`Archive ${product?.name || 'this product'}? It will be removed from the storefront.`)) return;

    try {
      const { data } = await api.delete(`/products/${id}`);
      setMessage(data.message || 'Product archived');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      setMessage(apiErrorMessage(error));
    }
  };

  const updateStock = async (productId, payload) => {
    try {
      const { data } = await api.patch(`/products/${productId}/stock`, payload);
      setMessage(`${data.data.product.name} stock updated to ${data.data.product.inventory.stock}`);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    } catch (error) {
      setMessage(apiErrorMessage(error));
    }
  };

  return (
    <section className="admin-page section">
      <AdminNav />
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Products</h1>
        </div>
      </div>

      <div className="admin-products-layout">
        <div className="panel">
          <div className="panel-heading">
            <h2>Inventory</h2>
            <span>{productsFetching ? <span className="admin-fetching"><span className="spinner tiny" /> Syncing</span> : `${productData?.length || 0} items`}</span>
          </div>
          <div className="admin-toolbar">
            <label className="search-field">
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search watch, SKU, brand" />
            </label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Product status">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          {productsLoading ? (
            <AdminLoadingState label="Loading inventory" />
          ) : (
            <div className="admin-product-list">
              {productData?.map((product) => (
                <article className="admin-product-row" key={product._id}>
                  <img src={mediaUrl(product.images?.[0]?.url)} alt={product.name} />
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.sku}</span>
                    <span className={`inventory-status ${product.status}`}>{product.status}</span>
                  </div>
                  <span>{money(product.price)}</span>
                  <div className="stock-controls">
                    <button type="button" onClick={() => updateStock(product._id, { delta: -1 })} aria-label="Decrease stock">
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={product.inventory.stock}
                      onChange={(event) => updateStock(product._id, { stock: Number(event.target.value) })}
                      aria-label={`Stock for ${product.name}`}
                    />
                    <button type="button" onClick={() => updateStock(product._id, { delta: 1 })} aria-label="Increase stock">
                      <Plus size={14} />
                    </button>
                  </div>
                  <button type="button" className="icon-button" onClick={() => archiveProduct(product._id)} aria-label="Archive product" disabled={product.status === 'archived'}>
                    <Archive size={16} />
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="stack">
          <form className="form-panel" onSubmit={createCategory}>
            <h2>New category</h2>
            <label>
              Name
              <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
            </label>
            <button className="button dark" type="submit">
              <Plus size={17} />
              Add category
            </button>
          </form>

          <form className="form-panel" onSubmit={createProduct}>
            <h2>New product</h2>
            <div className="form-grid">
              <label>
                Name
                <input required value={productForm.name} onChange={(event) => updateProductForm('name', event.target.value)} />
              </label>
              <label>
                Brand
                <input value={productForm.brand} onChange={(event) => updateProductForm('brand', event.target.value)} />
              </label>
              <label>
                SKU
                <input required value={productForm.sku} onChange={(event) => updateProductForm('sku', event.target.value)} />
              </label>
              <label>
                Category
                <select value={formCategory} onChange={(event) => updateProductForm('category', event.target.value)}>
                  {categories.map((category) => (
                    <option value={category._id} key={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Price
                <input required type="number" min="0" value={productForm.price} onChange={(event) => updateProductForm('price', event.target.value)} />
              </label>
              <label>
                Compare at
                <input type="number" min="0" value={productForm.compareAtPrice} onChange={(event) => updateProductForm('compareAtPrice', event.target.value)} />
              </label>
              <label>
                Stock
                <input type="number" min="0" value={productForm.stock} onChange={(event) => updateProductForm('stock', event.target.value)} />
              </label>
              <div className="image-upload-field span-2">
                <span>Product images</span>
                <label className="image-dropzone">
                  <ImagePlus size={24} />
                  <strong>{uploadingImages ? 'Uploading...' : 'Upload images'}</strong>
                  <small>PNG, JPG, WEBP, or GIF. Up to 4MB each, 8 images total.</small>
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
                {productForm.uploadedImages.length ? (
                  <div className="uploaded-image-grid">
                    {productForm.uploadedImages.map((image) => (
                      <div className="uploaded-image" key={image.publicId || image.url}>
                        <img src={mediaUrl(image.url)} alt={image.alt || productForm.name || 'Uploaded product'} />
                        <button type="button" onClick={() => removeUploadedImage(image.publicId)} aria-label="Remove image">
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <label className="span-2">
                Image URL fallback
                <input
                  value={productForm.imageUrl}
                  onChange={(event) => updateProductForm('imageUrl', event.target.value)}
                  placeholder="https://example.com/product.jpg"
                />
              </label>
              <label className="span-2">
                Short description
                <input value={productForm.shortDescription} onChange={(event) => updateProductForm('shortDescription', event.target.value)} />
              </label>
              <label className="span-2">
                Description
                <textarea required value={productForm.description} onChange={(event) => updateProductForm('description', event.target.value)} />
              </label>
              <label className="checkbox-row span-2">
                <input type="checkbox" checked={productForm.isFeatured} onChange={(event) => updateProductForm('isFeatured', event.target.checked)} />
                Featured product
              </label>
            </div>
            {message ? <p className="form-note">{message}</p> : null}
            <button className="button primary" type="submit">
              <Save size={17} />
              Save product
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
