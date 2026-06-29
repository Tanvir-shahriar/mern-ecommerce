import { Category } from '../models/category.model.js';
import { Product } from '../models/product.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

export const getRobotsTxt = asyncHandler(async (_req, res) => {
  const baseUrl = env.clientUrl.replace(/\/$/, '');
  const robotsTxt = `User-agent: *
Allow: /
Allow: /products
Allow: /products/*
Disallow: /admin
Disallow: /admin/*
Disallow: /cart
Disallow: /checkout
Disallow: /account
Disallow: /orders/*

Sitemap: ${baseUrl}/sitemap.xml
`;

  res.header('Content-Type', 'text/plain');
  res.send(robotsTxt);
});

export const getSitemapXml = asyncHandler(async (_req, res) => {
  const baseUrl = env.clientUrl.replace(/\/$/, '');
  
  // Fetch active products and categories safely across database providers
  const productQuery = Product.find({ status: 'active' });
  const products = typeof productQuery.select === 'function' 
    ? await productQuery.select('slug updatedAt').lean() 
    : await productQuery;

  const categoryQuery = Category.find();
  const categories = typeof categoryQuery.select === 'function' 
    ? await categoryQuery.select('slug updatedAt').lean() 
    : await categoryQuery;

  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'daily' },
    { url: '/products', priority: '0.9', changefreq: 'daily' }
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Static URLs
  for (const page of staticPages) {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  // Category URLs
  for (const cat of categories || []) {
    if (!cat.slug) continue;
    const lastmod = cat.updatedAt ? new Date(cat.updatedAt).toISOString().split('T')[0] : today;
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/products?category=${encodeURIComponent(cat.slug)}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  }

  // Product URLs
  for (const prod of products || []) {
    const identifier = prod.slug || prod._id || prod.id;
    if (!identifier) continue;
    const lastmod = prod.updatedAt ? new Date(prod.updatedAt).toISOString().split('T')[0] : today;
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/products/${identifier}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});
