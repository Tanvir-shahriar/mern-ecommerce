import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Trash2, GripVertical, Save, CheckCircle2, AlertCircle, ImageOff, Upload } from 'lucide-react';
import { AdminNav } from '../components/AdminNav.jsx';
import { Seo } from '../components/Seo.jsx';
import { AdminLoadingState } from '../components/AdminLoadingState.jsx';
import { api, mediaUrl, apiErrorMessage } from '../services/api.js';

export const AdminGalleryPage = () => {
  const queryClient = useQueryClient();
  const [images, setImages] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'success' | 'error'
  const [saveMessage, setSaveMessage] = useState('');
  const [dragOverZone, setDragOverZone] = useState(false);
  const initializedRef = useRef(false);

  // Drag-and-drop reorder state
  const dragIndexRef = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Fetch current gallery
  const { data: galleryData, isLoading } = useQuery({
    queryKey: ['admin-gallery'],
    queryFn: async () => {
      const { data } = await api.get('/gallery');
      return data.data.images;
    }
  });

  // Sync fetched data into local state (only on initial load or after save)
  useEffect(() => {
    if (galleryData && !initializedRef.current) {
      setImages(galleryData);
      setHasChanges(false);
      initializedRef.current = true;
    }
  }, [galleryData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (imagesList) => {
      const { data } = await api.put('/gallery', { images: imagesList });
      return data.data.images;
    },
    onSuccess: (savedImages) => {
      setImages(savedImages);
      setHasChanges(false);
      setSaveStatus('success');
      setSaveMessage('Gallery saved successfully');
      queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
      setTimeout(() => setSaveStatus(null), 3000);
    },
    onError: (err) => {
      setSaveStatus('error');
      setSaveMessage(apiErrorMessage(err));
      setTimeout(() => setSaveStatus(null), 5000);
    }
  });

  // Upload images
  const handleUpload = useCallback(async (files) => {
    if (!files?.length) return;
    setUploading(true);
    setSaveStatus(null);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('images', file));

      const { data } = await api.post('/uploads/gallery', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newImages = data.data.images.map((img) => ({
        url: img.url,
        alt: img.alt || '',
        publicId: img.publicId || '',
        order: images.length
      }));

      setImages((prev) => [...prev, ...newImages]);
      setHasChanges(true);
    } catch (err) {
      setSaveStatus('error');
      setSaveMessage(apiErrorMessage(err));
      setTimeout(() => setSaveStatus(null), 5000);
    } finally {
      setUploading(false);
    }
  }, [images.length]);

  // Delete image
  const handleDelete = useCallback((index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setHasChanges(true);
    setSaveStatus(null);
  }, []);

  // Drag-and-drop handlers
  const handleDragStart = useCallback((e, index) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    // Add slight delay so the dragging class applies after the drag image is captured
    requestAnimationFrame(() => {
      e.target.classList.add('dragging');
    });
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e, dropIndex) => {
    e.preventDefault();
    const dragIndex = dragIndexRef.current;
    setDragOverIndex(null);

    if (dragIndex === null || dragIndex === dropIndex) return;

    setImages((prev) => {
      const updated = [...prev];
      const [dragged] = updated.splice(dragIndex, 1);
      updated.splice(dropIndex, 0, dragged);
      return updated;
    });
    setHasChanges(true);
    setSaveStatus(null);
    dragIndexRef.current = null;
  }, []);

  const handleDragEnd = useCallback((e) => {
    e.target.classList.remove('dragging');
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }, []);

  // Save
  const handleSave = useCallback(() => {
    saveMutation.mutate(images);
  }, [images, saveMutation]);

  return (
    <section className="admin-page admin-gallery-page section">
      <Seo title="Admin Gallery" noIndex />
      <AdminNav />
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Gallery</h1>
        </div>
      </div>

      {isLoading ? (
        <AdminLoadingState label="Loading gallery images" />
      ) : (
        <>
          {/* Upload Zone */}
          <div
            className={`admin-gallery-upload-zone${dragOverZone ? ' dragover' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOverZone(true); }}
            onDragLeave={() => setDragOverZone(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverZone(false);
              handleUpload(e.dataTransfer.files);
            }}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                handleUpload(e.target.files);
                e.target.value = '';
              }}
              disabled={uploading}
            />
            <div className="upload-icon">
              {uploading ? <span className="spinner" /> : <Upload size={36} />}
            </div>
            <p>
              {uploading
                ? 'Uploading images…'
                : <><strong>Click to upload</strong> or drag and drop images here</>
              }
            </p>
          </div>

          {/* Image Grid */}
          {images.length === 0 ? (
            <div className="admin-gallery-empty">
              <ImageOff size={48} />
              <p>No gallery images yet. Upload some above to get started.</p>
            </div>
          ) : (
            <div className="admin-gallery-grid">
              {images.map((img, index) => (
                <div
                  key={`${img.url}-${index}`}
                  className={`admin-gallery-card${dragOverIndex === index ? ' drag-over' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <img src={mediaUrl(img.url)} alt={img.alt || `Gallery image ${index + 1}`} />
                  <div className="admin-gallery-card-overlay">
                    <span className="admin-gallery-card-order">
                      <GripVertical size={12} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      className="admin-gallery-card-delete"
                      onClick={() => handleDelete(index)}
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Save Bar */}
          <div className="admin-gallery-save-bar">
            {saveStatus && (
              <span className={`admin-gallery-status ${saveStatus}`}>
                {saveStatus === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                {saveMessage}
              </span>
            )}
            <button
              type="button"
              className="button save-btn"
              onClick={handleSave}
              disabled={!hasChanges || saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <><span className="spinner tiny" /> Saving…</>
              ) : (
                <><Save size={16} /> Save Gallery</>
              )}
            </button>
          </div>
        </>
      )}
    </section>
  );
};
