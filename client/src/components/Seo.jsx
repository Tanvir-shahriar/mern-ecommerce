import { useEffect } from 'react';

export const Seo = ({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  schemaJson,
  noIndex = false
}) => {
  useEffect(() => {
    // 1. Dynamic Page Title
    const defaultTitle = 'LahVenture Watches | Luxury Timepieces & Smartwatches';
    document.title = title ? `${title} | LahVenture` : defaultTitle;

    // Helper to update meta tag by name or property
    const updateMeta = (selector, content) => {
      if (!content) return;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (selector.startsWith('meta[name=')) {
          const name = selector.match(/name="([^"]+)"/)?.[1];
          if (name) element.setAttribute('name', name);
        } else if (selector.startsWith('meta[property=')) {
          const property = selector.match(/property="([^"]+)"/)?.[1];
          if (property) element.setAttribute('property', property);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Meta Description & Keywords
    const defaultDescription = "LahVenture is Bangladesh's premier luxury watch and smartwatch destination featuring curated mechanical timepieces, Haute Horlogerie, and authentic smartwatches.";
    updateMeta('meta[name="description"]', description || defaultDescription);

    if (keywords) {
      updateMeta('meta[name="keywords"]', keywords);
    }

    // 3. Robots (noindex for private pages)
    updateMeta('meta[name="robots"]', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    // 4. Open Graph & Twitter
    const currentUrl = canonicalUrl || window.location.href;
    const defaultImage = `${window.location.origin}/jupiter_watch.png`;
    const imageToUse = ogImage ? (ogImage.startsWith('http') ? ogImage : `${window.location.origin}${ogImage}`) : defaultImage;

    updateMeta('meta[property="og:title"]', title || defaultTitle);
    updateMeta('meta[property="og:description"]', description || defaultDescription);
    updateMeta('meta[property="og:url"]', currentUrl);
    updateMeta('meta[property="og:type"]', ogType);
    updateMeta('meta[property="og:image"]', imageToUse);

    updateMeta('meta[name="twitter:title"]', title || defaultTitle);
    updateMeta('meta[name="twitter:description"]', description || defaultDescription);
    updateMeta('meta[name="twitter:image"]', imageToUse);

    // 5. Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', currentUrl);

    // 6. Schema.org JSON-LD Structured Data
    let scriptTag = document.getElementById('json-ld-structured-data');
    if (schemaJson) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'json-ld-structured-data';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(schemaJson);
    } else if (scriptTag) {
      scriptTag.remove();
    }
  }, [title, description, keywords, canonicalUrl, ogImage, ogType, schemaJson, noIndex]);

  return null;
};
