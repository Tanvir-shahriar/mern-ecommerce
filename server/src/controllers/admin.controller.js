import { Order } from '../models/order.model.js';
import { Product } from '../models/product.model.js';
import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { presentOrders } from '../utils/orderPresenter.js';

export const getDashboard = asyncHandler(async (_req, res) => {
  const [ordersCount, productsCount, usersCount, revenue, lowStockProducts, recentOrders] =
    await Promise.all([
      Order.countDocuments(),
      Product.countDocuments({ status: { $ne: 'archived' } }),
      User.countDocuments(),
      Order.aggregate([
        { $match: { status: { $nin: ['cancelled', 'refunded'] } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$pricing.total' },
            averageOrderValue: { $avg: '$pricing.total' }
          }
        }
      ]),
      Product.find({
        status: 'active',
        $expr: { $lte: ['$inventory.stock', '$inventory.lowStockThreshold'] }
      })
        .select('name slug sku inventory images')
        .limit(8)
        .lean(),
      Order.find().populate('user', 'name email phone role status').sort('-createdAt').limit(8).lean()
    ]);

  res.json({
    status: 'success',
    data: {
      metrics: {
        ordersCount,
        productsCount,
        usersCount,
        totalRevenue: revenue[0]?.totalRevenue || 0,
        averageOrderValue: revenue[0]?.averageOrderValue || 0
      },
      lowStockProducts,
      recentOrders: presentOrders(recentOrders)
    }
  });
});
