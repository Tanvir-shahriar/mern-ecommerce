import { ArrowRight, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo.jsx';
import { defaultBrands } from '../data/brandDefaults.js';
import { api, mediaUrl } from '../services/api.js';

const brandImage = (image) => mediaUrl(typeof image === 'string' ? image : image?.url);
const asFilterLabel = (value) => value || 'All Brands';

const defaultBrandFaqs = [
  {
    id: 'genuine-brand-watches',
    question: 'Are all brand watches genuine?',
    answer: 'LahVenture keeps product and brand details clear so customers can review model, movement, sourcing, and seller information before purchase.'
  },
  {
    id: 'shipping-across-bangladesh',
    question: 'Shipping terms across Bangladesh',
    answer: 'Orders are dispatched with address-aware checkout details and tracking updates for customers across Bangladesh.'
  }
];

export const BrandsPage = () => {
  const [activeFilter, setActiveFilter] = useState('All Brands');

  const { data } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data } = await api.get('/brands');
      return data.data.brands;
    },
    staleTime: 60 * 1000
  });

  const { data: brandPageSettings } = useQuery({
    queryKey: ['brand-page-settings'],
    queryFn: async () => {
      const { data } = await api.get('/brand-page');
      return data.data;
    },
    staleTime: 60 * 1000,
    retry: 1
  });

  const brands = data?.length ? data : defaultBrands;
  const faqs = Array.isArray(brandPageSettings?.faqs) ? brandPageSettings.faqs : defaultBrandFaqs;
  const filterGroups = useMemo(() => (
    ['All Brands', ...new Set(brands.map((brand) => asFilterLabel(brand.filterGroup)).filter((group) => group !== 'All Brands'))]
  ), [brands]);
  const visibleBrands = activeFilter === 'All Brands'
    ? brands
    : brands.filter((brand) => asFilterLabel(brand.filterGroup) === activeFilter);
  const spotlightBrand = brands.find((brand) => brand.isSpotlight) || brands[0];

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'Watch Brands at LahVenture',
        description: 'Explore curated watchmaking brands available at LahVenture Bangladesh.',
        url: window.location.href
      },
      ...(faqs.length
        ? [
            {
              '@type': 'FAQPage',
              mainEntity: faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer
                }
              }))
            }
          ]
        : [])
    ]
  };

  return (
    <main className="brands-page">
      <Seo
        title="Brands | LahVenture Watches"
        description="Discover curated watch brands, Swiss heritage houses, Japanese innovators, minimalist makers, and fashion lifestyle watch labels at LahVenture."
        schemaJson={schema}
      />

      <section className="brands-hero">
        <p className="brands-kicker">The Manufactures</p>
        <h1>Crafting Time Across Generations</h1>
        <p>
          Discover prestigious horological houses, mechanical masterpieces, pioneering
          innovations, and everyday designs selected for lasting character.
        </p>
      </section>

      <section className="brands-filter-bar" aria-label="Brand filters">
        {filterGroups.map((group) => (
          <button
            type="button"
            className={group === activeFilter ? 'active' : ''}
            onClick={() => setActiveFilter(group)}
            key={group}
          >
            {group}
          </button>
        ))}
      </section>

      <section className="brands-grid" aria-label="Watch brands">
        {visibleBrands.map((brand) => (
          <article className="brand-editorial-card" key={brand._id || brand.slug || brand.name}>
            <Link className="brand-editorial-image" to={`/products?brand=${encodeURIComponent(brand.name)}`}>
              <img src={brandImage(brand.image)} alt={brand.image?.alt || `${brand.name} brand`} loading="lazy" />
            </Link>
            <div className="brand-editorial-copy">
              <span>{brand.tagline || brand.filterGroup || 'Watchmaking'}</span>
              <h2>{brand.name}</h2>
              <p>{brand.description || 'Explore selected watches from this brand.'}</p>
            </div>
            <Link className="brand-editorial-link" to={`/products?brand=${encodeURIComponent(brand.name)}`}>
              Explore Collection
              <ArrowRight size={13} />
            </Link>
          </article>
        ))}
      </section>

      {spotlightBrand ? (
        <section className="brand-spotlight-section">
          <div className="brand-spotlight-image">
            <img
              src={brandImage(spotlightBrand.spotlightImage || spotlightBrand.image)}
              alt={spotlightBrand.spotlightImage?.alt || spotlightBrand.image?.alt || `${spotlightBrand.name} spotlight`}
              loading="lazy"
            />
          </div>
          <div className="brand-spotlight-copy">
            <p className="brands-kicker">Brand Spotlight</p>
            <h2>{spotlightBrand.spotlightTitle || `${spotlightBrand.name}: A Distinct Point of View`}</h2>
            <p>
              {spotlightBrand.spotlightDescription || spotlightBrand.description || 'Explore the house style, design language, and collection details behind this featured brand.'}
            </p>
            <div className="brand-spotlight-facts">
              <div>
                <span>Founded</span>
                <strong>{spotlightBrand.founded || 'Curated'}</strong>
              </div>
              <div>
                <span>Origin</span>
                <strong>{spotlightBrand.origin || 'Global'}</strong>
              </div>
            </div>
            <Link className="brand-spotlight-button" to={`/products?brand=${encodeURIComponent(spotlightBrand.name)}`}>
              Discover the Legacy
            </Link>
          </div>
        </section>
      ) : null}

      {faqs.length ? (
        <section className="brands-faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="brands-faq-list">
            {faqs.map((faq) => (
              <details key={faq.id || faq.question}>
                <summary>
                  {faq.question}
                  <ChevronDown size={18} />
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
};
