import { JsonModel } from './jsonModel.js';

const registry = {};

registry.User = new JsonModel('User', 'users', { registry });
registry.Category = new JsonModel('Category', 'categories', { registry });
registry.Product = new JsonModel('Product', 'products', { registry });
registry.Coupon = new JsonModel('Coupon', 'coupons', { registry });
registry.Cart = new JsonModel('Cart', 'carts', { registry });
registry.Order = new JsonModel('Order', 'orders', { registry });

export const mysqlModels = registry;
