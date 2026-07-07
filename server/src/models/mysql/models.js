import { JsonModel } from './jsonModel.js';

const registry = {};

registry.User = new JsonModel('User', 'users', { registry });
registry.Brand = new JsonModel('Brand', 'brands', { registry });
registry.Category = new JsonModel('Category', 'categories', { registry });
registry.Product = new JsonModel('Product', 'products', { registry });
registry.Coupon = new JsonModel('Coupon', 'coupons', { registry });
registry.Cart = new JsonModel('Cart', 'carts', { registry });
registry.Order = new JsonModel('Order', 'orders', { registry });
registry.CurrencySetting = new JsonModel('CurrencySetting', 'currency_settings', { registry });
registry.PaymentSetting = new JsonModel('PaymentSetting', 'payment_settings', { registry });
registry.Gallery = new JsonModel('Gallery', 'galleries', { registry });
registry.HeroSetting = new JsonModel('HeroSetting', 'hero_settings', { registry });
registry.SearchLog = new JsonModel('SearchLog', 'search_logs', { registry });
registry.ContactMessage = new JsonModel('ContactMessage', 'contact_messages', { registry });

export const mysqlModels = registry;
